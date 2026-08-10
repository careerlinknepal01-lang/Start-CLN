interface AdminInlineErrorProps {
  message?: string;
}

export function AdminInlineError({ message = "Failed to load — try refreshing." }: AdminInlineErrorProps) {
  return <p className="py-12 text-center text-sm text-destructive">{message}</p>;
}
