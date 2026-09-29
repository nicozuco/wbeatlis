"use client";

import { useSyncExternalStore } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ContactsChart({ data }: { data: { day: string; contacts: number }[] }) {
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  if (!mounted) return <div className="h-[240px] w-full" aria-hidden="true" />;

  return (
    <div className="h-[240px] w-full" aria-label="Contactos registrados durante los últimos siete días">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <AreaChart data={data} margin={{ top: 10, right: 6, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="contacts-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12, fontFamily: "var(--font-jetbrains-mono)" }} dy={10} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--text-faint)", fontSize: 11, fontFamily: "var(--font-jetbrains-mono)" }} />
          <Tooltip contentStyle={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "12px" }} labelStyle={{ color: "var(--text-muted)" }} cursor={{ stroke: "var(--border-strong)" }} />
          <Area type="monotone" dataKey="contacts" name="Contactos" stroke="var(--accent)" strokeWidth={2} fill="url(#contacts-fill)" activeDot={{ r: 4, fill: "var(--accent)", stroke: "var(--bg)", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
