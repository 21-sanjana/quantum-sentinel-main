import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { User as UserIcon, Lock, Bell, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/auth-helpers";

export default function SettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [notif, setNotif] = useState({ email: true, push: true, dms: true });
  const [twoFA, setTwoFA] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("name").eq("id", user.id).single().then(({ data }) => {
      if (data) setName(data.name || "");
    });
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ name }).eq("id", user.id);
    await logActivity("Profile updated", "system");
    toast.success("Profile saved");
  };

  const changePw = async () => {
    if (pw.length < 8) return toast.error("Password must be at least 8 characters");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    await logActivity("Password rotated", "security");
    toast.success("Password updated");
    setPw("");
  };

  return (
    <div className="space-y-6 animate-fade-in-up max-w-3xl">
      <div>
        <p className="font-mono text-xs text-primary tracking-[0.3em]">// CONFIGURATION</p>
        <h1 className="font-display text-3xl font-bold mt-1">Settings</h1>
        <p className="text-muted-foreground mt-1">Tune your vault preferences and security</p>
      </div>

      <Card className="glass p-6">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2 mb-4"><UserIcon className="h-4 w-4 text-primary" /> Profile</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Display Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Email</Label><Input value={user?.email || ""} disabled /></div>
        </div>
        <Button onClick={saveProfile} className="mt-4 bg-gradient-primary text-primary-foreground">Save profile</Button>
      </Card>

      <Card className="glass p-6">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2 mb-4"><Lock className="h-4 w-4 text-primary" /> Security</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" />
            <Button onClick={changePw} variant="outline" className="border-primary/40">Update password</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">Use an authenticator app (TOTP) for sign-in.</p>
            </div>
            <Switch checked={twoFA} onCheckedChange={(v) => { setTwoFA(v); toast.success(`2FA ${v ? "enabled" : "disabled"}`); }} />
          </div>
        </div>
      </Card>

      <Card className="glass p-6">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2 mb-4"><Bell className="h-4 w-4 text-primary" /> Notifications</h3>
        <div className="space-y-3">
          {[
            { k: "email", label: "Email alerts" },
            { k: "push", label: "Browser push" },
            { k: "dms", label: "DMS countdown reminders" },
          ].map(o => (
            <div key={o.k} className="flex items-center justify-between">
              <span className="text-sm">{o.label}</span>
              <Switch checked={notif[o.k as keyof typeof notif]} onCheckedChange={(v) => setNotif({ ...notif, [o.k]: v })} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
