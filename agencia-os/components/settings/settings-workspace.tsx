"use client";

import { useState, useTransition } from "react";
import { Bell, Check, CircleAlert, Database, Download, Info, Keyboard, KeyRound, LogOut, Monitor, Palette, PanelLeft, ShieldCheck, Smartphone, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";

import { deletePushSubscriptionById, saveProfile, saveStartPage } from "@/app/actions";
import { changePassword, signOut, signOutEverywhere } from "@/app/auth/actions";
import { PushManager } from "@/components/agenda/push-manager";
import { fieldClass, selectContentClass } from "@/components/shared/field-styles";
import { PageHeader } from "@/components/shared/page-header";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { navigationItems } from "@/lib/navigation";
import { initialsOf, type UserSettings } from "@/lib/preferences";

import { AppearanceSettings } from "./appearance-settings";
import { NavigationSettings } from "./navigation-settings";
import { SettingRow, SettingsCard } from "./settings-card";

export type DeviceInfo = { id: string; mine: boolean; userAgent: string | null; createdAt: string; lastSuccessAt: string | null };
export type SystemInfo = { version: string; environment: string; database: boolean; push: boolean; vault: boolean; pendingReminders: number };

const sections = [
  { id: "perfil", label: "Perfil", description: "Cómo te identificas dentro de la aplicación.", icon: UserRound },
  { id: "apariencia", label: "Apariencia", description: "Tema, color de acento, tamaño del texto y animaciones.", icon: Palette },
  { id: "menu", label: "Menú e inicio", description: "Qué apartados ves, en qué orden y dónde empiezas.", icon: PanelLeft },
  { id: "notificaciones", label: "Notificaciones", description: "Avisos de recordatorios y dispositivos que los reciben.", icon: Bell },
  { id: "seguridad", label: "Seguridad", description: "Contraseña, sesiones abiertas y protección de los datos.", icon: ShieldCheck },
  { id: "datos", label: "Datos", description: "Descarga una copia de la información de la agencia.", icon: Database },
  { id: "atajos", label: "Atajos de teclado", description: "Trabaja más rápido sin soltar el teclado.", icon: Keyboard },
  { id: "sistema", label: "Acerca de", description: "Versión y estado de los servicios de la aplicación.", icon: Info },
] as const;

type SectionId = (typeof sections)[number]["id"];
const isSection = (value: string | undefined): value is SectionId => sections.some((section) => section.id === value);

// ── Perfil ─────────────────────────────────────────────────────────────────
function ProfileSection({ email, displayName }: { email: string | null; displayName: string | null }) {
  const [name, setName] = useState(displayName ?? "");
  const [pending, startTransition] = useTransition();
  const dirty = name.trim() !== (displayName ?? "");

  return (
    <SettingsCard
      title="Tu perfil"
      description="Tu nombre aparece en el saludo de Hoy y en el menú lateral, con tus iniciales."
      footer={<Button disabled={!dirty || pending} onClick={() => startTransition(async () => { try { await saveProfile({ displayName: name }); toast.success("Perfil actualizado"); } catch { toast.error("No se pudo guardar el perfil"); } })} className="bg-accent text-bg hover:bg-accent-hover">{pending ? "Guardando…" : "Guardar perfil"}</Button>}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-accent-soft font-heading text-xl font-semibold text-accent">{initialsOf(name || null, email)}</div>
        <div className="grid flex-1 gap-4">
          <label className="grid gap-2">
            <Label className="text-text-muted">Nombre visible</Label>
            <Input value={name} maxLength={60} onChange={(event) => setName(event.target.value)} placeholder="Ej. Nico" className={fieldClass} />
          </label>
          <label className="grid gap-2">
            <Label className="text-text-muted">Email de acceso</Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input value={email ?? "Sin email disponible"} readOnly className={`${fieldClass} text-text-muted`} />
              <span className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 text-sm text-success"><span className="size-1.5 rounded-full bg-success" /> Cuenta activa</span>
            </div>
            <span className="text-xs text-text-faint">El email se gestiona desde Supabase; no se puede cambiar aquí.</span>
          </label>
        </div>
      </div>
    </SettingsCard>
  );
}

// ── Menú e inicio ──────────────────────────────────────────────────────────
function StartPageCard({ settings }: { settings: UserSettings }) {
  const [startPage, setStartPage] = useState(settings.startPage);
  const [pending, startTransition] = useTransition();
  return (
    <SettingsCard title="Página de inicio" description="La que se abre al entrar en la aplicación, al iniciar sesión y al pulsar el logo.">
      <SettingRow label="Empezar en" description={settings.navigation.hidden.includes(startPage) ? "Este apartado está oculto en el menú, pero se abrirá igualmente al entrar." : undefined}>
        <Select value={startPage} disabled={pending} onValueChange={(value) => { setStartPage(value); startTransition(async () => { try { await saveStartPage(value); toast.success("Página de inicio actualizada"); } catch { toast.error("No se pudo guardar la página de inicio"); } }); }}>
          <SelectTrigger className={`${fieldClass} w-56`}><SelectValue /></SelectTrigger>
          <SelectContent className={selectContentClass}>{navigationItems.map((item) => <SelectItem key={item.href} value={item.href}>{item.label}</SelectItem>)}</SelectContent>
        </Select>
      </SettingRow>
    </SettingsCard>
  );
}

// ── Notificaciones ─────────────────────────────────────────────────────────
function describeDevice(userAgent: string | null) {
  if (!userAgent) return { name: "Dispositivo desconocido", mobile: false };
  const os = /iPhone/.test(userAgent) ? "iPhone" : /iPad/.test(userAgent) ? "iPad" : /Android/.test(userAgent) ? "Android" : /Macintosh|Mac OS X/.test(userAgent) ? "Mac" : /Windows/.test(userAgent) ? "Windows" : /Linux/.test(userAgent) ? "Linux" : "Otro sistema";
  const browser = /Edg\//.test(userAgent) ? "Edge" : /Firefox\//.test(userAgent) ? "Firefox" : /CriOS|Chrome\//.test(userAgent) ? "Chrome" : /Safari\//.test(userAgent) ? "Safari" : "Navegador";
  return { name: `${browser} en ${os}`, mobile: /iPhone|iPad|Android/.test(userAgent) };
}

function DevicesCard({ devices }: { devices: DeviceInfo[] }) {
  const [pending, startTransition] = useTransition();
  return (
    <SettingsCard title="Dispositivos con avisos" description="Cada navegador o móvil donde se activaron los avisos. Quita los que ya no uses.">
      {devices.length === 0 ? <p className="text-sm text-text-muted">Ningún dispositivo tiene los avisos activados todavía.</p> : (
        <ul className="divide-y divide-border">
          {devices.map((device) => {
            const { name, mobile } = describeDevice(device.userAgent);
            const Icon = mobile ? Smartphone : Monitor;
            return (
              <li key={device.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-raised text-text-muted"><Icon className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">{name}{device.mine ? <span className="ml-2 text-xs font-normal text-text-faint">tu cuenta</span> : null}</p>
                  <p className="text-xs text-text-muted">Activado el {formatDate(device.createdAt, { day: "numeric", month: "short", year: "numeric" })} · {device.lastSuccessAt ? `último aviso ${formatDate(device.lastSuccessAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : "sin avisos enviados aún"}</p>
                </div>
                <Button variant="ghost" size="sm" disabled={pending} onClick={() => startTransition(async () => { try { await deletePushSubscriptionById(device.id); toast.success("Dispositivo quitado"); } catch { toast.error("No se pudo quitar el dispositivo"); } })} className="text-text-muted hover:bg-danger/10 hover:text-danger"><Trash2 className="size-4" /> Quitar</Button>
              </li>
            );
          })}
        </ul>
      )}
    </SettingsCard>
  );
}

// ── Seguridad ──────────────────────────────────────────────────────────────
function PasswordCard() {
  const [pending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const result = await changePassword({ password, confirmation });
      if (!result.ok) { setFeedback({ kind: "error", text: result.error }); return; }
      setPassword("");
      setConfirmation("");
      setFeedback({ kind: "success", text: "Contraseña actualizada correctamente." });
    });
  };

  return (
    <SettingsCard title="Contraseña de acceso" description="Mínimo 10 caracteres, con mayúscula, minúscula, número y símbolo.">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2"><Label htmlFor="new-password" className="text-text-muted">Nueva contraseña</Label><Input id="new-password" type="password" autoComplete="new-password" required minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} className={fieldClass} /></label>
          <label className="grid gap-2"><Label htmlFor="password-confirmation" className="text-text-muted">Repite la contraseña</Label><Input id="password-confirmation" type="password" autoComplete="new-password" required minLength={10} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={fieldClass} /></label>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {feedback ? <p role="status" className={feedback.kind === "success" ? "flex items-center gap-2 text-sm text-success" : "text-sm text-danger"}>{feedback.kind === "success" ? <Check className="size-4" /> : null}{feedback.text}</p> : <span />}
          <Button type="submit" disabled={pending} className="bg-accent text-bg hover:bg-accent-hover"><KeyRound className="size-4" />{pending ? "Actualizando…" : "Actualizar contraseña"}</Button>
        </div>
      </form>
    </SettingsCard>
  );
}

function SessionsCard() {
  return (
    <SettingsCard title="Sesiones" description="Cierra el acceso si has entrado desde un dispositivo que ya no controlas.">
      <SettingRow label="Este dispositivo" description="Cierra la sesión solo aquí.">
        <form action={signOut}><Button type="submit" variant="outline" className="border-border bg-transparent text-text hover:bg-surface-raised"><LogOut className="size-4" /> Cerrar sesión</Button></form>
      </SettingRow>
      <SettingRow label="Todos los dispositivos" description="Cierra tu sesión en el ordenador, el móvil y cualquier otro navegador. Tendrás que volver a entrar.">
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="outline" className="border-danger/40 bg-transparent text-danger hover:bg-danger/10 hover:text-danger"><LogOut className="size-4" /> Cerrar en todos</Button></AlertDialogTrigger>
          <AlertDialogContent className="border-border bg-surface-raised text-text">
            <AlertDialogHeader><AlertDialogTitle>Cerrar sesión en todos los dispositivos</AlertDialogTitle><AlertDialogDescription className="text-text-muted">Se cerrarán todas tus sesiones abiertas, también esta. Los cambios sin guardar se perderán.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border bg-surface text-text">Cancelar</AlertDialogCancel>
              <form action={signOutEverywhere}><AlertDialogAction type="submit" variant="destructive">Cerrar en todos</AlertDialogAction></form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SettingRow>
    </SettingsCard>
  );
}

function ProtectionCard({ system }: { system: SystemInfo }) {
  const items = [
    { text: "Acceso privado con Supabase Auth y registro público desactivado", ok: true },
    { text: "Datos de negocio protegidos con RLS en todas las tablas", ok: true },
    { text: system.vault ? "Gestor de contraseñas cifrado por el servidor y protegido por la sesión" : "Falta configurar el cifrado del gestor", ok: system.vault },
    { text: "Avisos enviados con un secreto propio, sin exponer la sesión", ok: true },
  ];
  return (
    <SettingsCard title="Protección activa">
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.text} className="flex items-center gap-3 rounded-lg bg-bg px-3 py-2.5 text-sm text-text-muted">
            {item.ok ? <Check className="size-4 shrink-0 text-success" /> : <CircleAlert className="size-4 shrink-0 text-warning" />}{item.text}
          </li>
        ))}
      </ul>
    </SettingsCard>
  );
}

// ── Datos ──────────────────────────────────────────────────────────────────
const exportsList = [
  { id: "clientes", label: "Clientes", description: "Clínicas con su fase, contacto, cuota y fechas." },
  { id: "competencia", label: "Competencia", description: "Agencias rivales con nivel de amenaza, redes y notas." },
  { id: "tareas", label: "Tareas", description: "Todas las tareas con estado, prioridad y clínica." },
  { id: "finanzas", label: "Finanzas", description: "Ingresos y gastos registrados." },
  { id: "contenido", label: "Contenido", description: "Piezas de Instagram con formato, estado y guion." },
  { id: "recordatorios", label: "Recordatorios", description: "Recordatorios de la Agenda." },
];

function DataSection() {
  return (
    <>
      <SettingsCard title="Copia completa" description="Toda la información en un único archivo JSON: clínicas con su historial, tareas, competencia, contenido, finanzas, notas, recordatorios, mapas mentales y enlaces del gestor.">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-text-faint">Las contraseñas no se incluyen en la copia; solo se consultan dentro del gestor.</p>
          <Button asChild className="bg-accent text-bg hover:bg-accent-hover"><a href="/api/export?datos=todo&formato=json" download><Download className="size-4" /> Descargar copia</a></Button>
        </div>
      </SettingsCard>
      <SettingsCard title="Exportar por apartado" description="CSV para abrir en Excel o Google Sheets, o JSON.">
        {exportsList.map((item) => (
          <SettingRow key={item.id} label={item.label} description={item.description}>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="border-border bg-transparent text-text hover:bg-surface-raised"><a href={`/api/export?datos=${item.id}&formato=csv`} download>CSV</a></Button>
              <Button asChild variant="ghost" size="sm" className="text-text-muted hover:text-text"><a href={`/api/export?datos=${item.id}&formato=json`} download>JSON</a></Button>
            </div>
          </SettingRow>
        ))}
      </SettingsCard>
    </>
  );
}

// ── Atajos ─────────────────────────────────────────────────────────────────
const shortcutGroups: { title: string; description: string; items: { keys: string[]; label: string }[] }[] = [
  {
    title: "Mapa mental",
    description: "Herramientas y acciones del lienzo.",
    items: [
      { keys: ["V"], label: "Seleccionar" },
      { keys: ["H"], label: "Mano (mover el lienzo)" },
      { keys: ["P"], label: "Lápiz" },
      { keys: ["M"], label: "Rotulador" },
      { keys: ["E"], label: "Goma" },
      { keys: ["S"], label: "Pósit" },
      { keys: ["R"], label: "Rectángulo" },
      { keys: ["O"], label: "Elipse" },
      { keys: ["T"], label: "Tabla" },
      { keys: ["I"], label: "Imagen" },
      { keys: ["F"], label: "Pantalla completa" },
      { keys: ["Intro"], label: "Editar el texto de la forma o pósit seleccionado" },
      { keys: ["Supr"], label: "Borrar la selección (con Deshacer)" },
      { keys: ["Esc"], label: "Terminar edición o deseleccionar" },
      { keys: ["⌘ / Ctrl", "S"], label: "Guardar el mapa" },
    ],
  },
  {
    title: "Navegar por el lienzo y las tablas",
    description: "Con ratón o trackpad.",
    items: [
      { keys: ["Rueda central", "arrastrar"], label: "Mover el mapa y las tablas largas (Competencia)" },
      { keys: ["Espacio", "arrastrar"], label: "Mover el mapa" },
      { keys: ["⌘ / Ctrl", "rueda"], label: "Zoom en el mapa" },
      { keys: ["Mayús", "clic"], label: "Añadir a la selección" },
    ],
  },
];

function ShortcutsSection() {
  return (
    <>
      {shortcutGroups.map((group) => (
        <SettingsCard key={group.title} title={group.title} description={group.description}>
          <ul className="grid gap-x-8 gap-y-2 md:grid-cols-2">
            {group.items.map((item) => (
              <li key={item.label} className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm text-text-muted last:border-b-0 md:[&:nth-last-child(2)]:border-b-0">
                <span>{item.label}</span>
                <span className="flex shrink-0 items-center gap-1">{item.keys.map((key, index) => <span key={key} className="flex items-center gap-1">{index > 0 ? <span className="text-text-faint">+</span> : null}<Kbd>{key}</Kbd></span>)}</span>
              </li>
            ))}
          </ul>
        </SettingsCard>
      ))}
    </>
  );
}

// ── Acerca de ──────────────────────────────────────────────────────────────
function SystemSection({ system }: { system: SystemInfo }) {
  const status = (ok: boolean, okText: string, badText: string) => (
    <span className={`inline-flex items-center gap-2 text-sm ${ok ? "text-success" : "text-warning"}`}><span className={`size-2 rounded-full ${ok ? "bg-success" : "bg-warning"}`} />{ok ? okText : badText}</span>
  );
  return (
    <>
      <SettingsCard title="Atlis" description="Sistema operativo interno de la agencia.">
        <SettingRow label="Versión"><span className="font-mono text-sm text-text">{system.version}</span></SettingRow>
        <SettingRow label="Entorno"><span className="font-mono text-sm text-text">{system.environment === "production" ? "Producción" : system.environment === "preview" ? "Vista previa" : "Local"}</span></SettingRow>
      </SettingsCard>
      <SettingsCard title="Estado de los servicios" description="Comprobado al abrir esta página.">
        <SettingRow label="Base de datos" description="Supabase Postgres">{status(system.database, "Conectada", "Sin conexión")}</SettingRow>
        <SettingRow label="Avisos push" description={`${system.pendingReminders} recordatorios pendientes de avisar`}>{status(system.push, "Configurados", "Faltan las claves")}</SettingRow>
        <SettingRow label="Gestor de contraseñas" description="Cifrado en el servidor, sin clave maestra">{status(system.vault, "Configurado", "Falta configurar")}</SettingRow>
      </SettingsCard>
    </>
  );
}

// ── Pantalla ───────────────────────────────────────────────────────────────
export function SettingsWorkspace({ initialSection, email, settings, vapidPublicKey, devices, system }: {
  initialSection: string | undefined;
  email: string | null;
  settings: UserSettings;
  vapidPublicKey: string | null;
  devices: DeviceInfo[];
  system: SystemInfo;
}) {
  const [section, setSection] = useState<SectionId>(isSection(initialSection) ? initialSection : "perfil");
  const current = sections.find((item) => item.id === section)!;

  // La sección queda en la URL (?seccion=) para poder enlazarla o recargar sin perderla.
  const select = (id: SectionId) => {
    setSection(id);
    const url = new URL(window.location.href);
    url.searchParams.set("seccion", id);
    window.history.replaceState(null, "", url);
  };

  return (
    <>
      <PageHeader title="Ajustes" description="Cuenta · Preferencias · Sistema" />

      <div className="mt-8 grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
        <nav aria-label="Secciones de ajustes" className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto px-1 lg:sticky lg:top-8 lg:mx-0 lg:flex-col lg:self-start lg:overflow-visible lg:px-0">
          {sections.map((item) => {
            const Icon = item.icon;
            const active = item.id === section;
            return (
              <button key={item.id} type="button" aria-current={active ? "page" : undefined} onClick={() => select(item.id)} className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${active ? "bg-accent-soft font-medium text-accent" : "text-text-muted hover:bg-surface-raised hover:text-text"}`}>
                <Icon className="size-4 shrink-0" />{item.label}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 space-y-5">
          <header>
            <h2 className="font-heading text-2xl font-semibold tracking-[-0.02em] text-text">{current.label}</h2>
            <p className="mt-1 text-sm text-text-muted">{current.description}</p>
          </header>

          {section === "perfil" ? <ProfileSection email={email} displayName={settings.displayName} /> : null}
          {section === "apariencia" ? <AppearanceSettings initial={settings.appearance} /> : null}
          {section === "menu" ? (
            <>
              <StartPageCard settings={settings} />
              <SettingsCard title="Apartados del menú" description="Ordénalos arrastrando o con las flechas y oculta los que no uses. Ajustes y Cerrar sesión siempre quedan al pie.">
                <NavigationSettings initial={settings.navigation} />
              </SettingsCard>
            </>
          ) : null}
          {section === "notificaciones" ? (
            <>
              <div className="[&>section]:mt-0"><PushManager vapidPublicKey={vapidPublicKey} deviceCount={devices.length} /></div>
              <DevicesCard devices={devices} />
            </>
          ) : null}
          {section === "seguridad" ? (
            <>
              <PasswordCard />
              <SessionsCard />
              <ProtectionCard system={system} />
            </>
          ) : null}
          {section === "datos" ? <DataSection /> : null}
          {section === "atajos" ? <ShortcutsSection /> : null}
          {section === "sistema" ? <SystemSection system={system} /> : null}
        </div>
      </div>
    </>
  );
}
