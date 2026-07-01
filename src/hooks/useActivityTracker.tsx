import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/** Tracks user activity — touches profiles.last_activity_at every minute and on interaction. */
export function useActivityTracker() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    let lastTouch = 0;
    const touch = async () => {
      const now = Date.now();
      if (now - lastTouch < 30_000) return; // debounce 30s
      lastTouch = now;
      await supabase.from("profiles")
        .update({ last_activity_at: new Date().toISOString() })
        .eq("id", user.id);
    };

    const events = ["click", "keydown", "mousemove", "scroll"];
    events.forEach(e => window.addEventListener(e, touch, { passive: true }));
    const interval = setInterval(touch, 60_000);
    touch();

    return () => {
      events.forEach(e => window.removeEventListener(e, touch));
      clearInterval(interval);
    };
  }, [user]);
}
