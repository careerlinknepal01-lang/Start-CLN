interface AdminPageHeaderProps {
  title: string;
  subtitle: string;
}

export function AdminPageHeader({ title, subtitle }: AdminPageHeaderProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  );
}
