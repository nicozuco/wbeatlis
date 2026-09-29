"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { saveAppearance } from "@/app/actions";
import { Switch } from "@/components/ui/switch";
import { accentLabels, accents, applyAppearance, textSizeLabels, textSizes, themeLabels, themes, type Appearance, type ThemePreference } from "@/lib/preferences";

import { SettingRow, SettingsCard } from "./settings-card";

// Miniatura de la app con el tema indicado (y el acento elegido).
function ThemePreview({ theme, accent }: { theme: Exclude<ThemePreference, "system">; accent: Appearance["accent"] }) {
  return (
    <div data-accent-preview={accent} className={`appearance-preview-${theme} flex h-20 overflow-hidden rounded-md border border-border bg-bg`}>
      <div className="flex w-5 flex-col items-center gap-1 border-r border-border bg-surface pt-2">
        <span className="size-2.5 rounded-sm bg-accent-soft ring-1 ring-accent/60" />
        <span className="size-2.5 rounded-sm bg-surface-raised" />
        <span className="size-2.5 rounded-sm bg-surface-raised" />
      </div>
      <div className="flex-1 space-y-1.5 p-2">
        <span className="block h-1.5 w-10 rounded-full bg-text" />
        <span className="block h-1 w-14 rounded-full bg-text-faint" />
        <div className="flex gap-1 pt-1">
          <span className="h-5 flex-1 rounded-sm border border-border bg-surface" />
          <span className="h-5 flex-1 rounded-sm border border-border bg-surface" />
        </div>
        <span className="block h-2 w-8 rounded-sm bg-accent" />
      </div>
    </div>
  );
}

// Tema, color de acento, tamaño del texto y animaciones. Cada cambio se ve al
// momento y se guarda en la cuenta (se aplica en todos tus dispositivos).
export function AppearanceSettings({ initial }: { initial: Appearance }) {
  const [appearance, setAppearance] = useState(initial);
  const [, startTransition] = useTransition();

  const update = (patch: Partial<Appearance>) => {
    const next = { ...appearance, ...patch };
    setAppearance(next);
    applyAppearance(next);
    startTransition(async () => {
      try {
        await saveAppearance(next);
      } catch {
        toast.error("No se pudo guardar la apariencia");
      }
    });
  };

  return (
    <>
      <SettingsCard title="Tema" description="Cómo se ve la aplicación. «Según el sistema» cambia sola entre claro y oscuro con tu dispositivo.">
        <div role="radiogroup" aria-label="Tema" className="grid gap-3 sm:grid-cols-3">
          {themes.map((theme) => {
            const selected = appearance.theme === theme;
            return (
              <button key={theme} type="button" role="radio" aria-checked={selected} onClick={() => update({ theme })} className={`rounded-lg border p-2 text-left transition-colors ${selected ? "border-accent bg-accent-soft" : "border-border hover:border-border-strong"}`}>
                {theme === "system" ? (
                  <div className="grid grid-cols-2 gap-1">
                    <ThemePreview theme="light" accent={appearance.accent} />
                    <ThemePreview theme="dark" accent={appearance.accent} />
                  </div>
                ) : <ThemePreview theme={theme} accent={appearance.accent} />}
                <span className="mt-2 flex items-center justify-between px-1 text-sm font-medium text-text">
                  {themeLabels[theme]}
                  {selected ? <Check className="size-4 text-accent" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard title="Color de acento" description="Botones principales, selección, enlaces y elementos activos.">
        <div role="radiogroup" aria-label="Color de acento" className="flex flex-wrap gap-3">
          {accents.map((accent) => {
            const selected = appearance.accent === accent;
            return (
              <button key={accent} type="button" role="radio" aria-checked={selected} onClick={() => update({ accent })} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${selected ? "border-accent bg-accent-soft text-text" : "border-border text-text-muted hover:border-border-strong hover:text-text"}`}>
                <span data-accent-preview={accent} className="accent-swatch grid size-5 place-items-center rounded-full">
                  {selected ? <Check className="size-3 text-bg" strokeWidth={3} /> : null}
                </span>
                {accentLabels[accent]}
              </button>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard title="Lectura y movimiento">
        <SettingRow label="Tamaño del texto" description="Escala textos y espaciados de toda la aplicación.">
          <div role="radiogroup" aria-label="Tamaño del texto" className="flex rounded-lg border border-border bg-bg p-1">
            {textSizes.map((size, index) => (
              <button key={size} type="button" role="radio" aria-checked={appearance.textSize === size} onClick={() => update({ textSize: size })} className={`flex items-baseline gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${appearance.textSize === size ? "bg-surface-raised text-text" : "text-text-muted hover:text-text"}`}>
                <span className="font-heading font-semibold" style={{ fontSize: 11 + index * 3 }}>Aa</span>
                <span className="hidden sm:inline">{textSizeLabels[size]}</span>
              </button>
            ))}
          </div>
        </SettingRow>
        <SettingRow label="Reducir animaciones" description="Quita transiciones y animaciones de paneles, menús y botones.">
          <Switch checked={appearance.reduceMotion} onCheckedChange={(checked) => update({ reduceMotion: checked })} aria-label="Reducir animaciones" />
        </SettingRow>
      </SettingsCard>
    </>
  );
}
