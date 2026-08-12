import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function VerifyStudentCard() {
  const { user } = useAuth();
  
  const { data: isVerified, isLoading } = useQuery({
    queryKey: ["user_verified_status", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase
        .from("profiles")
        .select("is_verified")
        .eq("id", user.id)
        .single();
      
      if (error) {
        console.error("Error fetching verification status:", error);
        return false;
      }
      return data?.is_verified ?? false;
    },
    enabled: !!user?.id,
  });

  if (isLoading || isVerified) {
    return null;
  }

  return (
    <div className="mx-4 mt-6 overflow-hidden rounded-xl bg-gradient-to-b from-[#0f172a] to-[#1e1b4b] p-5 text-white shadow-lg relative border border-white/5">
      <div className="relative z-10">
        <h4 className="flex items-center gap-1.5 font-bold text-[14px]">
          Verify as a Student
          <ShieldCheck className="h-4 w-4 text-amber-400" />
        </h4>
        <p className="mt-2 text-[11px] leading-relaxed text-blue-100/80 max-w-[90%]">
          Unlock all features, connect with peers & create impact.
        </p>
        <Button 
          variant="secondary" 
          size="sm" 
          className="mt-4 h-8 bg-card text-card-foreground text-blue-950 hover:bg-blue-50 font-semibold px-4 rounded-md text-xs shadow-sm"
          onClick={() => toast("Verification request sent!")}
        >
          Verify Now
        </Button>
      </div>
      
      {/* Decorative background elements */}
      <div className="absolute -bottom-6 -right-6 opacity-30 select-none pointer-events-none">
        <div className="h-24 w-24 rounded-full bg-blue-500 blur-2xl"></div>
      </div>
      <div className="absolute bottom-[-10px] right-[-10px] opacity-40 select-none pointer-events-none transform rotate-12">
        <ShieldCheck className="h-24 w-24 text-blue-400/20" />
      </div>
    </div>
  );
}
