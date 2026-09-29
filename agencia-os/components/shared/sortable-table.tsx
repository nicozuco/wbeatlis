"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type SortValue = string | number | boolean | null | undefined;

export type Column<T> = {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  // Sin sortValue la columna no es ordenable.
  sortValue?: (row: T) => SortValue;
  align?: "left" | "right";
  className?: string;
  headClassName?: string;
};

type SortState = { id: string; desc: boolean };

const isEmpty = (value: SortValue) => value === null || value === undefined || value === "";

// Los vacíos van siempre al final, en ambos sentidos.
function compare(a: SortValue, b: SortValue, desc: boolean) {
  if (isEmpty(a) || isEmpty(b)) return isEmpty(a) === isEmpty(b) ? 0 : isEmpty(a) ? 1 : -1;
  let result: number;
  if (typeof a === "number" && typeof b === "number") result = a - b;
  else if (typeof a === "boolean" && typeof b === "boolean") result = Number(a) - Number(b);
  else result = String(a).localeCompare(String(b), "es", { numeric: true, sensitivity: "base" });
  return desc ? -result : result;
}

export function SortableTable<T>({
  rows,
  columns,
  getRowId,
  onRowClick,
  initialSort,
  tableClassName = "",
  rowClassName = "",
  emptyMessage,
}: {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  initialSort?: SortState;
  tableClassName?: string;
  rowClassName?: string;
  emptyMessage?: string;
}) {
  const [sort, setSort] = useState<SortState | null>(initialSort ?? null);
  const sortColumn = sort ? columns.find((column) => column.id === sort.id) : undefined;
  const sortValue = sortColumn?.sortValue;
  const sorted = sortValue && sort ? [...rows].sort((a, b) => compare(sortValue(a), sortValue(b), sort.desc)) : rows;

  const toggleSort = (id: string) => setSort((current) => (current?.id === id ? { id, desc: !current.desc } : { id, desc: false }));

  return (
    <Table className={tableClassName}>
      <TableHeader>
        <TableRow className="border-border bg-bg/55 hover:bg-bg/55">
          {columns.map((column) => {
            const active = sort?.id === column.id;
            const alignClass = column.align === "right" ? "text-right" : "";
            return (
              <TableHead
                key={column.id}
                aria-sort={active ? (sort.desc ? "descending" : "ascending") : column.sortValue ? "none" : undefined}
                className={`h-11 text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted ${alignClass} ${column.headClassName ?? ""}`}
              >
                {column.sortValue ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(column.id)}
                    className={`inline-flex items-center gap-1 whitespace-nowrap uppercase tracking-[0.08em] transition-colors hover:text-text ${active ? "text-text" : ""}`}
                  >
                    {column.header}
                    {active ? (sort.desc ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />) : <ArrowUpDown className="size-3 text-text-faint" />}
                  </button>
                ) : (
                  column.header
                )}
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row) => (
          <TableRow
            key={getRowId(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={`border-border hover:bg-surface-raised ${onRowClick ? "cursor-pointer" : ""} ${rowClassName}`}
          >
            {columns.map((column) => (
              <TableCell key={column.id} className={`${column.align === "right" ? "text-right" : ""} ${column.className ?? ""}`}>
                {column.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
        {sorted.length === 0 && emptyMessage ? (
          <TableRow className="border-border hover:bg-transparent">
            <TableCell colSpan={columns.length} className="h-32 text-center text-sm text-text-muted">{emptyMessage}</TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}
