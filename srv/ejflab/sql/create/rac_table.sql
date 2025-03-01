-- creating table
CREATE SEQUENCE IF NOT EXISTS rac_${schema | singleWord}.sequence_rac_${name | singleWord}
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

ALTER SEQUENCE rac_${schema | singleWord}.sequence_rac_${name | singleWord}
    OWNER TO "user";

CREATE TABLE IF NOT EXISTS rac_${schema | singleWord}.rac_${name | singleWord}
(
    id integer NOT NULL DEFAULT nextval('rac_${schema | singleWord}.sequence_rac_${name | singleWord}'::regclass),
    document_id character varying(36) COLLATE pg_catalog."default" NOT NULL,
    text_indexed TEXT NOT NULL,
    text_answer TEXT NOT NULL,
	dense_vector vector(1024),
    sparse_vector JSONB,
    created bigint NOT NULL,
    updated bigint NOT NULL,
    CONSTRAINT rac_${name | singleWord}_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS rac_${schema | singleWord}.rac_${name | singleWord} OWNER to "user";

CREATE INDEX IF NOT EXISTS rac_${name | singleWord}_dense_vector_index ON rac_${schema | singleWord}.rac_${name | singleWord} USING ivfflat (dense_vector vector_l2_ops);
