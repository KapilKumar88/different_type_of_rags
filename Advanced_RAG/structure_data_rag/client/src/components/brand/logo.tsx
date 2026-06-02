import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/login" className={`inline-flex items-center gap-2 ${className}`}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-[var(--primary-glow)] text-primary-foreground shadow-[var(--shadow-elegant)]">
        <Sparkles className="h-4 w-4" />
      </span>
      <span className="text-base font-semibold tracking-tight text-foreground">RAG Assistant</span>
    </Link>
  );
}
