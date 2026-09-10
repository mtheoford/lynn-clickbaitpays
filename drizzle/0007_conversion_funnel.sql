-- Additive: retain legacy page views and clicks; new stages begin at migration time.
ALTER TABLE signup_page_events ADD COLUMN journey_hash text;
ALTER TABLE signup_page_events ADD COLUMN locale text;
ALTER TABLE signup_page_events ADD COLUMN device_type text;
ALTER TABLE signup_page_events ADD COLUMN plan text;
ALTER TABLE signup_page_events ADD COLUMN error_code text;
ALTER TABLE signup_page_events ADD COLUMN field text;
CREATE INDEX idx_signup_page_events_journey_created ON signup_page_events (journey_hash, created_at);
CREATE TABLE signup_analytics_versions (id text PRIMARY KEY NOT NULL, started_at integer NOT NULL);
INSERT INTO signup_analytics_versions (id, started_at)
VALUES ('conversion_v2', CAST(strftime('%s', 'now') AS integer) * 1000)
ON CONFLICT (id) DO NOTHING;
