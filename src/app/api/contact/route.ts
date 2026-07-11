import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";
import { renderContactEmail } from "@/lib/email/contact-email";
import { createEmailEvent, injectPixel } from "@/lib/email/tracking";

// Schema de validation Zod pour le formulaire de contact
const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .trim()
    .regex(
      /^[a-zA-ZÀ-ÿ\s'-]+$/,
      "Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets"
    ),

  email: z
    .string()
    .email("Adresse email invalide")
    .max(254, "L'adresse email est trop longue")
    .toLowerCase()
    .trim(),

  subject: z.enum(["bug", "suggestion", "question", "partnership", "other"]),

  message: z
    .string()
    .min(10, "Le message doit contenir au moins 10 caractères")
    .max(5000, "Le message ne peut pas dépasser 5000 caractères")
    .trim(),

  recaptchaToken: z.string().min(1, "Token reCAPTCHA manquant"),
});

// Type inféré depuis le schema Zod
type ContactFormData = z.infer<typeof contactFormSchema>;

// Configuration du transporteur SMTP pour LWS
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // Serveur SMTP configurable
  port: 465, // Port SSL/TLS
  secure: true, // SSL/TLS activé
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Pour éviter les problèmes de certificat
  },
  // Options de debug et timeout
  debug: true,
  logger: true,
  connectionTimeout: 60000, // 60 secondes
  greetingTimeout: 30000, // 30 secondes
  socketTimeout: 60000, // 60 secondes
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
        body: `secret=${secretKey}&response=${token}`,
      }
    );

    const data = await response.json();

    // Vérification plus stricte de reCAPTCHA
    if (!data.success) {
      console.warn("reCAPTCHA verification failed:", data["error-codes"]);
      return false;
    }

    // Score minimum plus élevé pour plus de sécurité
    if (data.score < 0.7) {
      console.warn("reCAPTCHA score too low:", data.score);
      return false;
    }

    // Vérifier que le token n'est pas expiré (reCAPTCHA tokens expirent après 2 minutes)
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
  try {
    // Rate limiting basique (par IP)
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Vérifier la taille du body (max 10KB)
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 10240) {
      return NextResponse.json(
        { error: "Requête trop volumineuse" },
        { status: 413 }
      );
    }

    // Parser et valider les données avec Zod
    const body = await request.json();
    const validationResult = contactFormSchema.safeParse(body);

    if (!validationResult.success) {
      // Retourner la première erreur de validation
      const error = validationResult.error.issues[0];
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { name, email, subject, message, recaptchaToken } =
      validationResult.data;

    // Vérification reCAPTCHA
    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!isRecaptchaValid) {
      return NextResponse.json(
        { error: "Vérification reCAPTCHA échouée" },
        { status: 400 }
      );
    }

    // Vérification de la configuration SMTP
    if (!process.env.SMTP_PASS) {
      return NextResponse.json(
        { error: "Configuration SMTP incomplète" },
        { status: 500 }
      );
    }

    // Timeout pour éviter les requêtes trop longues
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Timeout")), 30000); // 30 secondes
    });

    // Préparation du contenu de l'email
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
    // Template React Email au design system DNA (remplace l'ancien HTML inline).
    const emailContent = await renderContactEmail({
      name,
      email,
      subjectLabel: subjectMap[subject] || subject,
      message,
    });

    // Suivi d'ouverture (asset injecté + événement).
    const contactTo = process.env.CONTACT_EMAIL || "contact@ascencia.re";
    let html = emailContent;
    const pixel = await createEmailEvent(contactTo, "contact");
    if (pixel) html = injectPixel(html, pixel.pixelUrl);

    // Configuration de l'email
    const mailOptions = {
      from: `"${name}" <${process.env.SMTP_USER || "contact@ascencia.re"}>`,
      to: contactTo,
      subject: emailSubject,
      html,
      replyTo: email,
    };

    // Envoi de l'email avec timeout
    await Promise.race([transporter.sendMail(mailOptions), timeoutPromise]);

    // Headers de sécurité
    const headers = new Headers();
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "DENY");
    headers.set("X-XSS-Protection", "1; mode=block");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    return NextResponse.json(
      { success: true, message: "Message envoyé avec succès" },
      {
        status: 200,
        headers,
      }
    );
  } catch (error) {
    console.error("Erreur lors de l'envoi du message:", error);

    // Headers de sécurité même en cas d'erreur
    const headers = new Headers();
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "DENY");
    headers.set("X-XSS-Protection", "1; mode=block");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      {
        status: 500,
        headers,
      }
    );
  }
}
