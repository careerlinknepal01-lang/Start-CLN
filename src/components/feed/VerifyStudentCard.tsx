import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function VerifyStudentCard() {
  return (
    <div className="mx-3 mt-6 overflow-hidden rounded-[6px] border border-border bg-secondary/50 p-5 relative">
      <div className="relative z-10">
        <h4 className="flex items-center gap-1.5 font-bold text-[14px] text-foreground">
          Verify as a Student
          <ShieldCheck className="h-4 w-4 text-primary" />
        </h4>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground max-w-[90%]">
          Unlock all features, connect with peers & create impact.
        </p>
        <Button
          variant="default"
          size="sm"
          className="mt-4 h-8 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-4 rounded-[4px] text-xs"
          onClick={() => toast("Verification request sent!")}
        >
          Verify Now
        </Button>
      </div>
    </div>
  );
}
