import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bell, LogOut, Moon, Sun, ShieldCheck, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/auth-helpers";
import { toast } from "sonner";

export function TopBar() {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const nav = useNavigate();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchAlerts = async () => {
      const { count } = await supabase
        .from("activity_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("category", ["security", "dms"]);
      setAlertCount(count ?? 0);
    };
    fetchAlerts();
    const ch = supabase.channel("topbar-alerts")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_logs", filter: `user_id=eq.${user.id}` },
        () => fetchAlerts())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const handleSignOut = async () => {
    await logActivity("User logged out", "auth");
    await signOut();
    toast.success("Vault locked");
    nav("/login");
  };

  const initials = (user?.user_metadata?.name || user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <header className="h-16 border-b border-border bg-background/60 backdrop-blur-xl sticky top-0 z-30 flex items-center px-4 gap-3">
      <SidebarTrigger className="text-muted-foreground hover:text-primary" />

      <div className="hidden md:flex items-center gap-2 ml-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border-success/40 bg-success/5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <span className="font-mono text-xs text-success">ACTIVE SESSION</span>
        </div>
        <Badge variant="outline" className="font-mono text-xs border-primary/40 text-primary gap-1">
          <ShieldCheck className="h-3 w-3" /> QUANTUM SECURE
        </Badge>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={toggle} className="text-muted-foreground hover:text-primary">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary">
              <Bell className="h-4 w-4" />
              {alertCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent shadow-glow-purple animate-pulse" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 glass-strong">
            <DropdownMenuLabel className="font-display">Security Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-3 text-sm text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              {alertCount} security & DMS events tracked
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2 pr-3">
              <Avatar className="h-8 w-8 border border-primary/40">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground font-display text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-xs font-medium">{user?.user_metadata?.name || "Agent"}</span>
                <span className="text-[10px] font-mono text-muted-foreground">{user?.email}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-strong w-56">
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => nav("/settings")}>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" /> Lock Vault
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
