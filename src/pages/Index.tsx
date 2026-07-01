import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CyberBackground } from "@/components/CyberBackground";
import { VaultLogo } from "@/components/VaultLogo";
import { ShieldCheck, Skull, Hexagon, Lock, ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <CyberBackground />
      <header className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <VaultLogo />
        <div className="flex gap-2">
          <Button asChild variant="ghost"><Link to="/login">Sign in</Link></Button>
          <Button asChild className="bg-gradient-primary text-primary-foreground shadow-glow-cyan">
            <Link to="/register">Launch Vault <ArrowRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
        <span className="inline-block font-mono text-xs px-4 py-1.5 rounded-full glass border-primary/40 text-primary mb-6 animate-fade-in-up">
          ◆ POST-QUANTUM · BLOCKCHAIN · DEAD MAN'S SWITCH
        </span>
        <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight animate-fade-in-up">
          Outlive your secrets.
          <br /><span className="gradient-text">Outsmart the quantum era.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          PQ-Vault seals your wallets, documents, and digital legacy with lattice-based cryptography
          on an immutable chain — releasing them only to who you trust, only when you stop responding.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow-cyan hover:shadow-glow-purple font-display tracking-widest">
            <Link to="/register"><ShieldCheck className="h-4 w-4 mr-2" /> CREATE VAULT</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-primary/40 hover:bg-primary/10">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-24 max-w-5xl mx-auto">
          {[
            { icon: Lock, title: "Quantum-safe Sealing", desc: "Kyber-1024 & Dilithium-5 encryption resistant to Shor's algorithm." },
            { icon: Hexagon, title: "On-chain Permanence", desc: "Tamper-proof commit. Every action recorded. Every byte attested." },
            { icon: Skull, title: "Dead Man's Switch", desc: "Inactivity timer auto-transfers your assets to verified beneficiaries." },
          ].map(f => (
            <div key={f.title} className="glass p-6 rounded-xl text-left hover:border-primary/40 transition-all hover:-translate-y-1">
              <f.icon className="h-6 w-6 text-primary mb-3" />
              <p className="font-display font-semibold">{f.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
