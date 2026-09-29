"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { richTextIsEmpty, sanitizeRichText } from "@/lib/rich-text";
import { useMindMap } from "../mind-map-context";

// Texto con formato de formas y pósits. Doble clic (o Intro con el nodo
// seleccionado) entra en edición: un contentEditable que React no controla —
// su contenido se carga una vez al empezar y se lee al terminar—, así que
// cambiar fuente, tamaño o color durante la edición no pierde lo escrito.
// La barra de formato aplica negrita, tachado, enlaces y listas a la
// selección a través de la sesión que se registra en editorSessionRef.
export function RichTextBlock({
  nodeId,
  selected,
  html,
  padding,
  verticalAlign,
  textStyle,
  placeholder,
}: {
  nodeId: string;
  selected: boolean;
  html: string;
  padding: string;
  verticalAlign: "top" | "center";
  textStyle: CSSProperties;
  placeholder: string;
}) {
  const { updateNodeText, editRequest, clearEditRequest, editorSessionRef } = useMindMap();
  const [editing, setEditing] = useState(false);
  const [handledNonce, setHandledNonce] = useState<number | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  // Petición de edición desde el lienzo (nodo recién creado o Intro).
  if (editRequest && editRequest.nodeId === nodeId && editRequest.nonce !== handledNonce) {
    setHandledNonce(editRequest.nonce);
    setEditing(true);
  }

  const finish = () => {
    const element = editorRef.current;
    if (!element || finishedRef.current) return;
    finishedRef.current = true;
    const next = sanitizeRichText(element.innerHTML);
    const normalized = richTextIsEmpty(next) ? "" : next;
    if (editorSessionRef.current?.element === element) editorSessionRef.current = null;
    setEditing(false);
    clearEditRequest(nodeId);
    if (normalized !== html) updateNodeText(nodeId, normalized);
  };
  const finishRef = useRef(finish);
  useEffect(() => { finishRef.current = finish; });

  useEffect(() => {
    const element = editorRef.current;
    if (!editing || !element) return;
    finishedRef.current = false;
    element.innerHTML = sanitizeRichText(html);
    editorSessionRef.current = { nodeId, element, finish: () => finishRef.current() };
    // Un nodo recién creado sigue oculto hasta que React Flow lo mide: se espera
    // a que sea visible para poder darle el foco y dejar el cursor al final.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        element.focus();
        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      });
    });
    return () => cancelAnimationFrame(frame);
    // El contenido se carga solo al entrar en edición; después manda el propio editor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  // Deseleccionar el nodo (clic en el lienzo, Escape, otra herramienta) termina la edición.
  useEffect(() => {
    if (editing && !selected) finishRef.current();
  }, [editing, selected]);

  const openLink = (event: React.MouseEvent) => {
    const anchor = (event.target as HTMLElement).closest("a");
    const start = pointerStartRef.current;
    if (!anchor) return;
    event.preventDefault();
    // Un arrastre del nodo que termina sobre un enlace no debe abrirlo.
    if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 4) return;
    window.open(anchor.href, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={`absolute inset-0 flex flex-col overflow-hidden ${verticalAlign === "center" ? "justify-center" : "justify-start"}`}
      style={{ padding }}
      onDoubleClick={(event) => { event.stopPropagation(); setEditing(true); }}
    >
      {editing ? (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          className="mindmap-richtext nodrag nopan nowheel max-h-full cursor-text overflow-y-auto outline-none select-text"
          style={textStyle}
          onBlur={(event) => {
            // Pulsar un control de la barra de formato no termina la edición.
            if ((event.relatedTarget as HTMLElement | null)?.closest("[data-mindmap-toolbar]")) return;
            finish();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); finish(); }
          }}
          onPaste={(event) => {
            event.preventDefault();
            document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
          }}
        />
      ) : (
        <div
          className="mindmap-richtext"
          style={textStyle}
          onPointerDown={(event) => { pointerStartRef.current = { x: event.clientX, y: event.clientY }; }}
          onClick={openLink}
          dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }}
        />
      )}
    </div>
  );
}
