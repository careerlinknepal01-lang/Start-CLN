import { AppLayout } from "@/components/AppLayout";

const Terms = () => {
  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl py-12 px-4 sm:px-6 animate-fade-in">
        <h1 className="text-4xl font-bold tracking-tight mb-6">Terms of Service</h1>
        <div className="prose prose-slate dark:prose-invert">
          <p className="text-muted-foreground leading-relaxed mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            By accessing or using CareerLink Nepal, you agree to be bound by these Terms of Service.
          </p>
          <h2 className="text-2xl font-semibold mt-10 mb-4">User Conduct</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            You agree to use the platform respectfully and not to post any content that is abusive, harassing, or violates any laws.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Terms;
