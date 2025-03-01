-- list tables of schema
SELECT table_name
FROM information_schema.tables
where table_schema = '${schema | noQuotes}'
and table_name like 'rac_%';