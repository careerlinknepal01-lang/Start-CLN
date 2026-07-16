import { z } from "zod";

const emailField = z
  .string()
  .min(1, "Email is required.")
  .email("Enter a valid email address.")
  .transform((v) => v.trim().toLowerCase());

export const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecial: true,
} as const;

const passwordField = z
  .string()
  .min(1, "Password is required.")
  .min(PASSWORD_POLICY.minLength, `Use at least ${PASSWORD_POLICY.minLength} characters.`)
  .refine(
    (v) => !PASSWORD_POLICY.requireUppercase || /[A-Z]/.test(v),
    "Include at least one uppercase letter."
  )
  .refine(
    (v) => !PASSWORD_POLICY.requireLowercase || /[a-z]/.test(v),
    "Include at least one lowercase letter."
  )
  .refine(
    (v) => !PASSWORD_POLICY.requireDigit || /[0-9]/.test(v),
    "Include at least one number."
  )
  .refine(
    (v) => !PASSWORD_POLICY.requireSpecial || /[^A-Za-z0-9]/.test(v),
    "Include at least one special character (e.g. ! @ # $)."
  );

const nameField = z
  .string()
  .min(1, "Full name is required.")
  .transform((v) => v.trim())
  .pipe(
    z
      .string()
      .min(2, "Name must be at least 2 characters.")
      .max(100, "Name must be under 100 characters.")
  );

const collegeField = z
  .string()
  .min(1, "College is required.")
  .transform((v) => v.trim())
  .pipe(
    z
      .string()
      .min(2, "College name must be at least 2 characters.")
      .max(150, "College name must be under 150 characters.")
  );

const fieldOfStudyField = z
  .string()
  .min(1, "Field of study is required.")
  .transform((v) => v.trim())
  .pipe(
    z
      .string()
      .min(2, "Field of study must be at least 2 characters.")
      .max(100, "Field of study must be under 100 characters.")
  );

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required."),
});

export const signupSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
  college: collegeField,
  field: fieldOfStudyField,
});

export const passwordSchema = z.object({
  password: passwordField,
  confirmPassword: z.string().min(1, "Please confirm your password."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export type LoginSchemaValues = z.infer<typeof loginSchema>;
export type SignupSchemaValues = z.infer<typeof signupSchema>;
