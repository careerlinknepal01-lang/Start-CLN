type FormAlertProps = {
  message: string | null;
  severity?: "error" | "warning" | "info";
};

const severityClasses = {
  error: "border-destructive/30 bg-destructive/5 text-destructive",
  warning:
    "border-warning/40 bg-warning/10 text-warning",
  info: "border-primary/30 bg-primary/5 text-primary",
};

export function FormAlert({ message, severity = "error" }: FormAlertProps) {
  if (!message) return null;

  const isError = severity === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-atomic="true"
      className={`rounded-md border px-3 py-2 text-sm ${severityClasses[severity]}`}
    >
      {message}
    </div>
  );
}
