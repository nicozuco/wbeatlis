import {
  Building2,
  CalendarDays,
  CalendarRange,
  ChartNoAxesCombined,
  CheckSquare2,
  GraduationCap,
  KeyRound,
  NotebookPen,
  Radar,
  Target,
  WalletCards,
  Waypoints,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { label: string; href: string; icon: LucideIcon };

// Apartados del menú lateral en su orden por defecto. Ajustes y Cerrar sesión
// quedan siempre al pie del menú y no se pueden ocultar.
export const navigationItems: NavItem[] = [
  { label: "Hoy", href: "/hoy", icon: CalendarDays },
  { label: "Objetivos", href: "/objetivos", icon: Target },
  { label: "Clientes", href: "/clientes", icon: Building2 },
  { label: "Analítica", href: "/analitica", icon: ChartNoAxesCombined },
  { label: "Competencia", href: "/competencia", icon: Radar },
  { label: "Mapa mental", href: "/mapa", icon: Waypoints },
  { label: "Tareas", href: "/tareas", icon: CheckSquare2 },
  { label: "Agenda", href: "/agenda", icon: CalendarRange },
  { label: "Formación", href: "/formacion", icon: GraduationCap },
  { label: "Finanzas", href: "/finanzas", icon: WalletCards },
  { label: "Contraseñas", href: "/contrasenas", icon: KeyRound },
  { label: "Notas", href: "/notas", icon: NotebookPen },
];

export const navigationHrefs = navigationItems.map((item) => item.href);

export type NavPreferences = { order: string[]; hidden: string[] };

// Lee lo guardado en UserPreference descartando valores que ya no existen.
export function parseNavPreferences(row: { navOrder: unknown; hiddenNav: unknown } | null): NavPreferences {
  const hrefs = (value: unknown) => (Array.isArray(value) ? [...new Set(value.filter((href): href is string => typeof href === "string" && navigationHrefs.includes(href)))] : []);
  return { order: hrefs(row?.navOrder), hidden: hrefs(row?.hiddenNav) };
}

// Aplica el orden guardado; los apartados nuevos que aún no estén en él van al final.
export function orderedNavigation(preferences: NavPreferences) {
  const byHref = new Map(navigationItems.map((item) => [item.href, item]));
  const ordered = preferences.order.map((href) => byHref.get(href)).filter((item): item is NavItem => Boolean(item));
  return [...ordered, ...navigationItems.filter((item) => !preferences.order.includes(item.href))];
}

export function visibleNavigation(preferences: NavPreferences) {
  return orderedNavigation(preferences).filter((item) => !preferences.hidden.includes(item.href));
}
