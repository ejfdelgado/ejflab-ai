-- drop table
DROP TABLE IF EXISTS ${schema | singleWord}.rac_${name | singleWord};

-- drop sequence
DROP SEQUENCE IF EXISTS ${schema | singleWord}.sequence_rac_${name | singleWord};