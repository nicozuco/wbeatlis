"use client";

import type { LucideIcon } from "lucide-react";

export function ViewToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; icon: LucideIcon }[];
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-bg p-1">
      {options.map(({ value: option, label, icon: Icon }) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={value === option}
          className={`flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors ${value === option ? "bg-surface-raised text-text" : "text-text-muted hover:text-text"}`}
        >
          <Icon className="size-4" /> {label}
        </button>
      ))}
    </div>
  );
}
