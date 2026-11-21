-- Migration: 20261121000001_usage_counters.sql
-- Usage counters table for global daily caps (e.g. LLM API calls)

CREATE TABLE IF NOT EXISTS usage_counters (
    date DATE NOT NULL,
    name TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (date, name)
);

-- Stored procedure for atomic increment
CREATE OR REPLACE FUNCTION increment_usage_counter(p_date DATE, p_name TEXT, p_increment INTEGER DEFAULT 1)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    INSERT INTO usage_counters (date, name, count)
    VALUES (p_date, p_name, p_increment)
    ON CONFLICT (date, name)
    DO UPDATE SET count = usage_counters.count + p_increment
    RETURNING count INTO new_count;
    RETURN new_count;
END;
$$ LANGUAGE plpgsql;
