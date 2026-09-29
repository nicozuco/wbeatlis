export const GOAL_ATTACHMENT_BUCKET = "goal-step-attachments";
export const GOAL_ATTACHMENT_MAX_BYTES = 4 * 1024 * 1024;
export const GOAL_ATTACHMENT_MAX_PER_STEP = 10;

const formats: Record<string, { contentType: string; label: string }> = {
  pdf: { contentType: "application/pdf", label: "PDF" },
  html: { contentType: "text/html", label: "HTML" },
  htm: { contentType: "text/html", label: "HTML" },
  txt: { contentType: "text/plain", label: "Texto" },
  md: { contentType: "text/plain", label: "Markdown" },
  png: { contentType: "image/png", label: "Imagen" },
  jpg: { contentType: "image/jpeg", label: "Imagen" },
  jpeg: { contentType: "image/jpeg", label: "Imagen" },
  webp: { contentType: "image/webp", label: "Imagen" },
};

export function getGoalAttachmentFormat(name: string) {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  return formats[extension] ? { extension, ...formats[extension] } : null;
}

export function goalAttachmentDisplayName(name: string) {
  return name.replaceAll("\\", "/").split("/").pop()?.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 180) ?? "";
}

export function isGoalAttachmentSignatureValid(bytes: Uint8Array, extension: string) {
  if (extension === "pdf") return bytes.length >= 5 && new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-";
  if (extension === "png") return bytes.length >= 8 && bytes.subarray(0, 8).every((value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index]);
  if (extension === "jpg" || extension === "jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (extension === "webp") return bytes.length >= 12 && new TextDecoder().decode(bytes.subarray(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.subarray(8, 12)) === "WEBP";
  return true;
}
