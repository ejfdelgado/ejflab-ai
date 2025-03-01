-- drop table
DROP TABLE IF EXISTS rac_${schema | singleWord}.rac_${name | singleWord};

-- drop sequence
DROP SEQUENCE IF EXISTS rac_${schema | singleWord}.sequence_rac_${name | singleWord};