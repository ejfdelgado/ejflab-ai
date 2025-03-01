SELECT
id,
document_id,
text_indexed,
text_answer,
created,
updated
FROM 
rac_${schema | singleWord}.rac_${table | singleWord}
ORDER BY ${orderColumn | singleWord} ${direction | singleWord}
LIMIT ${limit | sanitizeNumber}
OFFSET ${offset | sanitizeNumber};