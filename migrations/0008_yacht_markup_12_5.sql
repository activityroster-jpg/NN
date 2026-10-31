-- Owner's decision (31 Oct 2026): the markup on market prices for yacht
-- estimates is 12.5%. Changeable afterwards in Admin → Yacht prices.
INSERT INTO `setting` (`key`, `value`, `updated_at`) VALUES ('yacht_pricing', '{"markupPct":12.5}', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
ON CONFLICT(`key`) DO UPDATE SET `value` = json_set(`setting`.`value`, '$.markupPct', 12.5), `updated_at` = excluded.`updated_at`;
--> statement-breakpoint
INSERT INTO `audit_log` (`actor`, `action`, `entity`, `entity_id`, `detail`) VALUES ('migration 0008', 'yacht_markup_changed', 'yacht_pricing', NULL, '{"to":12.5,"note":"set by the owner''s request"}');
