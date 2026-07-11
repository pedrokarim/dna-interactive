import { z } from "zod";

// Politique mot de passe volontairement simple (appli grand public, sécurité
// non critique) : 8 caractères minimum.
export const passwordSchema = z
  .string()
  .min(8, "8 caractères minimum")
  .max(200, "Mot de passe trop long");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(60, "Nom trop long").optional(),
  email: z.string().email("Email invalide").toLowerCase().trim(),
  password: passwordSchema,
  locale: z.string().optional(),
});

export const requestResetSchema = z.object({
  email: z.string().email("Email invalide").toLowerCase().trim(),
  locale: z.string().optional(),
});

export const resetSchema = z.object({
  token: z.string().min(1, "Token manquant"),
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
