import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";

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
  host: "mail.ascencia.re",
  port: 465,
  secure: true, // true pour SSL/TLS
  auth: {
    user: process.env.SMTP_USER || "contact@ascencia.re",
    pass: process.env.SMTP_PASS || "",
  },
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
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${emailSubject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #495057; }
    .value { background: white; padding: 10px; border-radius: 4px; border-left: 4px solid #667eea; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>${emailSubject}</h2>
      <p>Nouveau message depuis le formulaire de contact</p>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Nom:</div>
        <div class="value">${name}</div>
      </div>
      <div class="field">
        <div class="label">Email:</div>
        <div class="value">${email}</div>
      </div>
      <div class="field">
        <div class="label">Sujet:</div>
        <div class="value">${subjectMap[subject] || subject}</div>
      </div>
      <div class="field">
        <div class="label">Message:</div>
        <div class="value">${message.replace(/\n/g, "<br>")}</div>
      </div>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #dee2e6;">
      <p style="color: #6c757d; font-size: 12px;">
        Cet email a été envoyé automatiquement depuis le formulaire de contact du site Ascencia.
      </p>
    </div>
  </div>
</body>
</html>`;

    // Configuration de l'email
    const mailOptions = {
      from: `"${name}" <${process.env.SMTP_USER || "contact@ascencia.re"}>`,
      to: process.env.CONTACT_EMAIL || "contact@ascencia.re",
      subject: emailSubject,
      html: emailContent,
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
