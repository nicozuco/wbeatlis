"use client";

import { Fragment } from "react";
import { Handle, Position, useConnection, useStore } from "@xyflow/react";
import { ArrowUp } from "lucide-react";

import { HANDLE_MIN_ZOOM } from "../graph-utils";
import { useMindMap } from "../mind-map-context";

const HANDLE_POSITIONS = [Position.Top, Position.Right, Position.Bottom, Position.Left];
const ARROW_ROTATION: Record<Position, number> = { top: 0, right: 90, bottom: 180, left: 270 };

// Como en FigJam: los conectores solo aparecen en el nodo seleccionado y con
// zoom suficiente, y en todos los nodos mientras se arrastra una conexión (para
// poder soltarla sobre cualquiera). Ocultos no capturan el puntero: si no, sus
// zonas invisibles iniciarían conexiones o bloquearían el arrastre del nodo.
//
// En formas y pósits, pasar el ratón por un conector muestra una flecha que crea
// una copia conectada en esa dirección, con una vista previa de dónde quedará.
export function NodeHandles({ nodeId, selected, cloneable }: { nodeId: string; selected: boolean; cloneable: boolean }) {
  const connecting = useConnection((connection) => connection.inProgress);
  const zoomedIn = useStore((state) => state.transform[2] >= HANDLE_MIN_ZOOM);
  const { cloneNode } = useMindMap();
  const visible = connecting || (selected && zoomedIn);
  const showClone = cloneable && selected && zoomedIn && !connecting;

  return (
    <>
      {HANDLE_POSITIONS.map((position) => (
        <Fragment key={position}>
          <Handle id={position} type="source" position={position} className={visible ? "mindmap-handle" : "mindmap-handle mindmap-handle-hidden"} />
          {showClone ? (
            <>
              <button
                type="button"
                aria-label="Crear una copia conectada"
                className={`nodrag nopan mindmap-clone-button mindmap-clone-${position}`}
                onClick={(event) => { event.stopPropagation(); cloneNode(nodeId, position); }}
              >
                <span>
                  <ArrowUp className="size-3" strokeWidth={2.5} style={{ transform: `rotate(${ARROW_ROTATION[position]}deg)` }} />
                </span>
              </button>
              <div aria-hidden className={`mindmap-clone-ghost mindmap-clone-ghost-${position}`} />
            </>
          ) : null}
        </Fragment>
      ))}
    </>
  );
}
