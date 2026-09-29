CREATE TYPE "ExpenseFrequency" AS ENUM ('ONE_TIME', 'SUBSCRIPTION');
CREATE TYPE "ExpensePayer" AS ENUM ('NICO', 'JOEL', 'SHARED');

ALTER TABLE "FinanceEntry"
ADD COLUMN "expenseFrequency" "ExpenseFrequency",
ADD COLUMN "expensePayer" "ExpensePayer";

-- Los gastos anteriores se conservan como pagos puntuales de la cuenta conjunta.
UPDATE "FinanceEntry"
SET "expenseFrequency" = 'ONE_TIME', "expensePayer" = 'SHARED'
WHERE "type" = 'EXPENSE';

ALTER TABLE "FinanceEntry"
ADD CONSTRAINT "FinanceEntry_expense_details_check"
CHECK (
  ("type" = 'EXPENSE' AND "expenseFrequency" IS NOT NULL AND "expensePayer" IS NOT NULL)
  OR
  ("type" = 'INCOME' AND "expenseFrequency" IS NULL AND "expensePayer" IS NULL)
);

CREATE INDEX "FinanceEntry_expenseFrequency_expensePayer_idx"
ON "FinanceEntry"("expenseFrequency", "expensePayer");

GRANT USAGE ON TYPE "ExpenseFrequency", "ExpensePayer" TO agencia_app;
