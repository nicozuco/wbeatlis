"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const widths = {
  md: "sm:max-w-[520px]",
  lg: "sm:max-w-[600px]",
  xl: "sm:max-w-[640px]",
} as const;

// Panel lateral deslizante común a todas las secciones: cabecera con título y
// descripción, y debajo el contenido (normalmente un formulario con su pie).
export function SidePanel({
  open,
  onOpenChange,
  title,
  description,
  size = "md",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  size?: keyof typeof widths;
  children: React.ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={`w-full gap-0 border-border bg-surface p-0 text-text ${widths[size]}`}>
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle className="font-heading text-xl tracking-[-0.02em] text-text">{title}</SheetTitle>
          <SheetDescription className="text-text-muted">{description}</SheetDescription>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}
