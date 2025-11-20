import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import type { Ingredient, Step } from "../types/Recipe";
import { recipeImageUrl } from "../utils/ImageURL";
import Loader from "../components/Loader";

type RecipeRow = {
  id: string;
  title: string;
  short_description: string;
  image_url: string | null;
  authorId: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: number;
  created_at?: string;
  updated_at?: string;
  profiles?: {
    auth_id: string;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
  };
  recipe_ingredients?: Array<{
    id: number;
    name: string;
    amount: number;
    unit: string | null;
    notes: string | null;
  }>;
  recipe_steps?: Array<{
    index: number;
    text: string;
  }>;
  recipe_tags?: Array<{
    tag_id: string;
    tags: { name: string };
  }>;
};

type RecipeDetails = {
  id: string;
  title: string;
  short_description: string;
  image_url: string | null;
  authorId: string;
  authorUsername: string | null;
  authorName: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: number;
  ingredients: Ingredient[];
  steps: Step[];
  tags: string[];
  created_at?: string;
  updated_at?: string;
};

export default function RecipePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<RecipeDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchRecipe = async () => {
      setLoading(true);

      const { data: recipeRow, error: recipeError } = await supabase
        .from("recipes")
        .select(
          `
          id,
          title,
          short_description,
          image_url,
          authorId,
          prep_time,
          cook_time,
          servings,
          difficulty,
          created_at,
          updated_at,
          profiles:profiles!Recipes_authorId_fkey(auth_id, username, first_name, last_name),
          recipe_ingredients:recipe-ingredients(id, name, amount, unit, notes),
          recipe_steps:recipe-steps(index, text),
          recipe_tags:recipe-tags(tag_id, tags(name))
          `
        )
        .eq("id", id)
        .single<RecipeRow>();

      if (recipeError || !recipeRow) {
        console.error(recipeError);
        setRecipe(null);
        setLoading(false);
        return;
      }

      const mapped: RecipeDetails = {
        id: recipeRow.id,
        title: recipeRow.title,
        short_description: recipeRow.short_description,
        image_url: recipeRow.image_url,
        authorId: recipeRow.authorId,
        authorUsername: recipeRow.profiles?.username ?? null,
        authorName: buildAuthorName(recipeRow),
        prep_time: recipeRow.prep_time,
        cook_time: recipeRow.cook_time,
        servings: recipeRow.servings,
        difficulty: recipeRow.difficulty,
        created_at: recipeRow.created_at,
        updated_at: recipeRow.updated_at,
        ingredients:
          recipeRow.recipe_ingredients?.map((ing) => ({
            id: String(ing.id),
            name: ing.name,
            amount: String(ing.amount),
            unit: ing.unit ?? undefined,
            note: ing.notes ?? undefined,
          })) ?? [],
        steps:
          recipeRow.recipe_steps?.map((step) => ({
            id: `step-${step.index}`,
            index: step.index,
            description: step.text,
          })) ?? [],
        tags:
          recipeRow.recipe_tags?.map(
            (t: { tags: { name: string } }) => t.tags.name
          ) ?? [],
      };

      setRecipe(mapped);
      setLoading(false);
    };

    fetchRecipe();
  }, [id]);

  const heroImage = useMemo(
    () => recipeImageUrl(recipe?.image_url ?? null, 900),
    [recipe?.image_url]
  );

  if (loading) return <Loader message="Whisking the recipe..." />;
  if (!recipe)
    return (
      <div className="min-h-screen bg-bright flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-3xl font-heading-styled text-secondary">
            Recipe not found
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg bg-main text-bright font-heading"
          >
            Go back
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-bright text-dark">
      <div className="pt-24 pb-16 px-4 sm:px-10 max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col gap-4 mb-10">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center rounded-lg bg-main/10 text-main border border-main px-4 py-1 font-heading">
              Level {recipe.difficulty ?? 1}
            </span>
            <div className="flex gap-2 flex-wrap">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-lg border border-secondary/40 text-secondary text-sm font-heading"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-heading-styled text-secondary">
            {recipe.title}
          </h1>
          <p className="text-dark/70 font-body max-w-2xl">
            {recipe.short_description}
          </p>
        </header>

        {/* Image + Ingredients */}
        <section className="flex flex-col lg:flex-row gap-8 mb-12">
          <div className="flex-1">
            {heroImage && (
              <div className="rounded-2xl overflow-hidden shadow-lg border border-secondary/20">
                <img
                  src={heroImage}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 font-heading text-sm text-dark/80">
              <Stat label="Prep time" value={`${recipe.prep_time} min`} />
              <Stat label="Cook time" value={`${recipe.cook_time} min`} />
              <Stat label="Servings" value={recipe.servings} />
              <AuthorStat
                label="Author"
                username={recipe.authorUsername}
                displayName={recipe.authorName}
              />
            </div>
          </div>

          <aside className="w-full lg:w-80 bg-white/70 border border-main/40 rounded-2xl p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-heading-styled text-main text-center">
              Ingredients
            </h2>
            <ul className="space-y-3 font-body text-dark">
              {recipe.ingredients.map((ing) => (
                <li key={ing.id} className="flex gap-2">
                  <span className="text-main">•</span>
                  <div>
                    <span className="font-semibold">{ing.name}</span>
                    {ing.amount && (
                      <>
                        {" "}-{" "}
                        <span className="text-main">
                          {ing.amount} {ing.unit ?? ""}
                        </span>
                      </>
                    )}
                    {ing.note && (
                      <p className="text-xs text-dark/50 mt-0.5">{ing.note}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        {/* Steps */}
        <section className="space-y-6">
          {recipe.steps
            .sort((a, b) => a.index - b.index)
            .map((step) => (
              <article
                key={step.id}
                className="bg-white/80 border border-main/30 rounded-2xl p-6 shadow-sm"
              >
                <h3 className="text-2xl font-heading-styled text-main mb-2">
                  Step {step.index}
                </h3>
                <p className="text-dark font-body leading-relaxed">
                  {step.description}
                </p>
              </article>
            ))}
        </section>

        {/* Created / Last edited notes */}
        <div className="mt-6 text-xs text-dark/60 flex flex-col sm:flex-row sm:justify-end gap-2">
          <span>
            Created at{" "}
            {recipe.created_at
              ? new Date(recipe.created_at).toLocaleString()
              : "--"}
          </span>
          <span>
            Last edited at{" "}
            {recipe.updated_at
              ? new Date(recipe.updated_at).toLocaleString()
              : "--"}
          </span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="rounded-xl bg-white/70 border border-secondary/20 p-3 text-center shadow-sm">
      <p className="text-xs uppercase tracking-wide text-secondary/60 font-heading">
        {label}
      </p>
      <p className="text-lg font-heading text-secondary">{value ?? "--"}</p>
    </div>
  );
}

function AuthorStat({
  label,
  username,
  displayName,
}: {
  label: string;
  username: string | null;
  displayName: string;
}) {
  return (
    <div className="rounded-xl bg-white/70 border border-secondary/20 p-3 text-center shadow-sm">
      <p className="text-xs uppercase tracking-wide text-secondary/60 font-heading">
        {label}
      </p>
      {username ? (
        <Link
          to={`/profile/${username}`}
          className="text-lg font-heading text-main hover:text-secondary transition-colors"
        >
          {displayName}
        </Link>
      ) : (
        <p className="text-lg font-heading text-secondary/70">{displayName || "Unknown"}</p>
      )}
    </div>
  );
}

function buildAuthorName(row: RecipeRow): string {
  const first = row.profiles?.first_name?.trim() ?? "";
  const last = row.profiles?.last_name?.trim() ?? "";
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;
  return row.profiles?.username ?? "Unknown author";
}
