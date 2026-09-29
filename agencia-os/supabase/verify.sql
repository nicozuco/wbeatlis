with expected(table_name) as (
  values
    ('Clinic'), ('ClinicProcessStep'), ('Interaction'), ('ClinicStageEvent'), ('Competitor'),
    ('Task'), ('ContentItem'), ('FinanceEntry'), ('MrrSnapshot'),
    ('VaultItem'), ('Note'), ('Tag'), ('_NoteToTag'),
    ('MindMap'), ('MindMapNode'), ('MindMapEdge'),
    ('Reminder'), ('PushSubscription'), ('UserPreference'),
    ('FormationCourse'), ('FormationLesson'), ('FormationSegment'), ('FormationDocument')
), security as (
  select
    e.table_name,
    coalesce(c.relrowsecurity, false) as rls_enabled,
    exists (
      select 1
      from pg_policies p
      where p.schemaname = 'public'
        and p.tablename = e.table_name
        and p.roles @> array['agencia_app']::name[]
    ) as app_policy
  from expected e
  left join pg_class c on c.relname = e.table_name and c.relkind = 'r'
  left join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
)
select
  count(*) as expected_tables,
  count(*) filter (where rls_enabled) as rls_tables,
  count(*) filter (where app_policy) as app_policies,
  (select count(*) from "Clinic") as clinics,
  (select count(*) from "Task") as tasks,
  (select count(*) from "Competitor") as competitors,
  (select count(*) from "ContentItem") as content_items,
  (select count(*) from "FinanceEntry") as finance_entries,
  (select count(*) from "VaultItem") as vault_items,
  (select count(*) from "Note") as notes,
  (select count(*) from "MindMap") as mind_maps,
  (select count(*) from "MindMapNode") as mind_map_nodes,
  (select count(*) from "MindMapEdge") as mind_map_edges,
  (select count(*) from "FormationLesson") as formation_lessons
from security;
