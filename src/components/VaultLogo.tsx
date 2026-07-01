import { Shield, Hexagon } from "lucide-react";

export function VaultLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Hexagon className="h-9 w-9 text-primary animate-spin-slow" strokeWidth={1.5} />
        <Shield className="absolute inset-0 m-auto h-4 w-4 text-primary text-glow" />
        <div className="absolute -inset-2 bg-gradient-glow opacity-60 blur-xl -z-10" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-display font-bold text-lg tracking-widest gradient-text">PQ-VAULT</span>
        <span className="font-mono text-[10px] text-muted-foreground tracking-[0.3em]">QUANTUM SECURE</span>
      </div>
    </div>
  );
}
