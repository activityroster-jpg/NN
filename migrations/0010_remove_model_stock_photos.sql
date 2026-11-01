-- Yacht model pages now show uploaded photos only: remove the library photos
-- (credit "… / Pixabay" or "… / Unsplash") from their slots. Uploads stay.
UPDATE `setting`
SET `value` = (
      SELECT COALESCE(json_group_object(`key`, json(`value`)), '{}')
      FROM json_each(`setting`.`value`)
      WHERE NOT (`key` LIKE 'model:%'
                 AND (COALESCE(json_extract(`value`, '$.credit'), '') LIKE '% / Pixabay'
                      OR COALESCE(json_extract(`value`, '$.credit'), '') LIKE '% / Unsplash'))
    ),
    `updated_at` = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE `key` = 'photos';
--> statement-breakpoint
INSERT INTO `audit_log` (`actor`, `action`, `entity`, `entity_id`, `detail`) VALUES ('migration 0010', 'model_stock_photos_removed', 'photo_slot', NULL, '{"reason":"yacht pages show uploads only"}');
