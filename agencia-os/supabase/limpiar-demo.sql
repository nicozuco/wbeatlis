-- Borra los datos de ejemplo que crea prisma/seed.ts. Pegar en Supabase > SQL Editor.
-- Solo toca registros que coinciden exactamente con los valores ficticios del seed.
-- Equivale a: npx tsx scripts/limpiar-demo.ts --aplicar

-- 1) VISTA PREVIA: ejecuta solo este bloque primero y revisa qué aparece.
SELECT 'Clínica' AS tipo, "name" AS registro FROM "Clinic"
WHERE ("name", COALESCE("email", ''), COALESCE("contactName", '')) IN (
  ('Clínica Dental Velázquez', 'lucia@clinicavelazquez.es', 'Lucía Herrera'),
  ('Instituto Dental Turia', 'carlos@dentalturia.es', 'Carlos Mena'),
  ('Clínica Sonrisa Norte', 'elena@sonrisanorte.es', 'Elena Ruiz'),
  ('Dental Costa Brava', '', 'Marc Vidal'),
  ('Centro Odontológico Alba', 'ana@odontologiaalba.es', 'Ana Robles'),
  ('Clínica Dental Mar', '', 'Marta Soler'))
UNION ALL SELECT 'Tarea', "title" FROM "Task" WHERE "title" IN ('Preparar demo para Velázquez', 'Enviar casos de éxito a Turia', 'Revisar propuesta Sonrisa Norte', 'Actualizar automatización de Alba')
UNION ALL SELECT 'Competidor', "company" FROM "Competitor" WHERE "company" IN ('Dental Growth Lab', 'ClinicFlow AI', 'Patient Engine')
UNION ALL SELECT 'Contenido', "title" FROM "ContentItem" WHERE "title" IN ('5 fugas de pacientes en recepción', 'Demo: seguimiento automático', 'Caso Alba: 7 citas en una semana')
UNION ALL SELECT 'Finanzas', "description" FROM "FinanceEntry" WHERE ("description", "amountCents") IN (('Cuota Centro Odontológico Alba', 145000), ('Implementación Clínica Río', 220000), ('Herramientas de automatización', 38900), ('Publicidad', 62000))
UNION ALL SELECT 'MRR', to_char("month", 'YYYY-MM') FROM "MrrSnapshot" WHERE ("month", "amountCents") IN (('2026-04-01', 180000), ('2026-05-01', 275000), ('2026-06-01', 350000), ('2026-07-01', 470000), ('2026-08-01', 565000), ('2026-09-01', 648000))
UNION ALL SELECT 'Gestor', "title" FROM "VaultItem" WHERE ("title", COALESCE("url", '')) IN (('Figma', 'https://figma.com'), ('Documentación interna', 'https://example.com/docs'), ('Airtable', 'https://airtable.com'))
UNION ALL SELECT 'Nota', "title" FROM "Note" WHERE "title" = 'Argumentos para la próxima propuesta';

-- 2) BORRADO: cuando la vista previa sea correcta, ejecuta este bloque.
BEGIN;
DELETE FROM "Task" WHERE "title" IN ('Preparar demo para Velázquez', 'Enviar casos de éxito a Turia', 'Revisar propuesta Sonrisa Norte', 'Actualizar automatización de Alba');
DELETE FROM "FinanceEntry" WHERE ("description", "amountCents") IN (('Cuota Centro Odontológico Alba', 145000), ('Implementación Clínica Río', 220000), ('Herramientas de automatización', 38900), ('Publicidad', 62000));
DELETE FROM "Clinic"
WHERE ("name", COALESCE("email", ''), COALESCE("contactName", '')) IN (
  ('Clínica Dental Velázquez', 'lucia@clinicavelazquez.es', 'Lucía Herrera'),
  ('Instituto Dental Turia', 'carlos@dentalturia.es', 'Carlos Mena'),
  ('Clínica Sonrisa Norte', 'elena@sonrisanorte.es', 'Elena Ruiz'),
  ('Dental Costa Brava', '', 'Marc Vidal'),
  ('Centro Odontológico Alba', 'ana@odontologiaalba.es', 'Ana Robles'),
  ('Clínica Dental Mar', '', 'Marta Soler'));
DELETE FROM "Competitor" WHERE "company" IN ('Dental Growth Lab', 'ClinicFlow AI', 'Patient Engine');
DELETE FROM "ContentItem" WHERE "title" IN ('5 fugas de pacientes en recepción', 'Demo: seguimiento automático', 'Caso Alba: 7 citas en una semana');
DELETE FROM "MrrSnapshot" WHERE ("month", "amountCents") IN (('2026-04-01', 180000), ('2026-05-01', 275000), ('2026-06-01', 350000), ('2026-07-01', 470000), ('2026-08-01', 565000), ('2026-09-01', 648000));
DELETE FROM "VaultItem" WHERE ("title", COALESCE("url", '')) IN (('Figma', 'https://figma.com'), ('Documentación interna', 'https://example.com/docs'), ('Airtable', 'https://airtable.com'));
DELETE FROM "Note" WHERE "title" = 'Argumentos para la próxima propuesta';
COMMIT;
