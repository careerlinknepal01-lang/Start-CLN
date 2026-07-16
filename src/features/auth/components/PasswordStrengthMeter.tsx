import type { PasswordStrength } from "../types/auth.types";
import { getPasswordRequirements } from "../utils/passwordStrength";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type PasswordStrengthMeterProps = {
  password: string;
  strength: PasswordStrength;
};

const SEGMENT_COUNT = 4;

export function PasswordStrengthMeter({ password, strength }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const requirements = getPasswordRequirements(password);
  const filledSegments = strength.score;

  return (
    <div className="space-y-2" aria-label="Password strength">
      <div
        role="progressbar"
        aria-valuenow={strength.score}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-label={`Password strength: ${strength.label}`}
        className="flex gap-1"
      >
        {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              i < filledSegments ? strength.color : "bg-muted"
            )}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground" aria-hidden="true">
        Strength: <span className="font-medium text-foreground">{strength.label}</span>
      </p>

      <ul className="space-y-0.5" aria-label="Password requirements">
        {requirements.map((req) => (
          <li
            key={req.label}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              req.met ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
            )}
          >
            {req.met ? (
              <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
            ) : (
              <XCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
            )}
            <span>
              <span className="sr-only">{req.met ? "Met: " : "Not met: "}</span>
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
