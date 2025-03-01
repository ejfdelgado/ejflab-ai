-- list tables of schema
SELECT table_name
FROM information_schema.tables
where table_schema = 'rac_${schema | noQuotes}'
and table_name like 'rac_%';