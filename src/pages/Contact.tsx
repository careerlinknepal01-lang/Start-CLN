import { AppLayout } from "@/components/AppLayout";

const Contact = () => {
  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl py-12 px-4 sm:px-6 animate-fade-in">
        <h1 className="text-4xl font-bold tracking-tight mb-6">Contact Us</h1>
        <div className="prose prose-slate dark:prose-invert">
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            Have questions, feedback, or need support? We'd love to hear from you.
          </p>
          <div className="mt-8 rounded-xl border border-border p-6 bg-card">
            <h3 className="text-lg font-semibold mb-2">Email</h3>
            <p className="text-muted-foreground">
              <a href="mailto:support@careerlinknepal.com" className="text-primary hover:underline">
                support@careerlinknepal.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Contact;
