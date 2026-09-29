-- Biblioteca de Formación: copia de consulta del archivo Markdown privado
-- (formacion-mkt-hackers). La escribe solo `npm run formation:import`.

CREATE TABLE "FormationCourse" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "programId" TEXT,
  "mentor" TEXT,
  "campusUrl" TEXT,
  "declaredLessons" INTEGER NOT NULL DEFAULT 0,
  "position" INTEGER NOT NULL,
  "overviewMd" TEXT,
  "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FormationCourse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FormationLesson" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "sourcePath" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "moduleKey" TEXT NOT NULL,
  "moduleTitle" TEXT NOT NULL,
  "modulePosition" INTEGER NOT NULL,
  "sectionTitle" TEXT,
  "position" INTEGER NOT NULL,
  "lessonDate" TEXT,
  "durationSeconds" INTEGER,
  "campusUrl" TEXT,
  "status" TEXT NOT NULL,
  "notesMd" TEXT,
  "transcriptMd" TEXT,
  "visualsMd" TEXT,
  "statusMd" TEXT,
  "tools" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "wordCount" INTEGER NOT NULL DEFAULT 0,
  "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FormationLesson_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FormationLesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "FormationCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "FormationLesson_courseId_slug_key" ON "FormationLesson"("courseId", "slug");
CREATE INDEX "FormationLesson_courseId_position_idx" ON "FormationLesson"("courseId", "position");
CREATE INDEX "FormationLesson_tools_idx" ON "FormationLesson" USING GIN ("tools");

-- Un fragmento por apartado (encabezado) de cada documento de la lección, más
-- una "ficha" con título y módulo. El texto buscable llega ya sin tildes y en
-- minúsculas desde el importador, así que el vector puede ser una columna generada.
CREATE TABLE "FormationSegment" (
  "id" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "level" INTEGER NOT NULL DEFAULT 0,
  "heading" TEXT,
  "anchor" TEXT,
  "timestamp" TEXT,
  "text" TEXT NOT NULL,
  "searchHead" TEXT NOT NULL,
  "searchBody" TEXT NOT NULL,
  "searchVector" tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('spanish'::regconfig, "searchHead"), 'A') ||
    setweight(to_tsvector('spanish'::regconfig, "searchBody"), 'C')
  ) STORED,
  CONSTRAINT "FormationSegment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FormationSegment_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "FormationLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "FormationSegment_lessonId_kind_position_idx" ON "FormationSegment"("lessonId", "kind", "position");
CREATE INDEX "FormationSegment_searchVector_idx" ON "FormationSegment" USING GIN ("searchVector");

-- Documentos descargables de una lección (PDF del campus). Pocos y pequeños:
-- se guardan en la base para servirlos solo a usuarios autenticados.
CREATE TABLE "FormationDocument" (
  "id" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "position" INTEGER NOT NULL,
  "data" BYTEA NOT NULL,
  CONSTRAINT "FormationDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FormationDocument_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "FormationLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "FormationDocument_lessonId_position_idx" ON "FormationDocument"("lessonId", "position");

ALTER TABLE "FormationCourse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FormationLesson" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FormationSegment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FormationDocument" ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON "FormationCourse", "FormationLesson", "FormationSegment", "FormationDocument" TO agencia_app;

CREATE POLICY "agencia_app_full_access" ON "FormationCourse" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
CREATE POLICY "agencia_app_full_access" ON "FormationLesson" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
CREATE POLICY "agencia_app_full_access" ON "FormationSegment" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
CREATE POLICY "agencia_app_full_access" ON "FormationDocument" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
