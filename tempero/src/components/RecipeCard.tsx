import { Link } from "react-router-dom";
import { recipeImageUrl } from "../utils/ImageURL";

type RecipeCardData = {
  id: string;
  title: string;
  short_description?: string | null;
  image_url?: string | null;
  prep_time?: number | null;
  cook_time?: number | null;
  servings?: number | null;
  difficulty?: number | string | null; // <- para suportar "3/5" ou similar se quiseres
};

type RecipeCardProps = {
  recipe: RecipeCardData;
  variant?: "grid" | "list";
  addedAt?: string | null;
  backgroundColor?: string;
};

export default function RecipeCard({
  recipe,
  variant = "grid",
  addedAt,
  backgroundColor = "white",
}: RecipeCardProps) {
  const imgSrc = resolveImage(
    recipe.image_url,
    variant === "grid" ? 600 : 360
  );

  // --- LIST VARIANT (mantido como tinhas) ---
  if (variant === "list") {
    return (
      <article
        className="flex gap-4 rounded-xl border border-off-white p-3 shadow-sm hover:shadow-md transition-shadow duration-150"
        style={{ backgroundColor }}
      >
        {imgSrc && (
          <Link
            to={`/recipe/${recipe.id}`}
            className="relative block h-24 w-24 shrink-0 overflow-hidden rounded-lg"
          >
            <img
              src={imgSrc}
              alt={recipe.title}
              className="h-full w-full object-cover"
            />
          </Link>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
            <Link
              to={`/recipe/${recipe.id}`}
              className="text-base font-heading text-secondary hover:text-main transition-colors"
            >
              {recipe.title}
            </Link>
            {addedAt && (
              <span className="text-xs font-body text-dark/60">
                Added on {new Date(addedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {recipe.short_description && (
            <p className="mt-1 text-sm text-dark/70 font-body leading-5 line-clamp-3">
              {recipe.short_description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-3 text-xs font-heading text-dark/70">
            <MetaPill
              label="Prep"
              value={formatValue(recipe.prep_time, "min")}
            />
            <MetaPill
              label="Cook"
              value={formatValue(recipe.cook_time, "min")}
            />
            <MetaPill
              label="Servings"
              value={recipe.servings?.toString()}
            />
            <MetaPill
              label="Difficulty"
              value={
                typeof recipe.difficulty === "string"
                  ? recipe.difficulty
                  : recipe.difficulty?.toString()
              }
            />
          </div>
        </div>
      </article>
    );
  }

  // --- GRID VARIANT (igual ao RecipeGrid) ---
  return (
    <article
      className="rounded-lg w-68 shrink-0 overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition"
      style={{ backgroundColor }}
    >
      {imgSrc ? (
        <Link to={`/recipe/${recipe.id}`}>
          <img
            src={imgSrc}
            alt={recipe.title}
            className="w-full h-44 object-cover"
          />
        </Link>
      ) : (
        <div className="w-full h-44 bg-gray-200" />
      )}

      <div className="p-4 h-60">
        <Link
          to={`/recipe/${recipe.id}`}
          className="text-lg font-semibold text-[#e57f22] hover:text-[#c96411] transition-colors w-"
        >
          {recipe.title}
        </Link>

        {recipe.short_description && (
          <p className="mt-2 h-22 text-sm text-gray-700 leading-relaxed line-clamp-5">
            {recipe.short_description}
          </p>
        )}

        <div className="mt-3 text-xs text-gray-500 space-y-1">
          {(recipe.prep_time || recipe.cook_time) && (
            <p>
              ⏱ Prep: {recipe.prep_time ?? "-"} min · Cook:{" "}
              {recipe.cook_time ?? "-"} min
            </p>
          )}

          {recipe.servings && <p>🍽 Servings: {recipe.servings}</p>}

          {recipe.difficulty != null && (
            <p>
              🎚 Difficulty:{" "}
              {typeof recipe.difficulty === "string"
                ? recipe.difficulty
                : `${recipe.difficulty}/5`}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function resolveImage(imagePath?: string | null, width = 600) {
  if (!imagePath) return undefined;
  if (imagePath.startsWith("http")) return imagePath;
  return recipeImageUrl(imagePath, width);
}

function MetaPill({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <span className="rounded-full bg-off-white px-3 py-1">
      <span className="font-semibold">{label}:</span> {value}
    </span>
  );
}

function formatValue(value?: number | null, suffix?: string) {
  if (value === null || value === undefined) return undefined;
  return suffix ? `${value} ${suffix}` : `${value}`;
}