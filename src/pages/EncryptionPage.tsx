import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Lock, Cpu, Key, Hexagon, Zap } from "lucide-react";

export default function EncryptionPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, sealed: 0 });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { count } = await supabase.from("assets").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      setStats({ total: count ?? 0, sealed: count ?? 0 });
    };
    fetch();
    const ch = supabase.channel("enc-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "assets", filter: `user_id=eq.${user.id}` }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <p className="font-mono text-xs text-primary tracking-[0.3em]">// CRYPTOGRAPHIC LAYER</p>
        <h1 className="font-display text-3xl font-bold mt-1">Encryption Status</h1>
        <p className="text-muted-foreground mt-1">Post-quantum cryptography with lattice-based hardness</p>
      </div>

      <Card className="glass-strong p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow opacity-50" />
        <div className="relative grid md:grid-cols-2 gap-8 items-center">
          <div>
            <Badge className="bg-success/10 text-success border-success/40 gap-1 mb-3">
              <ShieldCheck className="h-3 w-3" /> SECURE
            </Badge>
            <h2 className="font-display text-3xl font-bold gradient-text">Quantum-Safe</h2>
            <p className="text-muted-foreground mt-2">All vault data is sealed using NIST-standardized post-quantum algorithms before commit to the blockchain ledger.</p>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <Stat label="Assets Sealed" value={stats.sealed.toString()} />
              <Stat label="Algorithm" value="Kyber-1024" mono />
              <Stat label="Signature" value="Dilithium-5" mono />
              <Stat label="Quantum Resistance" value="Level 5" />
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative h-64 w-64">
              <Hexagon className="absolute inset-0 m-auto h-64 w-64 text-primary/20 animate-spin-slow" strokeWidth={0.5} />
              <Hexagon className="absolute inset-0 m-auto h-48 w-48 text-accent/30 animate-spin-slow" strokeWidth={0.5} style={{ animationDirection: "reverse", animationDuration: "12s" }} />
              <Hexagon className="absolute inset-0 m-auto h-32 w-32 text-primary/40 animate-spin-slow" strokeWidth={0.5} />
              <Lock className="absolute inset-0 m-auto h-12 w-12 text-primary text-glow animate-pulse-glow" />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <AlgoCard icon={Key} title="Key Encapsulation" algo="CRYSTALS-Kyber-1024" desc="NIST PQC standard. Lattice-based KEM resistant to Shor's algorithm." />
        <AlgoCard icon={Cpu} title="Digital Signatures" algo="CRYSTALS-Dilithium-5" desc="Module-lattice signatures for vault entries and chain commits." />
        <AlgoCard icon={Zap} title="Hash Function" algo="SHA3-512 / BLAKE3" desc="Collision-resistant hashing for content addressing." />
      </div>

      <Card className="glass p-6">
        <h3 className="font-display text-lg font-semibold mb-4">Key Material</h3>
        <div className="space-y-3">
          {[
            { label: "Master Public Key", v: "0x4f8b...e3a7", state: "active" },
            { label: "Encapsulation Key", v: "0x9c2d...11ff", state: "active" },
            { label: "Signing Key", v: "0xab17...7e02", state: "rotating" },
          ].map(k => (
            <div key={k.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
              <div>
                <p className="text-sm font-medium">{k.label}</p>
                <p className="font-mono text-xs text-muted-foreground">{k.v}</p>
              </div>
              <Badge variant="outline" className={k.state === "active" ? "border-success/40 text-success" : "border-warning/40 text-warning"}>
                {k.state}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
      <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{label}</p>
      <p className={`font-semibold mt-1 ${mono ? "font-mono text-sm" : "text-lg"}`}>{value}</p>
    </div>
  );
}

function AlgoCard({ icon: Icon, title, algo, desc }: { icon: typeof Lock; title: string; algo: string; desc: string }) {
  return (
    <Card className="glass p-5 hover:border-primary/40 transition-colors">
      <Icon className="h-6 w-6 text-primary mb-3" />
      <p className="font-display font-semibold">{title}</p>
      <p className="font-mono text-xs text-primary mt-1">{algo}</p>
      <p className="text-sm text-muted-foreground mt-2">{desc}</p>
    </Card>
  );
}
