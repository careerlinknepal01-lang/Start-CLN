import { AppLayout } from "@/components/AppLayout";

const About = () => {
  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl py-12 px-4 sm:px-6 animate-fade-in">
        <h1 className="text-4xl font-bold tracking-tight mb-6">About CareerLink Nepal</h1>
        <div className="prose prose-slate dark:prose-invert">
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            CareerLink Nepal is a platform built for undergraduate students across Nepal to connect, collaborate, and discover opportunities.
          </p>
          <h2 className="text-2xl font-semibold mt-10 mb-4">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            We believe that the best opportunities often come from the people you know. Our mission is to bridge the gap between students, colleges, and the industry by providing a unified space for professional growth.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default About;
