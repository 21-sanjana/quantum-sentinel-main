import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, Mail, ShieldCheck, KeyRound, Loader2 } from "lucide-react";
import { CyberBackground } from "@/components/CyberBackground";
import { VaultLogo } from "@/components/VaultLogo";
import { logActivity } from "@/lib/auth-helpers";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Password too short").max(128),
});

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    await logActivity("User logged in", "auth", { method: "password" });
    toast.success("Vault unlocked");
    navigate("/dashboard");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <CyberBackground />
      <div className="grid w-full max-w-5xl grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-fade-in-up">
        {/* Left: brand visual */}
        <div className="hidden lg:flex flex-col gap-6 p-8">
          <VaultLogo />
          <h1 className="font-display text-5xl font-bold leading-tight">
            Your assets,<br />
            <span className="gradient-text">quantum-locked</span><br />
            on chain.
          </h1>
          <p className="text-muted-foreground max-w-md">
            Post-quantum cryptography meets immutable blockchain storage.
            A Dead Man's Switch ensures your legacy reaches who matters — when it matters.
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            {["Kyber-1024", "Dilithium-5", "On-Chain", "Zero-Trust"].map(t => (
              <span key={t} className="font-mono text-xs px-3 py-1 rounded-full glass border-primary/30 text-primary">
                ◆ {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right: form */}
        <Card className="glass-strong p-8 relative overflow-hidden scan-lines">
          <div className="lg:hidden mb-6"><VaultLogo /></div>
          <h2 className="font-display text-2xl font-bold mb-1">Access Vault</h2>
          <p className="text-sm text-muted-foreground mb-6">Authenticate with your encrypted credentials</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-mono text-xs uppercase tracking-wider">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="agent@pqvault.io" className="pl-10 bg-input/50 border-primary/20 focus-visible:ring-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-mono text-xs uppercase tracking-wider">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••" className="pl-10 bg-input/50 border-primary/20" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp" className="font-mono text-xs uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-3 w-3" /> 2FA Code <span className="text-muted-foreground normal-case font-sans">(optional)</span>
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="otp" inputMode="numeric" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,""))}
                  placeholder="000000" className="pl-10 bg-input/50 border-primary/20 font-mono tracking-[0.3em]" />
              </div>
            </div>

            <Button type="submit" disabled={loading}
              className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-display tracking-widest h-11 shadow-glow-cyan transition-all hover:shadow-glow-purple">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShieldCheck className="h-4 w-4 mr-2" /> SECURE LOGIN</>}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-6">
            New to PQ-Vault?{" "}
            <Link to="/register" className="text-primary hover:text-primary-glow underline-offset-4 hover:underline">
              Request access →
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
