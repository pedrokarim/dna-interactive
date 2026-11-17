import { z } from "zod";

// Les messages sont des clés du namespace `apiErrors` : les routes les passent
// au traducteur avant de répondre, le client reçoit donc sa langue.
// Mot de passe : 8 caractères minimum et c'est tout, exprès (site grand public,
// rien de critique derrière).
export const passwordSchema = z
  .string()
  .min(8, "passwordTooShort")
  .max(200, "passwordTooLong");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "nameTooShort").max(60, "nameTooLong").optional(),
  email: z.string().email("emailInvalid").toLowerCase().trim(),
  password: passwordSchema,
  locale: z.string().optional(),
});

export const requestResetSchema = z.object({
  email: z.string().email("emailInvalid").toLowerCase().trim(),
  locale: z.string().optional(),
});

export const resetSchema = z.object({
  token: z.string().min(1, "tokenMissing"),
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
