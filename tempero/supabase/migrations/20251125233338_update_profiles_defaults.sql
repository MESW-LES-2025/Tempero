-- 1) Add defaults
ALTER TABLE profiles
    ALTER COLUMN level SET DEFAULT 1,
    ALTER COLUMN chef_type SET DEFAULT 'New cook';

-- 2) Backfill existing null values so NOT NULL constraint can be applied
UPDATE profiles
SET level = 1
WHERE level IS NULL;

UPDATE profiles
SET chef_type = 'New cook'
WHERE chef_type IS NULL;

-- 3) Set NOT NULL constraints
ALTER TABLE profiles
    ALTER COLUMN level SET NOT NULL,
    ALTER COLUMN chef_type SET NOT NULL;
