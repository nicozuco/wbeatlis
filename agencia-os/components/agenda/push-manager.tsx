"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff, BellRing, Share, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { deletePushSubscription, savePushSubscription, sendTestPush } from "@/app/actions";
import { Button } from "@/components/ui/button";

type PushStatus = "loading" | "unconfigured" | "unsupported" | "ios-install" | "denied" | "off" | "on";

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

function applicationServerKey(base64: string) {
  const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

const subscriptionPayload = (subscription: PushSubscription) => {
  const json = subscription.toJSON();
  return { endpoint: json.endpoint ?? subscription.endpoint, keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" }, userAgent: navigator.userAgent.slice(0, 400) };
};

// Registra el service worker y averigua si este dispositivo ya recibe avisos. Si
// ya estaba suscrito, vuelve a guardar la suscripción por si el servidor la perdió.
async function detectPushStatus(vapidPublicKey: string | null): Promise<PushStatus> {
  if (!vapidPublicKey) return "unconfigured";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return isIOS() && !isStandalone() ? "ios-install" : "unsupported";
  }
  if (Notification.permission === "denied") return "denied";
  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return "off";
  await savePushSubscription(subscriptionPayload(subscription)).catch(() => undefined);
  return "on";
}

function usePushStatus(vapidPublicKey: string | null) {
  const [status, setStatus] = useState<PushStatus>("loading");
  useEffect(() => {
    let cancelled = false;
    detectPushStatus(vapidPublicKey).then((next) => { if (!cancelled) setStatus(next); }).catch(() => { if (!cancelled) setStatus("unsupported"); });
    return () => { cancelled = true; };
  }, [vapidPublicKey]);
  return [status, setStatus] as const;
}

export function AgendaPushNotice({ vapidPublicKey }: { vapidPublicKey: string | null }) {
  const [status] = usePushStatus(vapidPublicKey);
  if (status === "loading" || status === "on") return null;

  const notices = {
    unconfigured: { icon: BellOff, title: "Avisos no disponibles", text: "Este dispositivo no recibirá notificaciones hasta que se configuren los avisos." },
    unsupported: { icon: BellOff, title: "Este navegador no admite avisos", text: "Usa un navegador compatible para recibir los recordatorios." },
    "ios-install": { icon: Smartphone, title: "Instala la app para recibir avisos", text: "En iPhone, añádela a la pantalla de inicio y activa los avisos desde Ajustes." },
    denied: { icon: BellOff, title: "Avisos bloqueados en este dispositivo", text: "Permite las notificaciones en el navegador o en el sistema y recarga la página." },
    off: { icon: BellOff, title: "Avisos desactivados en este dispositivo", text: "Actívalos para recibir los recordatorios a su hora." },
  };
  const { icon: Icon, title, text } = notices[status];
  return (
    <section role="status" className="mt-4 flex flex-col gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 sm:flex-row sm:items-center">
      <Icon className="size-5 shrink-0 text-warning" />
      <div className="flex-1"><p className="text-sm font-medium text-text">{title}</p><p className="mt-0.5 text-xs text-text-muted">{text}</p></div>
      <Link href="/ajustes?seccion=notificaciones" className="shrink-0 text-sm font-medium text-accent hover:underline">Configurar en Ajustes</Link>
    </section>
  );
}

export function PushManager({ vapidPublicKey, deviceCount }: { vapidPublicKey: string | null; deviceCount: number }) {
  const [status, setStatus] = usePushStatus(vapidPublicKey);
  const [devices, setDevices] = useState(deviceCount);
  const [pending, startTransition] = useTransition();

  const enable = () => startTransition(async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setStatus(permission === "denied" ? "denied" : "off"); return; }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationServerKey(vapidPublicKey!) });
      const result = await savePushSubscription(subscriptionPayload(subscription));
      setDevices(result.devices);
      setStatus("on");
      toast.success("Avisos activados en este dispositivo");
    } catch {
      toast.error("No se pudieron activar los avisos en este dispositivo");
    }
  });

  const disable = () => startTransition(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const result = await deletePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
        setDevices(result.devices);
      }
      setStatus("off");
      toast.success("Avisos desactivados en este dispositivo");
    } catch {
      toast.error("No se pudieron desactivar los avisos");
    }
  });

  const test = () => startTransition(async () => {
    try {
      const result = await sendTestPush();
      toast.success(result.delivered === 1 ? "Aviso de prueba enviado a 1 dispositivo" : `Aviso de prueba enviado a ${result.delivered} dispositivos`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo enviar el aviso de prueba");
    }
  });

  if (status === "loading") return null;

  const content: Record<Exclude<PushStatus, "loading">, { icon: typeof Bell; tone: string; title: string; text: string }> = {
    unconfigured: { icon: BellOff, tone: "text-text-muted", title: "Avisos pendientes de configurar", text: "Faltan las claves de avisos en el servidor. Los recordatorios se ven en la Agenda, pero todavía no llegan como notificación." },
    unsupported: { icon: BellOff, tone: "text-text-muted", title: "Este navegador no admite avisos", text: "Usa Chrome, Edge, Firefox o Safari actualizados para recibir los recordatorios." },
    "ios-install": { icon: Smartphone, tone: "text-warning", title: "Instala la app para recibir avisos en el iPhone", text: "Pulsa Compartir y luego «Añadir a pantalla de inicio». Abre Atlis desde ese icono y activa los avisos en Ajustes." },
    denied: { icon: BellOff, tone: "text-danger", title: "Avisos bloqueados en este dispositivo", text: "Permite las notificaciones de Atlis en los ajustes del navegador o del sistema y recarga la página." },
    off: { icon: Bell, tone: "text-text-muted", title: "Avisos desactivados en este dispositivo", text: `Actívalos para que cada recordatorio te llegue a su hora. ${devices === 1 ? "1 dispositivo" : `${devices} dispositivos`} con avisos en total.` },
    on: { icon: BellRing, tone: "text-accent", title: "Avisos activados en este dispositivo", text: `Los recordatorios llegan a su hora. ${devices === 1 ? "1 dispositivo" : `${devices} dispositivos`} con avisos en total.` },
  };
  const { icon: Icon, tone, title, text } = content[status];

  return (
    <section aria-live="polite" className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center">
      <div className="flex items-start gap-3 sm:flex-1">
        <div className={`grid size-10 shrink-0 place-items-center rounded-lg bg-surface-raised ${tone}`}><Icon className="size-5" /></div>
        <div><p className="text-sm font-medium text-text">{title}</p><p className="mt-0.5 text-xs leading-5 text-text-muted">{text}</p></div>
      </div>
      {status === "ios-install" ? <Share className="hidden size-5 text-text-faint sm:block" /> : null}
      {status === "off" ? <Button disabled={pending} onClick={enable} className="bg-accent text-bg hover:bg-accent-hover"><Bell className="size-4" />{pending ? "Activando…" : "Activar avisos"}</Button> : null}
      {status === "on" ? (
        <div className="flex gap-2">
          <Button variant="outline" disabled={pending} onClick={test} className="border-border bg-surface-raised text-text">Enviar prueba</Button>
          <Button variant="ghost" disabled={pending} onClick={disable} className="text-text-muted hover:text-text">Desactivar</Button>
        </div>
      ) : null}
    </section>
  );
}
