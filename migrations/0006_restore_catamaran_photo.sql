-- Put back the catamaran card photo that 0005 replaced: the last photo set
-- in that slot, as the audit log recorded it (autofill, refresh or upload).
-- If the log holds none, the house photo from 0005 stays.
UPDATE `setting`
SET `value` = json_set(
      `value`,
      '$.images.catamaran',
      json_object(
        'url', (SELECT json_extract(`detail`, '$.url') FROM `audit_log`
                WHERE `entity` = 'photo_slot' AND `entity_id` = 'home:catamaran' AND json_extract(`detail`, '$.url') IS NOT NULL
                ORDER BY `id` DESC LIMIT 1),
        'credit', ''
      )
    ),
    `updated_at` = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE `key` = 'business'
  AND EXISTS (SELECT 1 FROM `audit_log`
              WHERE `entity` = 'photo_slot' AND `entity_id` = 'home:catamaran' AND json_extract(`detail`, '$.url') IS NOT NULL);
