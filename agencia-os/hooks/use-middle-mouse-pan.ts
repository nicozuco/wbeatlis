"use client";

import { useEffect, type RefObject } from "react";

// Arrastrar con la rueda central pulsada desplaza el contenedor en cualquier
// dirección, igual que en el lienzo del mapa mental. El desplazamiento vertical
// que el contenedor no puede absorber se aplica a la página.
export function useMiddleMousePan(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 1) return;
      // Evita el autodesplazamiento del navegador (el icono de flechas en Windows).
      event.preventDefault();
      let lastX = event.clientX;
      let lastY = event.clientY;
      let moved = false;
      const previousCursor = document.body.style.cursor;
      document.body.style.cursor = "grabbing";

      const handleMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - lastX;
        const dy = moveEvent.clientY - lastY;
        lastX = moveEvent.clientX;
        lastY = moveEvent.clientY;
        if (Math.abs(dx) + Math.abs(dy) > 0) moved = true;
        element.scrollLeft -= dx;
        const before = element.scrollTop;
        element.scrollTop -= dy;
        const remaining = -dy - (element.scrollTop - before);
        if (remaining) window.scrollBy(0, remaining);
      };

      // Soltar la rueda sobre un enlace después de arrastrar no debe abrirlo en otra pestaña.
      const preventAuxClick = (clickEvent: MouseEvent) => { if (clickEvent.button === 1) clickEvent.preventDefault(); };

      const handleUp = (upEvent: MouseEvent) => {
        if (upEvent.button !== 1) return;
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
        document.body.style.cursor = previousCursor;
        if (moved) {
          window.addEventListener("auxclick", preventAuxClick, { capture: true, once: true });
          setTimeout(() => window.removeEventListener("auxclick", preventAuxClick, { capture: true }), 0);
        }
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    };

    element.addEventListener("mousedown", handleMouseDown);
    return () => element.removeEventListener("mousedown", handleMouseDown);
  }, [ref]);
}
