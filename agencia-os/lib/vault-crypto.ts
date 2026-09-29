// Utilidades de las cuentas. La clave de cifrado del gestor ya no depende de
// una contraseña maestra introducida por el usuario.
export type VaultAccount = { label: string; username: string; password: string; notes: string };

export const emptyAccount = (label = ""): VaultAccount => ({ label, username: "", password: "", notes: "" });

export const isAccountEmpty = (account: VaultAccount) =>
  !account.label.trim() && !account.username.trim() && !account.password && !account.notes.trim();

// Sin caracteres ambiguos (0/O, 1/l/I) y con muestreo por rechazo.
const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*-_=+?";

export function generatePassword(length = 20) {
  const limit = 256 - (256 % PASSWORD_ALPHABET.length);
  let result = "";
  while (result.length < length) {
    for (const byte of crypto.getRandomValues(new Uint8Array(length * 2))) {
      if (byte < limit && result.length < length) result += PASSWORD_ALPHABET[byte % PASSWORD_ALPHABET.length];
    }
  }
  return result;
}
