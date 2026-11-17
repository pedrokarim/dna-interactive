import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";
import { renderContactEmail } from "@/lib/email/contact-email";
import { createEmailEvent, injectPixel } from "@/lib/email/tracking";
import { checkRateLimit } from "@/lib/rate-limit";
import { getApiTranslator } from "@/lib/api-locale";

// Les messages d'erreur sont des clés `apiErrors`, traduites dans POST.
const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, "nameTooShort")
    .max(100, "nameTooLong")
    .trim()
    .regex(
      /^[a-zA-ZÀ-ÿ\s'-]+$/,
      "nameInvalidChars"
    ),

  email: z
    .string()
    .email("emailInvalid")
    .max(254, "emailTooLong")
    .toLowerCase()
    .trim(),

  subject: z.enum(["bug", "suggestion", "question", "partnership", "other"]),

  message: z
    .string()
    .min(10, "messageTooShort")
    .max(5000, "messageTooLong")
    .trim(),

  recaptchaToken: z.string().min(1, "recaptchaMissing"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

// SMTP de LWS.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Pas de `tls.rejectUnauthorized: false` : le certificat LWS est valide, on
  // garde la vérification TLS. Pas de debug/logger non plus, ils écriraient
  // les destinataires et le dialogue SMTP dans les logs du serveur.
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000,
});

async function verifyRecaptcha(token: string): Promise<boolean> {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.warn("RECAPTCHA_SECRET_KEY not configured");
      return false;
    }

    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        // Encodé : un jeton contenant `&` ne doit pas pouvoir ajouter de paramètre.
        body: new URLSearchParams({ secret: secretKey, response: token }).toString(),
      }
    );

    const data = await response.json();

    if (!data.success) {
      console.warn("reCAPTCHA verification failed:", data["error-codes"]);
      return false;
    }

    // Seuil à 0.7, plus strict que le 0.5 conseillé par Google.
    if (data.score < 0.7) {
      console.warn("reCAPTCHA score too low:", data.score);
      return false;
    }

    // Un jeton reCAPTCHA expire au bout de 2 minutes.
    const now = Date.now() / 1000;
    if (
      data.challenge_ts &&
      now - new Date(data.challenge_ts).getTime() / 1000 > 120
    ) {
      console.warn("reCAPTCHA token expired");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erreur lors de la vérification reCAPTCHA:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const t = await getApiTranslator(request);

  try {
    // 5 messages par heure et par IP, compteur en base (voir rate-limit.ts).
    const clientIP =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rate = await checkRateLimit(`contact:${clientIP}`, 5, 60 * 60 * 1000);
    if (!rate.ok) {
      return NextResponse.json(
        { error: t("tooManyMessages") },
        { status: 429, headers: { "Retry-After": `${rate.retryAfter}` } },
      );
    }

    // Corps limité à 10 Ko.
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 10240) {
      return NextResponse.json(
        { error: t("payloadTooLarge") },
        { status: 413 }
      );
    }

    const body = await request.json();
    const validationResult = contactFormSchema.safeParse(body);

    if (!validationResult.success) {
      // Un champ absent ou mal typé donne le message anglais de Zod, qui n'est
      // pas une clé `apiErrors` : dans ce cas on renvoie invalidData.
      const key = validationResult.error.issues[0]?.message ?? "";
      return NextResponse.json({ error: t.has(key) ? t(key) : t("invalidData") }, { status: 400 });
    }

    const { name, email, subject, message, recaptchaToken } =
      validationResult.data;

    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!isRecaptchaValid) {
      return NextResponse.json(
        { error: t("recaptchaFailed") },
        { status: 400 }
      );
    }

    if (!process.env.SMTP_PASS) {
      return NextResponse.json(
        { error: t("smtpIncomplete") },
        { status: 500 }
      );
    }

    // On abandonne l'envoi au bout de 30 s.
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Timeout")), 30000);
    });

    const subjectMap: { [key: string]: string } = {
      bug: "🐛 Signalement de bug",
      suggestion: "💡 Suggestion d'amélioration",
      question: "❓ Question générale",
      partnership: "🤝 Demande de partenariat",
      other: "📧 Message général",
    };

    const emailSubject = `${
      subjectMap[subject] || "📧 Nouveau message"
    } - ${name}`;
    // Template React Email aux couleurs du site.
    const emailContent = await renderContactEmail({
      name,
      email,
      subjectLabel: subjectMap[subject] || subject,
      message,
    });

    // Pixel de suivi d'ouverture.
    const contactTo = process.env.CONTACT_EMAIL || "contact@ascencia.re";
    let html = emailContent;
    const pixel = await createEmailEvent(contactTo, "contact");
    if (pixel) html = injectPixel(html, pixel.pixelUrl);

    const mailOptions = {
      from: `"${name}" <${process.env.SMTP_USER || "contact@ascencia.re"}>`,
      to: contactTo,
      subject: emailSubject,
      html,
      replyTo: email,
    };

    await Promise.race([transporter.sendMail(mailOptions), timeoutPromise]);

    const headers = new Headers();
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "DENY");
    headers.set("X-XSS-Protection", "1; mode=block");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    return NextResponse.json(
      { success: true, message: t("contactSendSuccess") },
      {
        status: 200,
        headers,
      }
    );
  } catch (error) {
    console.error("Erreur lors de l'envoi du message:", error);

    // Mêmes headers de sécurité sur la réponse d'erreur.
    const headers = new Headers();
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "DENY");
    headers.set("X-XSS-Protection", "1; mode=block");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    return NextResponse.json(
      { error: t("contactSendFailed") },
      {
        status: 500,
        headers,
      }
    );
  }
}
