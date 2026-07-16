type FormAlertProps = {
  message: string | null;
  severity?: "error" | "warning" | "info";
};

const severityClasses = {
  error: "border-destructive/30 bg-destructive/5 text-destructive",
  warning:
    "border-yellow-400/40 bg-yellow-50/80 text-yellow-800 dark:text-yellow-200 dark:bg-yellow-900/20",
  info: "border-blue-400/40 bg-blue-50/80 text-blue-800 dark:text-blue-200 dark:bg-blue-900/20",
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
