import { supabase } from "@/integrations/supabase/client";

/**
 * Records an activity log entry for the current user.
 * Compatible with your table columns:
 *
 * id
 * user_id
 * activity
 * type
 * created_at
 */
export async function logActivity(
  activity: string,
  type:
    | "auth"
    | "vault"
    | "dms"
    | "system"
    | "blockchain"
    | "security" = "system"
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // INSERT INTO activity_logs
    const { error } = await supabase
  .from("activity_logs")
  .insert([
    {
      user_id: user.id,
      action: activity,
      category: type,
    },
  ]);

    if (error) {
      console.error("Activity log insert error:", error);
      return;
    }

    // UPDATE last activity timestamp
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      console.error(
        "Profile activity update error:",
        profileError
      );
    }
  } catch (err) {
    console.error("logActivity failed:", err);
  }
}

/**
 * Tiny pseudo "post-quantum" obfuscation
 * (visual only — NOT real encryption)
 */
export function pqEncrypt(plain: string): string {
  const salt = "PQ-VAULT-KYBER-1024::";

  const b64 = btoa(
    unescape(
      encodeURIComponent(salt + plain)
    )
  );

  return `pqv1$${b64}`;
}

export function pqDecrypt(token: string): string {
  if (!token.startsWith("pqv1$")) {
    return token;
  }

  try {
    const decoded = decodeURIComponent(
      escape(atob(token.slice(5)))
    );

    return decoded.replace(
      /^PQ-VAULT-KYBER-1024::/,
      ""
    );
  } catch {
    return "[decryption failed]";
  }
}

/**
 * Password strength checker
 */
export function passwordStrength(
  pw: string
): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
} {
  let s = 0;

  if (pw.length >= 8) s++;

  if (pw.length >= 12) s++;

  if (
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw)
  )
    s++;

  if (
    /\d/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw)
  )
    s++;

  const score = Math.min(
    4,
    s
  ) as 0 | 1 | 2 | 3 | 4;

  return {
    score,
    label: [
      "Too weak",
      "Weak",
      "Fair",
      "Strong",
      "Quantum-grade",
    ][score],
  };
}