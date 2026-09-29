import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";

import { decryptVaultAccounts, encryptVaultAccounts, parseVaultServerKey } from "../lib/vault-cipher";
import { emptyAccount, generatePassword, isAccountEmpty } from "../lib/vault-crypto";

test("gestor: cifra cuentas con una clave del servidor, sin clave maestra del usuario", () => {
  const key = parseVaultServerKey(randomBytes(32).toString("base64"));
  const accounts = [
    { label: "Correo de ventas", username: "ventas@agencia.es", password: "S3cret!ñ", notes: "Códigos: 1234" },
    { label: "Correo personal", username: "yo@agencia.es", password: "Otra-clave", notes: "" },
  ];
  const first = encryptVaultAccounts(accounts, key);
  const second = encryptVaultAccounts(accounts, key);
  assert.match(first, /^sv1\./);
  assert.ok(!first.includes("S3cret") && !first.includes("ventas"));
  assert.notEqual(first, second, "cada cifrado usa un IV distinto");
  assert.deepEqual(decryptVaultAccounts(first, key), accounts);
  assert.throws(() => decryptVaultAccounts(first, randomBytes(32)), "otra clave no puede descifrarlo");
  assert.throws(() => decryptVaultAccounts(`${first.slice(0, -1)}A`, key), "un dato manipulado no puede descifrarse");
});

test("gestor: rechaza claves mal configuradas y reconoce cuentas vacías", () => {
  assert.throws(() => parseVaultServerKey(undefined));
  assert.throws(() => parseVaultServerKey("clave-corta"));
  assert.ok(isAccountEmpty(emptyAccount()));
  assert.ok(!isAccountEmpty({ ...emptyAccount(), password: "x" }));
});

test("gestor: genera contraseñas del tamaño pedido y distintas entre sí", () => {
  const first = generatePassword(24);
  assert.equal(first.length, 24);
  assert.doesNotMatch(first, /[0O1lI]/);
  assert.notEqual(first, generatePassword(24));
});
