// ─── FieldError ───────────────────────────────────────────────────────────────
// Renders an accessible inline error message for a form field.
//
// Usage:
//   <Input aria-describedby={errors.email ? "email-error" : undefined} />
//   <FieldError id="email-error" message={errors.email?.message} />
//
// Accessibility:
//  • role="alert" announces the error immediately when it appears.
//  • The id must match the field's aria-describedby value.
//  • Wrapping in role="alert" means we don't need a separate aria-live region
//    per field — the alert role implies assertive live region semantics.

type FieldErrorProps = {
  id: string;
  message?: string;
};

export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null;

  return (
    <p
      id={id}
      role="alert"
      className="text-sm text-destructive"
    >
      {message}
    </p>
  );
}
