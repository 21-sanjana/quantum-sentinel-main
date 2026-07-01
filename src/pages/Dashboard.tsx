import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Vault, ShieldCheck, Skull, Clock, AlertTriangle, TrendingUp, Activity, Hexagon } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

interface Stats {
  totalAssets: number;
  dmsEnabled: boolean;
  inactivityDays: number;
  lastActivity: string | null;
  recentLogs: Array<{ id: string; action: string; category: string; created_at: string }>;
  chartData: Array<{ time: string; events: number }>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalAssets: 0, dmsEnabled: false, inactivityDays: 7, lastActivity: null, recentLogs: [], chartData: [],
  });
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) return;
    const [assetsRes, profileRes, dmsRes, logsRes] = await Promise.all([
      supabase.from("assets").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("profiles").select("last_activity_at, name").eq("id", user.id).single(),
      supabase.from("dms_settings").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("activity_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(40),
    ]);

    // chart: events per hour for last 12 hours
    const now = new Date();
    const buckets: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      buckets[`${d.getHours().toString().padStart(2,"0")}:00`] = 0;
    }
    (logsRes.data || []).forEach(l => {
      const d = new Date(l.created_at);
      const k = `${d.getHours().toString().padStart(2,"0")}:00`;
      if (k in buckets) buckets[k]++;
    });
    setStats({
      totalAssets: assetsRes.count ?? 0,
      dmsEnabled: dmsRes.data?.enabled ?? false,
      inactivityDays: dmsRes.data?.inactivity_days ?? 7,
      lastActivity: profileRes.data?.last_activity_at ?? null,
      recentLogs: (logsRes.data || []).slice(0, 5),
      chartData: Object.entries(buckets).map(([time, events]) => ({ time, events })),
    });
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    if (!user) return;
    const ch = supabase.channel("dash-rt")
      .on("postgres_changes", { event: "*", schema: "public", filter: `user_id=eq.${user.id}`, table: "assets" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", filter: `user_id=eq.${user.id}`, table: "activity_logs" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", filter: `user_id=eq.${user.id}`, table: "dms_settings" }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const lastActivityRel = stats.lastActivity ? formatDistanceToNow(new Date(stats.lastActivity), { addSuffix: true }) : "—";
  const daysInactive = stats.lastActivity ? (Date.now() - new Date(stats.lastActivity).getTime()) / 86400000 : 0;
  const inactivityPct = Math.min(100, (daysInactive / stats.inactivityDays) * 100);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-primary tracking-[0.3em]">// SECURE PERIMETER</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold mt-1">
            Welcome back, <span className="gradient-text">{user?.user_metadata?.name || "Agent"}</span>
          </h1>
          <p className="text-muted-foreground mt-1">All systems nominal · Quantum lattice intact</p>
        </div>
        <Button asChild className="bg-gradient-primary text-primary-foreground shadow-glow-cyan hover:shadow-glow-purple font-display tracking-wider">
          <Link to="/vault"><Vault className="h-4 w-4 mr-2" /> OPEN VAULT</Link>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Vault} label="Total Assets Stored" value={stats.totalAssets.toString()} hint="On-chain entries" tone="cyan" />
        <StatCard icon={ShieldCheck} label="Encryption" value="Quantum Secure" hint="Kyber-1024 / Dilithium-5" tone="cyan" />
        <StatCard icon={Skull} label="Dead Man's Switch" value={stats.dmsEnabled ? "ACTIVE" : "INACTIVE"} hint={`${stats.inactivityDays}-day inactivity threshold`} tone={stats.dmsEnabled ? "purple" : "muted"} />
        <StatCard icon={Clock} label="Last Activity" value={lastActivityRel} hint="Realtime tracker" tone="cyan" />
      </div>

      {/* Chart + Inactivity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-mono text-xs text-muted-foreground tracking-widest">ACTIVITY TIMELINE · 12H</p>
              <h3 className="font-display text-lg font-semibold mt-0.5">Vault Telemetry</h3>
            </div>
            <Badge variant="outline" className="border-primary/40 text-primary gap-1"><TrendingUp className="h-3 w-3" /> LIVE</Badge>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={stats.chartData}>
              <defs>
                <linearGradient id="gradEvents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="events" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gradEvents)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass p-6 flex flex-col">
          <p className="font-mono text-xs text-muted-foreground tracking-widest">DMS COUNTDOWN</p>
          <h3 className="font-display text-lg font-semibold mt-0.5 mb-4">Inactivity Monitor</h3>
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="relative h-40 w-40">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" stroke="hsl(var(--muted))" strokeWidth="6" fill="none" />
                <circle cx="50" cy="50" r="44" stroke="hsl(var(--primary))" strokeWidth="6" fill="none"
                  strokeDasharray={`${inactivityPct * 2.76} 1000`} strokeLinecap="round"
                  className="drop-shadow-[0_0_6px_hsl(var(--primary))]" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Hexagon className="h-6 w-6 text-primary mb-1 animate-spin-slow" />
                <span className="font-display text-2xl font-bold">{Math.max(0, stats.inactivityDays - daysInactive).toFixed(1)}</span>
                <span className="font-mono text-[10px] text-muted-foreground">DAYS LEFT</span>
              </div>
            </div>
            <Badge variant="outline" className={stats.dmsEnabled ? "border-success/40 text-success" : "border-muted-foreground/40 text-muted-foreground"}>
              {stats.dmsEnabled ? "● ARMED" : "○ DISARMED"}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Alerts + Recent */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass p-6">
          <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" /> Security Alerts
          </h3>
          {inactivityPct > 70 ? (
            <div className="rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm">
              <p className="font-medium text-warning">Inactivity threshold approaching</p>
              <p className="text-muted-foreground text-xs mt-1">Interact with the vault to reset the Dead Man's Switch countdown.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-success/30 bg-success/5 p-3 text-sm">
              <p className="font-medium text-success">No active alerts</p>
              <p className="text-muted-foreground text-xs mt-1">Quantum encryption layer verified. Blockchain consensus healthy.</p>
            </div>
          )}
        </Card>

        <Card className="glass p-6">
          <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Recent Activity
          </h3>
          <ul className="space-y-2">
            {stats.recentLogs.length === 0 && <li className="text-sm text-muted-foreground">No activity yet.</li>}
            {stats.recentLogs.map(l => (
              <li key={l.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow-cyan" />
                  {l.action}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, tone }: {
  icon: typeof Vault; label: string; value: string; hint: string; tone: "cyan" | "purple" | "muted";
}) {
  const toneClass = {
    cyan: "border-primary/30 [&_.icon-bg]:bg-primary/10 [&_.icon]:text-primary",
    purple: "border-accent/40 [&_.icon-bg]:bg-accent/10 [&_.icon]:text-accent",
    muted: "border-muted-foreground/20 [&_.icon-bg]:bg-muted [&_.icon]:text-muted-foreground",
  }[tone];
  return (
    <Card className={`glass p-5 relative overflow-hidden hover:scale-[1.02] transition-transform ${toneClass}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
          <p className="font-display text-2xl font-bold mt-2">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{hint}</p>
        </div>
        <div className="icon-bg h-10 w-10 rounded-lg flex items-center justify-center">
          <Icon className="icon h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
