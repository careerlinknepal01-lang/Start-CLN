import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Application error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-6 text-center">
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 max-w-md">
            <h1 className="text-xl font-semibold text-foreground mb-2">We encountered an unexpected issue</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Our team has been notified. Trying to refresh the page might help resolve this temporarily.
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Reload page
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
