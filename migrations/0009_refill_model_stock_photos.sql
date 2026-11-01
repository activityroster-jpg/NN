-- Yacht model slots were filled for a short while by a picker that could use
-- the same library photo on every model. Clear the library-picked ones (credit
-- "… / Pixabay" or "… / Unsplash") so they refill without repeats; uploads stay.
UPDATE `setting`
SET `value` = (
      SELECT json_group_object(`key`, json(`value`))
      FROM json_each(`setting`.`value`)
      WHERE NOT (`key` LIKE 'model:%'
                 AND (json_extract(`value`, '$.credit') LIKE '% / Pixabay' OR json_extract(`value`, '$.credit') LIKE '% / Unsplash'))
    ),
    `updated_at` = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE `key` = 'photos';
--> statement-breakpoint
INSERT INTO `audit_log` (`actor`, `action`, `entity`, `entity_id`, `detail`) VALUES ('migration 0009', 'model_stock_photos_cleared', 'photo_slot', NULL, '{"reason":"refill without repeats"}');
