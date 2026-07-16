import { AppLayout } from "@/components/AppLayout";

const Privacy = () => {
  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl py-12 px-4 sm:px-6 animate-fade-in">
        <h1 className="text-4xl font-bold tracking-tight mb-6">Privacy Policy</h1>
        <div className="prose prose-slate dark:prose-invert">
          <p className="text-muted-foreground leading-relaxed mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Your privacy is important to us. This privacy policy explains how we collect, use, and protect your personal information.
          </p>
          <h2 className="text-2xl font-semibold mt-10 mb-4">Data Collection</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            We collect information you provide directly to us when you create an account, fill out your profile, or interact with the platform.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Privacy;
