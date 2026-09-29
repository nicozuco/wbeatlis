-- Posventa: fases de servicio después de Contratado.
-- Contratado → Contrato firmado → Primer cobro → Implantación → Cliente activo.
-- Se añaden antes de DISCARDED (y no con AFTER encadenados) porque un valor de
-- enum recién añadido no se puede referenciar dentro de la misma transacción.
ALTER TYPE "PipelinePhase" ADD VALUE IF NOT EXISTS 'CONTRACT_SIGNED' BEFORE 'DISCARDED';
ALTER TYPE "PipelinePhase" ADD VALUE IF NOT EXISTS 'FIRST_PAYMENT' BEFORE 'DISCARDED';
ALTER TYPE "PipelinePhase" ADD VALUE IF NOT EXISTS 'ONBOARDING' BEFORE 'DISCARDED';
ALTER TYPE "PipelinePhase" ADD VALUE IF NOT EXISTS 'ACTIVE' BEFORE 'DISCARDED';
