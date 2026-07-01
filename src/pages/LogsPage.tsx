import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollText, Filter, Search, Shield, Vault, Skull, LogIn, Activity, Hexagon } from "lucide-react";
import { format } from "date-fns";

type Log = { id: string; action: string; category: string; metadata: unknown; created_at: string };

const categoryConfig: Record<string, { icon: typeof Shield; color: string }> = {
  auth: { icon: LogIn, color: "text-primary border-primary/40" },
  vault: { icon: Vault, color: "text-accent border-accent/40" },
  dms: { icon: Skull, color: "text-warning border-warning/40" },
  blockchain: { icon: Hexagon, color: "text-success border-success/40" },
  security: { icon: Shield, color: "text-destructive border-destructive/40" },
  system: { icon: Activity, color: "text-muted-foreground border-border" },
};

export default function LogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [category, setCategory] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from("activity_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200);
      setLogs(data || []);
    };
    fetch();
    const ch = supabase.channel("logs-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_logs", filter: `user_id=eq.${user.id}` }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const filtered = logs.filter(l => {
    if (category !== "all" && l.category !== category) return false;
    if (q && !l.action.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <p className="font-mono text-xs text-primary tracking-[0.3em]">// IMMUTABLE TRAIL</p>
        <h1 className="font-display text-3xl font-bold mt-1">Activity Logs</h1>
        <p className="text-muted-foreground mt-1">Every action recorded on-chain for audit compliance</p>
      </div>

      <Card className="glass p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search actions..." className="pl-10 bg-input/50" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-48"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="auth">Authentication</SelectItem>
            <SelectItem value="vault">Vault</SelectItem>
            <SelectItem value="dms">Dead Man's Switch</SelectItem>
            <SelectItem value="blockchain">Blockchain</SelectItem>
            <SelectItem value="security">Security</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      <Card className="glass p-6">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <ScrollText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">No activity matching filters</p>
          </div>
        ) : (
          <ol className="relative space-y-1 ml-4 border-l-2 border-border">
            {filtered.map(l => {
              const cfg = categoryConfig[l.category] || categoryConfig.system;
              const Icon = cfg.icon;
              return (
                <li key={l.id} className="relative pl-6 py-3 group">
                  <div className={`absolute -left-[13px] top-3 h-6 w-6 rounded-full border-2 bg-background flex items-center justify-center ${cfg.color}`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-medium">{l.action}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{format(new Date(l.created_at), "yyyy-MM-dd HH:mm:ss")}</p>
                    </div>
                    <Badge variant="outline" className={`font-mono text-[10px] uppercase ${cfg.color}`}>{l.category}</Badge>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </div>
  );
}
