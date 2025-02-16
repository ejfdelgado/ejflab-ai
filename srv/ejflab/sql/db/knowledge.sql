CREATE EXTENSION IF NOT EXISTS vector;
--CREATE EXTENSION IF NOT EXISTS pg_brin_bloom;

CREATE SEQUENCE IF NOT EXISTS public.knowledge_knowledge_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

ALTER SEQUENCE public.knowledge_knowledge_id_seq
    OWNER TO "user";

-- Table: public.knowledge

-- DROP TABLE IF EXISTS public.knowledge;

CREATE TABLE IF NOT EXISTS public.knowledge
(
    id integer NOT NULL DEFAULT nextval('knowledge_knowledge_id_seq'::regclass),
    document_id character varying(36) COLLATE pg_catalog."default" NOT NULL,
    text_indexed TEXT NOT NULL,
    text_answer TEXT NOT NULL,
	dense_vector vector(1024),
	--sparse_vector FLOAT[],
    sparse_vector JSONB,
    CONSTRAINT knowledge_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.knowledge
    OWNER to "user";

CREATE INDEX knowledge_dense_vector_index ON public.knowledge USING ivfflat (dense_vector vector_l2_ops);

-- Only used on reranking
--CREATE INDEX knowledge_sparse_vector_index ON public.knowledge USING BRIN (sparse_vector);
--CREATE INDEX knowledge_sparse_vector_index ON public.knowledge USING GIN (sparse_vector);