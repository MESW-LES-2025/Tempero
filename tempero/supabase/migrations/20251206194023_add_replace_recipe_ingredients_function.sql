-- 1. Function Creation (RPC)
CREATE OR REPLACE FUNCTION replace_recipe_ingredients(
    p_recipe_id UUID,
    p_ingredients JSONB
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- A. Delete all existing ingredients for this recipe
    DELETE FROM "recipe-ingredients"
    WHERE recipe_id = p_recipe_id;

    -- B. Insert new ingredients from the received JSON
    INSERT INTO "recipe-ingredients" (recipe_id, name, amount, unit, notes)
    SELECT
        p_recipe_id,
        (item ->> 'name')::text,
        (item ->> 'amount')::numeric, -- or ::integer, depending on your column
        (item ->> 'unit')::text,
        (item ->> 'notes')::text
    FROM jsonb_array_elements(p_ingredients) AS item;

END;
$$;

-- 2. Permissions
-- Allow authenticated users and the service_role to call the function
GRANT EXECUTE ON FUNCTION replace_recipe_ingredients(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION replace_recipe_ingredients(UUID, JSONB) TO service_role;