import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Vault, Skull, Lock, ScrollText, Settings, Users } from "lucide-react";
import { VaultLogo } from "./VaultLogo";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Asset Vault", url: "/vault", icon: Vault },
  { title: "Dead Man's Switch", url: "/dms", icon: Skull },
  { title: "Beneficiaries", url: "/beneficiaries", icon: Users },
  { title: "Encryption Status", url: "/encryption", icon: Lock },
  { title: "Activity Logs", url: "/logs", icon: ScrollText },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border h-16 flex items-center px-3">
        {collapsed ? (
          <div className="mx-auto"><VaultLogo className="[&_.font-display]:hidden [&_.font-mono]:hidden" /></div>
        ) : (
          <VaultLogo />
        )}
      </SidebarHeader>
      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {collapsed ? "" : "Modules"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => {
                const active = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className={`group h-11 transition-all ${
                      active
                        ? "bg-sidebar-accent text-primary border-l-2 border-primary shadow-[inset_0_0_20px_hsl(var(--primary)/0.1)]"
                        : "hover:bg-sidebar-accent/50 hover:text-primary"
                    }`}>
                      <NavLink to={item.url} end>
                        <item.icon className={`h-4 w-4 transition-all ${active ? "text-primary drop-shadow-[0_0_6px_hsl(var(--primary))]" : ""}`} />
                        {!collapsed && <span className="font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
