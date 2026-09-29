"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Copy, Eye, EyeOff, KeyRound, Link2, Plus, Search, ShieldCheck, Trash2, UserRound, Wand2, X } from "lucide-react";
import { toast } from "sonner";

import { deleteVaultItem, saveVaultItem } from "@/app/actions";
import { fieldClass, textareaClass } from "@/components/shared/field-styles";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { SidePanel } from "@/components/shared/side-panel";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { emptyAccount, generatePassword, type VaultAccount } from "@/lib/vault-crypto";

export type VaultItemData = {
  id: string;
  title: string;
  url: string | null;
  category: string;
  description: string | null;
  accounts: VaultAccount[];
  unavailable: boolean;
};

const CLIPBOARD_CLEAR_MS = 30_000;
const SUGGESTED_CATEGORIES = ["Correo", "Diseño", "IA", "Agentes", "Redes sociales", "Clientes", "Finanzas", "Otros"];
const byName = (a: string, b: string) => a.localeCompare(b, "es");

function hostOf(url: string | null) {
  if (!url) return null;
  try { return new URL(url).host; } catch { return url; }
}

async function copySecret(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copiado`, { description: "Se borrará del portapapeles en 30 segundos." });
    setTimeout(async () => {
      try { if ((await navigator.clipboard.readText()) === value) await navigator.clipboard.writeText(""); } catch { /* El navegador puede denegar la lectura. */ }
    }, CLIPBOARD_CLEAR_MS);
  } catch {
    toast.error("No se pudo copiar al portapapeles");
  }
}

function PasswordInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete="new-password" spellCheck={false} className={`${fieldClass} pr-10 font-mono`} />
      <button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-text-muted hover:bg-surface-raised hover:text-text">
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function AccountEditor({ account, index, onChange, onRemove }: { account: VaultAccount; index: number; onChange: (account: VaultAccount) => void; onRemove: () => void }) {
  const set = (key: keyof VaultAccount, value: string) => onChange({ ...account, [key]: value });
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center gap-2">
        <UserRound className="size-4 shrink-0 text-text-muted" />
        <Input value={account.label} onChange={(event) => set("label", event.target.value)} placeholder={`Cuenta ${index + 1} (ej. Correo de ventas)`} aria-label="Nombre de la cuenta" className={`${fieldClass} h-9 font-medium`} />
        <button type="button" onClick={onRemove} aria-label="Quitar cuenta" className="grid size-9 shrink-0 place-items-center rounded-md text-text-muted hover:bg-danger/10 hover:text-danger"><X className="size-4" /></button>
      </div>
      <div className="mt-3 grid gap-3">
        <label><span className="mb-1.5 block text-xs text-text-muted">Usuario o email</span><Input value={account.username} onChange={(event) => set("username", event.target.value)} autoComplete="off" spellCheck={false} className={fieldClass} /></label>
        <div>
          <div className="mb-1.5 flex items-center justify-between"><span className="text-xs text-text-muted">Contraseña</span><button type="button" onClick={() => set("password", generatePassword(20))} className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover"><Wand2 className="size-3.5" /> Generar segura</button></div>
          <PasswordInput value={account.password} onChange={(value) => set("password", value)} />
        </div>
        <label><span className="mb-1.5 block text-xs text-text-muted">Notas privadas</span><Textarea value={account.notes} onChange={(event) => set("notes", event.target.value)} placeholder="Códigos de recuperación, 2FA…" className={`min-h-16 ${textareaClass}`} /></label>
      </div>
    </div>
  );
}

function VaultItemForm({ item, categories, onClose }: { item: VaultItemData | null; categories: string[]; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ title: item?.title ?? "", url: item?.url ?? "", category: item?.category ?? "", description: item?.description ?? "" });
  const [accounts, setAccounts] = useState<VaultAccount[]>(item?.accounts ?? []);
  const categoryOptions = [...new Set([...categories, ...SUGGESTED_CATEGORIES])].sort(byName);
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      try {
        await saveVaultItem({ id: item?.id, ...form, accounts });
        toast.success(item ? "Entrada actualizada" : "Entrada creada");
        onClose();
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error && error.message.length < 160 ? error.message : "No se pudo guardar la entrada");
      }
    });
  };

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="grid gap-5 overflow-y-auto px-5 py-6">
        <label><Label className="mb-2 text-text-muted">Nombre</Label><Input required value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="Ej. Gmail, Figma, ChatGPT…" className={fieldClass} /></label>
        <label><Label className="mb-2 text-text-muted">Enlace</Label><Input type="url" value={form.url} onChange={(event) => set("url", event.target.value)} placeholder="https://" className={fieldClass} /></label>
        <div>
          <Label htmlFor="vault-category" className="mb-2 text-text-muted">Categoría</Label>
          <Input id="vault-category" required list="vault-categories" value={form.category} onChange={(event) => set("category", event.target.value)} placeholder="Elige o escribe una nueva" className={fieldClass} />
          <datalist id="vault-categories">{categoryOptions.map((option) => <option key={option} value={option} />)}</datalist>
          <div className="mt-2 flex flex-wrap gap-1.5">{categoryOptions.map((option) => <button key={option} type="button" onClick={() => set("category", option)} className={`rounded-md border px-2 py-1 text-xs transition-colors ${form.category === option ? "border-accent bg-accent-soft text-accent" : "border-border text-text-muted hover:border-border-strong hover:text-text"}`}>{option}</button>)}</div>
        </div>
        <label><Label className="mb-2 text-text-muted">Descripción</Label><Textarea value={form.description} onChange={(event) => set("description", event.target.value)} placeholder="Para qué usamos esta herramienta" className={`min-h-16 ${textareaClass}`} /></label>
        <section className="rounded-lg border border-border bg-bg p-4">
          <div className="flex items-center justify-between gap-3"><p className="section-label flex items-center gap-2"><KeyRound className="size-3.5" /> Cuentas</p><span className="text-xs text-text-muted">{accounts.length} {accounts.length === 1 ? "cuenta" : "cuentas"}</span></div>
          {accounts.length === 0 ? <p className="mt-3 text-sm leading-6 text-text-muted">Puedes guardar solo el enlace o añadir una o varias cuentas.</p> : null}
          <div className="mt-3 grid gap-3">{accounts.map((account, index) => <AccountEditor key={index} account={account} index={index} onChange={(next) => setAccounts((current) => current.map((value, position) => position === index ? next : value))} onRemove={() => setAccounts((current) => current.filter((_, position) => position !== index))} />)}</div>
          <Button type="button" variant="outline" onClick={() => setAccounts((current) => [...current, emptyAccount()])} disabled={accounts.length >= 20} className="mt-3 w-full border-dashed border-border bg-surface text-text"><Plus className="size-4" /> Añadir cuenta</Button>
          <p className="mt-3 text-xs leading-5 text-text-faint">Las cuentas se cifran automáticamente al guardar. No necesitas una clave maestra.</p>
        </section>
      </div>
      <footer className="mt-auto flex justify-between border-t border-border p-5">
        {item ? <AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="ghost" className="text-danger hover:bg-danger/10 hover:text-danger"><Trash2 className="size-4" /> Eliminar</Button></AlertDialogTrigger><AlertDialogContent className="border-border bg-surface-raised text-text"><AlertDialogHeader><AlertDialogTitle>Eliminar «{item.title}»</AlertDialogTitle><AlertDialogDescription className="text-text-muted">Se borrarán el enlace y todas sus cuentas. Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="border-border bg-surface text-text">Cancelar</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => startTransition(async () => { try { await deleteVaultItem(item.id); toast.success("Entrada eliminada"); onClose(); router.refresh(); } catch { toast.error("No se pudo eliminar la entrada"); } })}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog> : <span />}
        <Button type="submit" disabled={pending} className="bg-accent text-bg hover:bg-accent-hover">{pending ? "Guardando…" : "Guardar entrada"}</Button>
      </footer>
    </form>
  );
}

function AccountRow({ account, index }: { account: VaultAccount; index: number }) {
  const [revealed, setRevealed] = useState(false);
  const iconButton = "grid size-7 place-items-center rounded-md text-text-muted hover:bg-surface-raised hover:text-text disabled:opacity-40";
  return (
    <div className="rounded-lg bg-bg px-3 py-2.5">
      <p className="truncate text-xs font-medium text-text">{account.label || `Cuenta ${index + 1}`}</p>
      <div className="mt-1.5 flex items-center gap-2"><p className="min-w-0 flex-1 truncate font-mono text-sm text-text-muted">{account.username || "—"}</p><button type="button" disabled={!account.username} onClick={() => void copySecret(account.username, "Usuario")} aria-label="Copiar usuario" className={iconButton}><Copy className="size-3.5" /></button></div>
      <div className="mt-1 flex items-center gap-2"><p className="min-w-0 flex-1 truncate font-mono text-sm text-text">{account.password ? (revealed ? account.password : "••••••••••") : "—"}</p>{account.password ? <button type="button" onClick={() => setRevealed(!revealed)} aria-label={revealed ? "Ocultar contraseña" : "Mostrar contraseña"} className={iconButton}>{revealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}</button> : null}<button type="button" disabled={!account.password} onClick={() => void copySecret(account.password, "Contraseña")} aria-label="Copiar contraseña" className={iconButton}><Copy className="size-3.5" /></button></div>
      {account.notes ? <p className="mt-2 whitespace-pre-wrap border-t border-border pt-2 text-xs leading-5 text-text-muted">{account.notes}</p> : null}
    </div>
  );
}

function VaultCard({ item, onEdit }: { item: VaultItemData; onEdit: () => void }) {
  return (
    <article className="flex flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong">
      <div className="flex items-start justify-between gap-3"><div className={`grid size-10 place-items-center rounded-lg ${item.accounts.length ? "bg-accent-soft text-accent" : "bg-surface-raised text-text-muted"}`}>{item.accounts.length ? <KeyRound className="size-5" /> : <Link2 className="size-5" />}</div><button type="button" onClick={onEdit} disabled={item.unavailable} className="text-xs text-text-faint hover:text-text disabled:opacity-50">Editar</button></div>
      <h3 className="mt-4 font-heading text-lg font-semibold text-text">{item.title}</h3>
      {item.url ? <p className="mt-0.5 truncate text-xs text-text-faint">{hostOf(item.url)}</p> : null}
      {item.description ? <p className="mt-2 text-sm leading-5 text-text-muted">{item.description}</p> : null}
      {item.unavailable ? <p className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-warning">Credenciales anteriores no disponibles.</p> : null}
      {item.accounts.length ? <div className="mt-4 grid gap-2"><p className="text-[11px] uppercase tracking-[0.08em] text-text-faint">{item.accounts.length === 1 ? "1 cuenta" : `${item.accounts.length} cuentas`}</p>{item.accounts.map((account, index) => <AccountRow key={index} account={account} index={index} />)}</div> : null}
      <div className="mt-auto pt-5">{item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover">Abrir recurso <ArrowUpRight className="size-4" /></a> : <span className="text-xs text-text-faint">Sin enlace</span>}</div>
    </article>
  );
}

export function VaultWorkspace({ items }: { items: VaultItemData[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [selected, setSelected] = useState<VaultItemData | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const openItem = (item: VaultItemData | null) => { setSelected(item); setPanelOpen(true); };
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    return [...counts.entries()].sort(([a], [b]) => byName(a, b));
  }, [items]);
  const categories = categoryCounts.map(([name]) => name);
  const filtered = items.filter((item) => {
    const accountText = item.accounts.map((account) => `${account.label} ${account.username}`).join(" ");
    const text = `${item.title} ${item.url ?? ""} ${item.description ?? ""} ${item.category} ${accountText}`.toLocaleLowerCase("es");
    return text.includes(query.toLocaleLowerCase("es")) && (category === "ALL" || category === item.category);
  });
  const groups = [...new Set(filtered.map((item) => item.category))].sort(byName);
  const accountCount = items.reduce((sum, item) => sum + item.accounts.length, 0);
  const chip = (value: string, label: string, count: number) => <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${category === value ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-text-muted hover:border-border-strong hover:text-text"}`}>{label}<span className="font-mono text-xs tabular-nums opacity-70">{count}</span></button>;

  return (
    <>
      <PageHeader title="Contraseñas" description="Equipo · Enlaces y cuentas" actions={<Button onClick={() => openItem(null)} className="h-10 bg-accent text-bg hover:bg-accent-hover"><Plus className="size-4" /> Nueva entrada</Button>} />
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Entradas" value={String(items.length)} note={`${categories.length} categorías`} icon={Link2} />
        <KpiCard label="Cuentas guardadas" value={String(accountCount)} note="en todas las entradas" icon={UserRound} />
        <KpiCard label="Acceso" value="Abierto" note="con tu sesión de la app" icon={ShieldCheck} />
      </section>
      <div className="mt-4 rounded-xl border border-accent/20 bg-accent/[0.04] px-4 py-3 text-sm leading-6 text-text-muted"><span className="font-medium text-text">Sin clave maestra.</span> Las contraseñas se cifran automáticamente y se abren con tu sesión de la app.</div>
      <section className="mt-4 flex flex-col gap-3"><label className="relative sm:w-96"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-faint" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, web, cuenta o email…" className={`${fieldClass} pl-9`} /></label><div className="flex flex-wrap gap-2">{chip("ALL", "Todas", items.length)}{categoryCounts.map(([name, count]) => chip(name, name, count))}</div></section>
      <div className="mt-6 space-y-8">{groups.map((group) => <section key={group}><div className="mb-3 flex items-center gap-3"><h2 className="section-label text-text-muted">{group}</h2><span className="h-px flex-1 bg-border" /></div><div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.filter((item) => item.category === group).map((item) => <VaultCard key={item.id} item={item} onEdit={() => openItem(item)} />)}</div></section>)}{filtered.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-text-muted">{items.length ? "No hay entradas que coincidan con la búsqueda." : "El gestor está vacío. Añade una herramienta o una cuenta cuando quieras."}</div> : null}</div>
      <SidePanel open={panelOpen} onOpenChange={setPanelOpen} size="lg" title={selected ? selected.title : "Nueva entrada"} description="Guarda enlaces y cuentas sin una clave maestra adicional."><VaultItemForm key={selected?.id ?? "new"} item={selected} categories={categories} onClose={() => setPanelOpen(false)} /></SidePanel>
    </>
  );
}
