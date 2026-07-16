import { Link } from "react-router-dom";
import { Home, ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md animate-fade-in">
        {/* Logo */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-lg font-bold mb-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
          aria-label="CareerLink Nepal home"
        >
          <img src="/cln.png" alt="" className="h-8 w-8 object-contain" aria-hidden="true" />
          <span>CareerLink <span className="text-accent">Nepal</span></span>
        </Link>

        {/* 404 display */}
        <div className="relative mb-8">
          <div
            className="text-[9rem] font-black leading-none tracking-tighter gradient-text select-none"
            aria-hidden="true"
          >
            404
          </div>
          <div className="absolute inset-0 text-[9rem] font-black leading-none tracking-tighter text-border/20 select-none blur-sm -z-10" aria-hidden="true">
            404
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-3">Page not found</h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          The page you're looking for doesn't exist or may have been moved.
          Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="min-h-12 gap-2">
            <Link to="/feed">
              <Home className="h-4 w-4" aria-hidden="true" />
              Go to Feed
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="min-h-12 gap-2">
            <Link to="/explore">
              <Compass className="h-4 w-4" aria-hidden="true" />
              Explore
            </Link>
          </Button>
        </div>

        <Button
          asChild
          variant="ghost"
          size="sm"
          className="mt-6 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Link to="/">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to homepage
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
