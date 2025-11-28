-- 1) Add the columns as nullable so we can fill existing rows
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- 2) Fill existing rows with NOW() where NULL
UPDATE reviews
SET created_at = NOW()
WHERE created_at IS NULL;

UPDATE reviews
SET updated_at = NOW()
WHERE updated_at IS NULL;

-- 3) Make columns NOT NULL
ALTER TABLE reviews
ALTER COLUMN created_at SET NOT NULL,
ALTER COLUMN updated_at SET NOT NULL;

-- 4) Add trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_reviews_updated_at ON reviews;

CREATE TRIGGER trigger_update_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_reviews_updated_at();