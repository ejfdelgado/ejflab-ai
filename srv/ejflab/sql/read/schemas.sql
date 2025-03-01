-- list all schemas
SELECT table_schema
FROM information_schema.tables
GROUP BY table_schema;