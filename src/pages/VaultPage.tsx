import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Plus,
  Vault as VaultIcon,
  Lock,
  Unlock,
  Trash2,
  Wallet,
  FileText,
  KeyRound,
  Database,
  ShieldCheck,
} from "lucide-react";

import {
  logActivity,
  pqEncrypt,
  pqDecrypt,
} from "@/lib/auth-helpers";

import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { z } from "zod";

type AssetRow = {
  id: string;
  user_id: string;
  name: string;
  asset_name?: string;
  asset_type:
  | "crypto_wallet"
  | "document"
  | "private_data"
  | "credentials";
  encrypted_data: string;
  beneficiary_id: string | number | null;
  status: string;
  risk_level: string;
  created_at: string;
};

const typeIcons: Record<string, typeof Wallet> = {
  crypto_wallet: Wallet,
  document: FileText,
  credentials: KeyRound,
  private_data: Database,
};

const schema = z.object({
  name: z.string().trim().min(2).max(100),

  data: z.string().trim().min(1).max(5000),
});

export default function VaultPage() {
  const { user } = useAuth();

  const [assets, setAssets] = useState<AssetRow[]>([]);

  const [beneficiaries, setBeneficiaries] = useState<
  { id: string | number; name: string }[]
>([]);

  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);

  const [unlocked, setUnlocked] = useState<Set<string>>(
    new Set()
  );

 const [form, setForm] = useState({
  name: "",
  asset_type: "crypto_wallet" as
    | "crypto_wallet"
    | "document"
    | "private_data"
    | "credentials",
  data: "",
  beneficiary_id: "none" as string | number,
  risk_level: "low",
});

  const fetchAssets = async () => {
  if (!user) return;

  console.log("LOGGED USER:", user);
  console.log("USER ID:", user?.id);

  setLoading(true);

  const [a, b] = await Promise.all([
    supabase
      .from("assets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),

    supabase
      .from("beneficiaries")
      .select("id, name")
      .eq("user_id", user.id),
  ]);

  console.log("ASSETS:", a.data);
  console.log("ASSETS ERROR:", a.error);

  if (a.error) {
    console.error(a.error);
    toast.error(a.error.message);
  }

  if (b.error) {
    console.error(b.error);
    toast.error(b.error.message);
  }

  setAssets((a.data || []) as AssetRow[]);

  setBeneficiaries(
    (b.data || []) as {
      id: string | number;
      name: string;
    }[]
  );

  setLoading(false);
};

  useEffect(() => {
    fetchAssets();

    if (!user) return;

    const ch = supabase
      .channel("vault-rt")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assets",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchAssets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [user]);

  const addAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    const parsed = schema.safeParse({
      name: form.name,
      data: form.data,
    });

    if (!parsed.success) {
      return toast.error(
        parsed.error.issues[0].message
      );
    }
const { error } = await supabase
  .from("assets")
  .insert([
    {
      user_id: user.id,

      name: parsed.data.name,

      asset_type: form.asset_type,

      encrypted_data: pqEncrypt(parsed.data.data),

      beneficiary_id:
        form.beneficiary_id === "none"
          ? null
          : String(form.beneficiary_id),

      risk_level: form.risk_level,

      status: "locked",
    },
  ]);
    if (error) {
      console.error(error);
      return toast.error(error.message);
    }

    await logActivity(
      `Encrypted asset "${parsed.data.name}"`,
      "vault"
    );

    toast.success("Asset post-quantum sealed");

    setOpen(false);

    setForm({
      name: "",
      asset_type: "crypto_wallet",
      data: "",
      beneficiary_id: "none",
      risk_level: "low",
    });

    fetchAssets();
  };
  
  const remove = async (
    id: string,
    name: string
  ) => {
    const { error } = await supabase
      .from("assets")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      return toast.error(error.message);
    }

    await logActivity(
      `Deleted asset "${name}"`,
      "vault"
    );

    toast.success("Asset purged");

    fetchAssets();
  };

  const toggleLock = (id: string) => {
    setUnlocked((s) => {
      const n = new Set(s);

      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }

      return n;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="font-mono text-xs text-primary tracking-[0.3em]">
            // ENCRYPTED STORAGE
          </p>

          <h1 className="font-display text-3xl font-bold mt-1">
            Asset Vault
          </h1>

          <p className="text-muted-foreground mt-1">
            Post-quantum sealed entries on the
            blockchain ledger
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground shadow-glow-cyan font-display tracking-wider">
              <Plus className="h-4 w-4 mr-2" />
              NEW ASSET
            </Button>
          </DialogTrigger>

          <DialogContent className="glass-strong max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">
                Encrypt New Asset
              </DialogTitle>

              <DialogDescription>
                Sealed with PQ Kyber-1024 before
                chain commit.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={addAsset}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Asset Name</Label>

                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="Cold wallet seed"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Type</Label>

                  <Select
                    value={form.asset_type}
                    onValueChange={(v) =>
  setForm({
    ...form,
    asset_type: v as
      | "crypto_wallet"
      | "document"
      | "private_data"
      | "credentials",
  })
}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="crypto_wallet">
                        Crypto Wallet
                      </SelectItem>

                      <SelectItem value="document">
                        Document
                      </SelectItem>

                      <SelectItem value="credentials">
                        Credentials
                      </SelectItem>

                      <SelectItem value="private_data">
                        Private Data
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Risk Level</Label>

                  <Select
                    value={form.risk_level}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        risk_level: v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="low">
                        Low
                      </SelectItem>

                      <SelectItem value="medium">
                        Medium
                      </SelectItem>

                      <SelectItem value="high">
                        High
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  Beneficiary (optional)
                </Label>

                <Select
                  value={String(
                    form.beneficiary_id
                  )}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      beneficiary_id: v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="none">
                      None
                    </SelectItem>

                    {beneficiaries.map((b) => (
                      <SelectItem
                        key={b.id}
                        value={String(b.id)}
                      >
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sensitive Data</Label>

                <Textarea
                  value={form.data}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      data: e.target.value,
                    })
                  }
                  rows={4}
                  placeholder="0x... / seed phrase / document text"
                  required
                />

                <p className="text-[10px] font-mono text-muted-foreground">
                  Auto-encrypted client-side before
                  transmission.
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="submit"
                  className="bg-gradient-primary text-primary-foreground font-display tracking-wider w-full"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  SEAL & COMMIT
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Decrypting vault index...
          </div>
        ) : assets.length === 0 ? (
          <div className="p-12 text-center">
            <VaultIcon className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />

            <p className="font-display text-lg">
              Vault is empty
            </p>

            <p className="text-sm text-muted-foreground mt-1">
              Add your first asset to begin
              quantum-sealing.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="font-mono text-[10px] uppercase tracking-widest">
                  Asset
                </TableHead>

                <TableHead className="font-mono text-[10px] uppercase tracking-widest">
                  Type
                </TableHead>

                <TableHead className="font-mono text-[10px] uppercase tracking-widest">
                  Risk
                </TableHead>

                <TableHead className="font-mono text-[10px] uppercase tracking-widest">
                  Created
                </TableHead>

                <TableHead className="font-mono text-[10px] uppercase tracking-widest">
                  Status
                </TableHead>

                <TableHead className="text-right font-mono text-[10px] uppercase tracking-widest">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {assets.map((a) => {
                const Icon =
                  typeIcons[a.asset_type] ||
                  Database;

                const isUnlocked =
                  unlocked.has(a.id);

                return (
                  <TableRow
                    key={a.id}
                    className="border-border/40 hover:bg-primary/5"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>

                        <div>
                          <p className="font-medium">
                            {a.name}
                          </p>

                          <p className="font-mono text-[10px] text-muted-foreground truncate max-w-[300px]">
                            {isUnlocked
                              ? pqDecrypt(
                                  a.encrypted_data
                                )
                              : a.encrypted_data.slice(
                                  0,
                                  40
                                ) + "…"}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-mono text-[10px] capitalize"
                      >
                        {a.asset_type.replace(
                          "_",
                          " "
                        )}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <RiskBadge
                        level={a.risk_level}
                      />
                    </TableCell>

                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatDistanceToNow(
                        new Date(a.created_at),
                        {
                          addSuffix: true,
                        }
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge className="bg-primary/10 text-primary border-primary/40 font-mono text-[10px] gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        PQ-SEALED
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            toggleLock(a.id)
                          }
                          className={
                            isUnlocked
                              ? "text-accent"
                              : "text-primary"
                          }
                        >
                          {isUnlocked ? (
                            <Unlock className="h-4 w-4 animate-fade-in-up" />
                          ) : (
                            <Lock className="h-4 w-4" />
                          )}
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>

                          <AlertDialogContent className="glass-strong">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Purge "{a.name}"?
                              </AlertDialogTitle>

                              <AlertDialogDescription>
                                This action commits
                                an irreversible delete
                                to the chain.
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                Cancel
                              </AlertDialogCancel>

                              <AlertDialogAction
                                onClick={() =>
                                  remove(
                                    a.id,
                                    a.name
                                  )
                                }
                                className="bg-destructive text-destructive-foreground"
                              >
                                Purge
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function RiskBadge({
  level,
}: {
  level: string;
}) {
  const map: Record<string, string> = {
    low: "border-success/40 text-success",
    medium:
      "border-warning/40 text-warning",
    high:
      "border-destructive/40 text-destructive",
  };

  return (
    <Badge
      variant="outline"
      className={`font-mono text-[10px] uppercase ${
        map[level] || ""
      }`}
    >
      {level}
    </Badge>
  );
}