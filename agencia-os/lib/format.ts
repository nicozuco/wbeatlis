export const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);

export const formatPercent = (numerator: number, denominator: number) =>
  denominator === 0
    ? "—"
    : new Intl.NumberFormat("es-ES", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format((numerator / denominator) * 100) + "%";

export const formatDate = (value: Date | string | null | undefined, options?: Intl.DateTimeFormatOptions) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    timeZone: "Europe/Madrid",
    ...options,
  }).format(new Date(value));
};

export const toDateInput = (value: Date | string | null | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
