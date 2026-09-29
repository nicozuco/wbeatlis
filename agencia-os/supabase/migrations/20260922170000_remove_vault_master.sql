-- El gestor usa una clave de servidor; ya no necesita la antigua configuración
-- de clave maestra. Las entradas se conservan en esta migración.
DROP TABLE "VaultConfig";
