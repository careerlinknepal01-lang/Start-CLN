// ─── PasswordInput ────────────────────────────────────────────────────────────
// Password input with an accessible show/hide toggle.
//
// Accessibility requirements:
//  • The toggle button has an aria-label that changes with state.
//  • The input's type is "password" or "text" based on toggle state.
//  • The toggle button uses type="button" to prevent accidental form submission.
//  • aria-pressed communicates toggle state to screen readers.
//  • The button is not focusable via tabindex; it follows the input in DOM order
//    so tab flow is: label → input → toggle → next field.

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PasswordInputProps = React.ComponentPropsWithoutRef<typeof Input> & {
  className?: string;
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          type={visible ? "text" : "password"}
          // Remove right padding so text doesn't overlap the button
          className={cn("pr-12 min-h-12 text-base", className)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          // Position absolutely inside the input wrapper
          className="absolute right-0 top-0 h-full w-12 rounded-l-none text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
          tabIndex={0}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
