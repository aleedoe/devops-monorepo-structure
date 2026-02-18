import { z } from "zod";

// ─── User Schema ────────────────────────────────────────
// This schema is SHARED between the Next.js frontend
// and the Express backend API — single source of truth.
// ─────────────────────────────────────────────────────────

export const userSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: z
    .string()
    .email("Invalid email address"),
  age: z
    .number()
    .int("Age must be a whole number")
    .positive("Age must be a positive number")
    .optional(),
});

// Infer the TypeScript type from the schema
export type User = z.infer<typeof userSchema>;
