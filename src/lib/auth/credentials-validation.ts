import { z } from "zod";

// Les messages sont des CLÉS du namespace `apiErrors` : les routes les passent
// au traducteur avant de répondre, pour que le client reçoive sa langue.
// Politique mot de passe volontairement simple (appli grand public, sécurité
// non critique) : 8 caractères minimum.
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
