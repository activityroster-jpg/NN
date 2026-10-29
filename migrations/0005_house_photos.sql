-- Licensed house photos (public/photos/house) on the home page: the hero and
-- the sailing-yacht and catamaran cards. Changeable afterwards in Admin → Photos.
INSERT INTO `setting` (`key`, `value`) VALUES ('business', '{}') ON CONFLICT(`key`) DO NOTHING;
--> statement-breakpoint
UPDATE `setting`
SET `value` = json_patch(`value`, '{"images":{"hero":{"url":"/photos/house/crew-cheering-on-the-bow.jpg","credit":""},"monohull":{"url":"/photos/house/winch-under-sail.jpg","credit":""},"catamaran":{"url":"/photos/house/catamaran-swim-platform.jpg","credit":""}}}'),
    `updated_at` = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE `key` = 'business';
