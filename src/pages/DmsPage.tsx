import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skull, RefreshCw, AlertTriangle, Hexagon, Clock, Activity } from "lucide-react";
import { logActivity } from "@/lib/auth-helpers";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function DmsPage() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [days, setDays] = useState(7);
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
  if (!user) return;

  const fetchData = async () => {
    try {
      const { data: dmsData, error: dmsError } =
        await supabase
          .from("dms_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

      if (dmsError) {
        console.error(dmsError);
      }

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("last_activity_at")
          .eq("id", user.id)
          .single();

      if (profileError) {
        console.error(profileError);
      }

      if (dmsData) {
        setEnabled(dmsData.enabled);
        setDays(dmsData.inactivity_days);
      }

      if (profileData?.last_activity_at) {
        setLastActivity(profileData.last_activity_at);
      } else {
        const nowIso = new Date().toISOString();

        setLastActivity(nowIso);

        await supabase
          .from("profiles")
          .update({
            last_activity_at: nowIso,
          })
          .eq("id", user.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  fetchData();

  const interval = setInterval(() => {
    setNow(Date.now());
  }, 1000);

  const channel = supabase
    .channel("dms-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "profiles",
        filter: `id=eq.${user.id}`,
      },
      (payload) => {
        const updated =
          payload.new as {
            last_activity_at?: string;
          };

        if (updated?.last_activity_at) {
          setLastActivity(
            updated.last_activity_at
          );
        }
      }
    )
    .subscribe();

  return () => {
    clearInterval(interval);
    supabase.removeChannel(channel);
  };
}, [user]);

  const save = async (next: { enabled?: boolean; days?: number }) => {
    if (!user) return;
    const newEnabled = next.enabled ?? enabled;
    const newDays = next.days ?? days;
    setEnabled(newEnabled); setDays(newDays);
    await supabase.from("dms_settings").upsert({
      user_id: user.id,
      enabled: newEnabled,
      inactivity_days: newDays,
    });
    await logActivity(`DMS ${newEnabled ? "armed" : "disarmed"} (${newDays}d)`, "dms");
  };

  const reset = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ last_activity_at: new Date().toISOString() }).eq("id", user.id);
    await supabase.from("dms_settings").update({ triggered: false, triggered_at: null }).eq("user_id", user.id);
    await logActivity("DMS countdown reset (emergency)", "dms");
    toast.success("Countdown reset");
  };

  const lastMs =
  lastActivity &&
  !isNaN(new Date(lastActivity).getTime())
    ? new Date(lastActivity).getTime()
    : Date.now();
  const elapsed = (now - lastMs) / 1000;
  const totalSec = days * 86400;
  const remaining = Math.max(0, totalSec - elapsed);
  const pct = Math.min(100, (elapsed / totalSec) * 100);

  const d = Math.floor(remaining / 86400);
  const h = Math.floor((remaining % 86400) / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = Math.floor(remaining % 60);

  const triggered = enabled && remaining <= 0;
  console.log({
  lastActivity,
  remaining,
  elapsed,
  totalSec,
});
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <p className="font-mono text-xs text-accent tracking-[0.3em]">// CONTINGENCY PROTOCOL</p>
        <h1 className="font-display text-3xl font-bold mt-1">Dead Man's Switch</h1>
        <p className="text-muted-foreground mt-1">Auto-transfer your vault to beneficiaries upon prolonged inactivity</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Toggle */}
        <Card className="glass p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skull className="h-5 w-5 text-accent" />
              <h3 className="font-display font-semibold">Switch Status</h3>
            </div>
            <Switch checked={enabled} onCheckedChange={(v) => save({ enabled: v })} />
          </div>
          <Badge className={`w-fit font-mono text-xs ${enabled ? "bg-accent/10 text-accent border-accent/40" : "bg-muted text-muted-foreground"}`}>
            {enabled ? "● ARMED" : "○ DISARMED"}
          </Badge>
          <div className="space-y-3 mt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Inactivity threshold</span>
              <span className="font-mono font-semibold">{days} days</span>
            </div>
            <Slider value={[days]} onValueChange={(v) => setDays(v[0])} onValueCommit={(v) => save({ days: v[0] })} min={1} max={90} step={1} />
            <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>1d</span><span>30d</span><span>90d</span>
            </div>
          </div>
        </Card>

        {/* Countdown */}
        <Card className={`glass p-6 lg:col-span-2 relative overflow-hidden ${enabled ? "glow-border-purple" : ""}`}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
          <div className="flex items-center justify-between mb-4 relative">
            <div>
              <p className="font-mono text-xs text-muted-foreground tracking-widest">REAL-TIME COUNTDOWN</p>
              <h3 className="font-display text-lg font-semibold mt-0.5">Time until trigger</h3>
            </div>
            <Hexagon className={`h-8 w-8 ${enabled ? "text-accent animate-spin-slow" : "text-muted-foreground"}`} />
          </div>

          <div className="grid grid-cols-4 gap-3 my-6 relative">
            {[
              { label: "DAYS", value: d },
              { label: "HRS", value: h },
              { label: "MIN", value: m },
              { label: "SEC", value: s },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="font-display text-4xl md:text-5xl font-bold tabular-nums gradient-text">
                  {value.toString().padStart(2, "0")}
                </div>
                <div className="font-mono text-[10px] text-muted-foreground tracking-[0.3em] mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2 relative">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full transition-all ${triggered ? "bg-destructive" : pct > 70 ? "bg-warning" : "bg-gradient-primary"}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span>Last activity {lastActivity ? new Date(lastActivity).toLocaleString() : "—"}</span>
              <span>{pct.toFixed(1)}% elapsed</span>
            </div>
          </div>

          {triggered && (
            <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 flex items-start gap-3 relative">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-destructive">DMS Triggered</p>
                <p className="text-xs text-muted-foreground">Asset transfer protocol initiated. Reset to abort.</p>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4 relative">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-accent/40 hover:bg-accent/10 hover:text-accent">
                  <RefreshCw className="h-4 w-4 mr-2" /> Emergency Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass-strong">
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Emergency Reset</AlertDialogTitle>
                  <AlertDialogDescription>This restores the inactivity counter to zero. Use only if you're sure you control this account.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={reset}>Reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>
      </div>

      {/* Trigger condition */}
      <Card className="glass p-6">
        <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Trigger Condition</h3>
        <ol className="space-y-3">
          {[
            { t: "Track activity", d: "Last interaction timestamp updates on every click, key, or background ping." },
            { t: "Compare with current time", d: `If (now − last_activity) > ${days} days, condition is met.` },
            { t: "Execute transfer", d: "Smart contract releases encrypted assets to assigned beneficiaries." },
          ].map((step, i) => (
            <li key={i} className="flex gap-3 items-start">
              <div className="h-7 w-7 shrink-0 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center font-mono text-xs text-primary">{i + 1}</div>
              <div>
                <p className="font-medium">{step.t}</p>
                <p className="text-sm text-muted-foreground">{step.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
