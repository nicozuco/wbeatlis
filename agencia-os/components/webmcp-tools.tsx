"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { saveClinic, saveTask } from "@/app/actions";
import { pipelinePhases, type PipelinePhaseValue } from "@/lib/domain";

type ToolDefinition = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: unknown) => Promise<unknown>;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
};

declare global {
  interface Document {
    readonly modelContext?: {
      registerTool(tool: ToolDefinition, options?: { signal?: AbortSignal }): void | Promise<void>;
    };
  }
}

function objectInput(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("La entrada debe ser un objeto");
  return input as Record<string, unknown>;
}

export function WebMcpTools() {
  const router = useRouter();

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();

    const register = (tool: ToolDefinition) => {
      try {
        void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined);
      } catch {
        // Browsers without a complete WebMCP implementation can ignore these tools.
      }
    };

    register({
      name: "create_clinic",
      title: "Añadir clínica",
      description: "Crea una clínica en el CRM y actualiza el pipeline visible.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1 },
          city: { type: "string" },
          contactName: { type: "string" },
          leadSource: { type: "string" },
          phase: { type: "string", enum: [...pipelinePhases] },
          nextFollowUpAt: { type: "string", format: "date" },
        },
        required: ["name"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        const value = objectInput(input);
        if (typeof value.name !== "string" || !value.name.trim()) throw new Error("name es obligatorio");
        const phase = typeof value.phase === "string" && (pipelinePhases as readonly string[]).includes(value.phase)
          ? value.phase as PipelinePhaseValue
          : "UNCONTACTED";
        await saveClinic({
          name: value.name,
          city: typeof value.city === "string" ? value.city : null,
          contactName: typeof value.contactName === "string" ? value.contactName : null,
          leadSource: typeof value.leadSource === "string" ? value.leadSource : null,
          phase,
          nextFollowUpAt: typeof value.nextFollowUpAt === "string" ? value.nextFollowUpAt : null,
          email: "",
        });
        router.refresh();
        return { status: "created", name: value.name };
      },
    });

    register({
      name: "create_task",
      title: "Crear tarea",
      description: "Crea una tarea pendiente con categoría, prioridad y fecha límite opcionales.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1 },
          category: { type: "string" },
          priority: { type: "string", enum: ["URGENT", "IMPORTANT"] },
          dueAt: { type: "string", format: "date" },
        },
        required: ["title"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        const value = objectInput(input);
        if (typeof value.title !== "string" || !value.title.trim()) throw new Error("title es obligatorio");
        await saveTask({
          title: value.title,
          category: typeof value.category === "string" ? value.category : null,
          priority: value.priority === "URGENT" || value.priority === "IMPORTANT" ? value.priority : null,
          dueAt: typeof value.dueAt === "string" ? value.dueAt : null,
          status: "TODO",
        });
        router.refresh();
        return { status: "created", title: value.title };
      },
    });

    return () => lifecycle.abort();
  }, [router]);

  return null;
}
