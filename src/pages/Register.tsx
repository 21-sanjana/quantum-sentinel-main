import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Lock, Mail, User as UserIcon, ShieldCheck, Loader2, Skull } from "lucide-react";
import { CyberBackground } from "@/components/CyberBackground";
import { VaultLogo } from "@/components/VaultLogo";
import { passwordStrength } from "@/lib/auth-helpers";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2, "Name too short").max(80),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(128),
});

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [dms, setDms] = useState(true);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const strength = passwordStrength(password);
  const strengthColors = ["bg-destructive", "bg-destructive", "bg-warning", "bg-success", "bg-primary"];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords do not match");
    const parsed = schema.safeParse({ name, email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (strength.score < 2) return toast.error("Password is too weak");

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { name: parsed.data.name, dms_enabled: dms },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Vault created. Welcome aboard.");
    nav("/dashboard");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <CyberBackground />
      <Card className="glass-strong w-full max-w-md p-8 relative overflow-hidden scan-lines animate-fade-in-up">
        <VaultLogo className="mb-6" />
        <h2 className="font-display text-2xl font-bold mb-1">Initialize Vault</h2>
        <p className="text-sm text-muted-foreground mb-6">Forge your post-quantum identity</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-mono text-xs uppercase tracking-wider">Display Name</Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="name" required value={name} onChange={e => setName(e.target.value)} placeholder="Cipher Smith" className="pl-10 bg-input/50 border-primary/20" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="font-mono text-xs uppercase tracking-wider">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@pqvault.io" className="pl-10 bg-input/50 border-primary/20" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="font-mono text-xs uppercase tracking-wider">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••" className="pl-10 bg-input/50 border-primary/20" />
            </div>
            {password && (
              <div className="space-y-1">
                <div className="grid grid-cols-4 gap-1">
                  {[0,1,2,3].map(i => (
                    <div key={i} className={`h-1 rounded-full transition-all ${i < strength.score ? strengthColors[strength.score] : "bg-muted"}`} />
                  ))}
                </div>
                <p className="text-xs font-mono text-muted-foreground">{strength.label}</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm" className="font-mono text-xs uppercase tracking-wider">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="confirm" type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} className="pl-10 bg-input/50 border-primary/20" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 p-3">
            <div className="flex items-center gap-3">
              <Skull className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-medium">Enable Dead Man's Switch</p>
                <p className="text-xs text-muted-foreground">Auto-transfer assets if inactive</p>
              </div>
            </div>
            <Switch checked={dms} onCheckedChange={setDms} />
          </div>

          <Button type="submit" disabled={loading}
            className="w-full bg-gradient-primary text-primary-foreground font-display tracking-widest h-11 shadow-glow-cyan hover:shadow-glow-purple transition-all">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShieldCheck className="h-4 w-4 mr-2" /> CREATE VAULT</>}
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground mt-6">
          Already secured?{" "}
          <Link to="/login" className="text-primary hover:text-primary-glow underline-offset-4 hover:underline">Sign in →</Link>
        </p>
      </Card>
    </div>
  );
}
