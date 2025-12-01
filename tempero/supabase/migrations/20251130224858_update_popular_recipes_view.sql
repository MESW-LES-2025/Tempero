-- Drop the view if it already exists
DROP VIEW IF EXISTS public.popular_recipes;

-- Create the view
CREATE VIEW public.popular_recipes AS
SELECT
  r.id,
  r.title,
  r.image_url,
  r.short_description,
  r.prep_time,
  r.cook_time,
  r.difficulty,
  r.servings,
  COALESCE(AVG(rv.review), 0) AS avg_rating,
  COUNT(DISTINCT rv.id) AS reviews_count,
  COUNT(DISTINCT rl.auth_id) AS likes_count,
  (
    COALESCE(AVG(rv.review), 0) 
    * (LN(COUNT(DISTINCT rv.id) + 1) / LN(2))   
    + COUNT(DISTINCT rl.auth_id) * 2          
  ) AS popularity
FROM recipes r
LEFT JOIN reviews rv
  ON rv.recipe_id = r.id
LEFT JOIN recipe_likes rl
  ON rl.recipe_id = r.id
GROUP BY r.id;
