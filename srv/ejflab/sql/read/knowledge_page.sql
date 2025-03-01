SELECT
id,
document_id,
text_indexed,
text_answer,
created,
updated
FROM 
public.knowledge
ORDER BY '${orderColumn | noQuotes}' ${direction | sanitizeNumber}
LIMIT ${limit | sanitizeNumber}
OFFSET ${offset | sanitizeNumber};