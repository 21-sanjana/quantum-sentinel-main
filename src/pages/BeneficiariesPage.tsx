import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, UserPlus, Mail, Wallet, CheckCircle2, Clock, Trash2 } from "lucide-react";
import { logActivity } from "@/lib/auth-helpers";
import { toast } from "sonner";
import { z } from "zod";

type B = { id: string; name: string; contact: string | null; wallet_address: string | null; verified: boolean };

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  contact: z.string().trim().email().max(255).optional().or(z.literal("")),
  wallet_address: z.string().trim().max(120).optional().or(z.literal("")),
});

export default function BeneficiariesPage() {
  const { user } = useAuth();
  const [list, setList] = useState<B[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", wallet_address: "" });

  const fetch = async () => {
    if (!user) return;
    const { data } = await supabase.from("beneficiaries").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setList(data || []);
  };

  useEffect(() => {
    fetch();
    if (!user) return;
    const ch = supabase.channel("ben-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "beneficiaries", filter: `user_id=eq.${user.id}` }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    const { error } = await supabase.from("beneficiaries").insert({
      user_id: user.id,
      name: parsed.data.name,
      contact: parsed.data.contact || null,
      wallet_address: parsed.data.wallet_address || null,
      
    });
    if (error) return toast.error(error.message);
    await logActivity(`Added beneficiary "${parsed.data.name}"`, "system");
    toast.success("Beneficiary registered");
    setOpen(false);
    setForm({ name: "", contact: "", wallet_address: "" });
  };

  const verify = async (id: string, name: string) => {
    await supabase.from("beneficiaries").update({ verified: true }).eq("id", id);
    await logActivity(`Verified beneficiary "${name}"`, "blockchain");
    toast.success("Verified on chain");
  };

  const remove = async (id: string, name: string) => {
    await supabase.from("beneficiaries").delete().eq("id", id);
    await logActivity(`Removed beneficiary "${name}"`, "system");
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="font-mono text-xs text-primary tracking-[0.3em]">// TRUSTED RECIPIENTS</p>
          <h1 className="font-display text-3xl font-bold mt-1">Beneficiaries</h1>
          <p className="text-muted-foreground mt-1">Designated recipients of your encrypted estate</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground shadow-glow-cyan font-display tracking-wider">
              <Plus className="h-4 w-4 mr-2" /> ADD BENEFICIARY
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong">
            <DialogHeader><DialogTitle className="font-display">New Beneficiary</DialogTitle></DialogHeader>
            <form onSubmit={add} className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} placeholder="recipient@example.com" /></div>
              <div className="space-y-2"><Label>Wallet Address</Label><Input value={form.wallet_address} onChange={e => setForm({...form, wallet_address: e.target.value})} placeholder="0x..." className="font-mono" /></div>
              <DialogFooter><Button type="submit" className="bg-gradient-primary text-primary-foreground w-full">Register</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {list.length === 0 ? (
        <Card className="glass p-12 text-center">
          <UserPlus className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-display text-lg">No beneficiaries yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add trusted recipients to receive your assets via DMS.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map(b => (
            <Card key={b.id} className="glass p-5 hover:border-primary/40 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold">
                  {b.name.slice(0, 2).toUpperCase()}
                </div>
                {b.verified ? (
                  <Badge className="bg-success/10 text-success border-success/40 gap-1"><CheckCircle2 className="h-3 w-3" /> Verified</Badge>
                ) : (
                  <Badge variant="outline" className="border-warning/40 text-warning gap-1"><Clock className="h-3 w-3" /> Pending</Badge>
                )}
              </div>
              <p className="font-display font-semibold">{b.name}</p>
              {b.contact && <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1.5"><Mail className="h-3 w-3" /> {b.contact}</p>}
              {b.wallet_address && <p className="text-xs font-mono text-muted-foreground flex items-center gap-1.5 mt-1 truncate"><Wallet className="h-3 w-3 shrink-0" /> {b.wallet_address}</p>}
              <div className="flex gap-2 mt-4">
                {!b.verified && <Button size="sm" variant="outline" className="flex-1 border-primary/30" onClick={() => verify(b.id, b.name)}>Verify</Button>}
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => remove(b.id, b.name)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
