-- list all schemas
SELECT nspname
FROM pg_namespace
WHERE nspname LIKE 'rac_%';