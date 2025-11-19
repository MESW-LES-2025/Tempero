import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../config/supabaseClient";

type Tab = "recipes" | "users";

// id,authorId,title,short_description,image_url,prep_time,cook_time,servings,difficulty
type Recipe = {
  id: string | number;
  title: string;
  short_description?: string | null;
  image_url?: string | null;
  prep_time?: number | null;
  cook_time?: number | null;
  servings?: number | null;
  difficulty?: number | string | null;
};

//auth_id,username,bio,profile_picture_url,first_name,last_name,followers_count,following_count,xp
type Profile = {
  auth_id: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
};

const DIFFICULTY_FILTERS = [1, 2, 3, 4, 5];

const COOKING_TIME_FILTERS = [
  { id: "short", label: "Cook time <30 min" },
  { id: "medium", label: "Cook time 30–120 min" },
  { id: "long", label: "Cook time >120 min" },
];

const PAGE_SIZE = 10;


export default function SearchPage() {
  const [tab, setTab] = useState<Tab>("recipes");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // results
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);

  const [difficultyFilters, setDifficultyFilters] = useState<Set<number>>(
    new Set()
  );

  const [cookFilters, setCookFilters] = useState<Set<string>>(new Set());

  const [showAllRecipes, setShowAllRecipes] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);

  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    setShowAllRecipes(false);
    setShowAllUsers(false);

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        if (tab === "recipes") {
          // fetch recipes; filtrar por title/short_description
          let qb = supabase
            .from("recipes")
            .select(
              "id,title,short_description,image_url,prep_time,cook_time,servings,difficulty"
            )
            .order("title", { ascending: true });

          if (debouncedQuery) {
            qb = qb.ilike("title", `%${debouncedQuery}%`);
          }

          const { data, error } = await qb;
          if (cancelled) return;
          if (error) throw error;

          setRecipes((data ?? []) as Recipe[]);
          setUsers([]); // limpar users
        } else {
          let qb = supabase
            .from("profiles")
            .select(
              "auth_id,username,first_name,last_name,avatar_url:profile_picture_url"
            )
            .order("username", { ascending: true });

          if (debouncedQuery) {
            qb = qb.or(
              `username.ilike.%${debouncedQuery}%,first_name.ilike.%${debouncedQuery}%,last_name.ilike.%${debouncedQuery}%`
            );
          }

          const { data, error } = await qb;
          if (cancelled) return;
          if (error) throw error;

          setUsers((data ?? []) as Profile[]);
          setRecipes([]); // clear others
        }
      } catch (e: unknown) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to fetch results.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tab, debouncedQuery]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      // ----- Difficulty filter -----
      if (difficultyFilters.size > 0) {
        const diffNum =
          typeof r.difficulty === "string"
            ? parseInt(r.difficulty, 10)
            : r.difficulty;

        if (!diffNum || !difficultyFilters.has(diffNum)) return false;
      }

      // ----- Cooking time filter -----
      if (cookFilters.size > 0) {
        const cook = r.cook_time ?? 0;

        const matchesCook =
          (cookFilters.has("short") && cook < 30) ||
          (cookFilters.has("medium") && cook >= 30 && cook <= 120) ||
          (cookFilters.has("long") && cook > 120);

        if (!matchesCook) return false;
      }

      return true;
    });
  }, [recipes, difficultyFilters, cookFilters]);

  const visibleRecipes =
    showAllRecipes || !debouncedQuery
      ? filteredRecipes
      : filteredRecipes.slice(0, PAGE_SIZE);

  const visibleUsers =
    showAllUsers || !debouncedQuery ? users : users.slice(0, PAGE_SIZE);

  function toggleDifficultyFilter(n: number) {
    setDifficultyFilters((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  function toggleCookFilter(id: string) {
    setCookFilters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }


  return (
    <div className="min-h-screen w-full bg-amber-50">
      {/* Top nav */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-10 items-center mb-6">
          <button
            className={`text-xl tracking-wide ${
              tab === "users"
                ? "text-[#e57f22] underline underline-offset-8"
                : "text-gray-700 hover:text-[#e57f22]"
            }`}
            onClick={() => setTab("users")}
          >
            USERS
          </button>
          <button
            className={`text-xl tracking-wide ${
              tab === "recipes"
                ? "text-[#e57f22] underline underline-offset-8"
                : "text-gray-700 hover:text-[#e57f22]"
            }`}
            onClick={() => setTab("recipes")}
          >
            RECIPES
          </button>
        </div>

        {/* Search input */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-xl">
            <span className="absolute left-3 top-1/2 -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === "recipes" ? "Find a recipe by name" : "Find a user by name or username"}
              className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 shadow-sm focus:ring-2 focus:ring-[#e57f22] outline-none"
            />
          </div>
        </div>

        {tab === "recipes" && (
          <div className="mt-6 flex flex-col items-center gap-4 text-gray-700">
            {/*Difficulty */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {DIFFICULTY_FILTERS.map((n) => (
                <label
                  key={n}
                  className="inline-flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#e57f22]"
                    checked={difficultyFilters.has(n)}
                    onChange={() => toggleDifficultyFilter(n)}
                  />
                  <span className="italic">Difficulty {n}</span>
                </label>
              ))}
            </div>

            {/*Cook time */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {COOKING_TIME_FILTERS.map((f) => (
                <label
                  key={f.id}
                  className="inline-flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#e57f22]"
                    checked={cookFilters.has(f.id)}
                    onChange={() => toggleCookFilter(f.id)}
                  />
                  <span className="italic">{f.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <h2 className="mt-8 mb-4 text-2xl font-semibold text-[#e57f22]">
          {tab === "recipes" ? "RECIPES" : "USERS"}
        </h2>

        {/* Results */}
        {loading ? (
          <div className="py-12 text-center text-gray-700">Loading…</div>
        ) : err ? (
          <div className="py-12 text-center text-red-600">{err}</div>
        ) : tab === "recipes" ? (
          <>
            <RecipeGrid recipes={visibleRecipes} />

            {debouncedQuery && filteredRecipes.length > PAGE_SIZE && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setShowAllRecipes((v) => !v)}
                  className="px-4 py-2 rounded-md border border-[#e57f22] text-[#e57f22] text-sm font-medium hover:bg-[#e57f22] hover:text-white transition"
                >
                  {showAllRecipes
                    ? "Show less"
                    : `Show all ${filteredRecipes.length} recipes`}
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <UserGrid users={visibleUsers} />

            {debouncedQuery && users.length > PAGE_SIZE && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setShowAllUsers((v) => !v)}
                  className="px-4 py-2 rounded-md border border-[#e57f22] text-[#e57f22] text-sm font-medium hover:bg-[#e57f22] hover:text-white transition"
                >
                  {showAllUsers
                    ? "Show less"
                    : `Show all ${users.length} users`}
                </button>
              </div>
            )}
          </>
        )
        }
      </div>
    </div>
  );
}

/* ---------- UI PARTIALS ---------- */

function RecipeGrid({ recipes }: { recipes: Recipe[] }) {
  if (!recipes.length)
    return (
      <div className="py-12 text-center text-gray-600">
        No recipes found. Try adjusting your search.
      </div>
    );

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((r) => (
        <article
          key={r.id}
          className="rounded-lg overflow-hidden shadow-sm border border-gray-200 bg-white hover:shadow-md transition"
        >
          {r.image_url ? (
            <img
              src={r.image_url}
              alt={r.title}
              className="w-full h-44 object-cover"
            />
          ) : (
            <div className="w-full h-44 bg-gray-200" />
          )}
          <div className="p-4">
            <h3 className="text-lg font-semibold text-[#e57f22]">
              {r.title}
            </h3>

            {r.short_description && (
              <p className="mt-2 text-sm text-gray-700 leading-relaxed line-clamp-5">
                {r.short_description}
              </p>
            )}

            <div className="mt-3 text-xs text-gray-500 space-y-1">
              {(r.prep_time || r.cook_time) && (
                <p>
                  ⏱ Prep: {r.prep_time ?? "-"} min · Cook:{" "}
                  {r.cook_time ?? "-"} min
                </p>
              )}
              {r.servings && <p>🍽 Servings: {r.servings}</p>}

              {r.difficulty != null && (
                <p>
                  🎚 Difficulty:{" "}
                  {typeof r.difficulty === "string"
                    ? r.difficulty
                    : `${r.difficulty}/5`}
                </p>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function UserGrid({ users }: { users: Profile[] }) {
  if (!users.length)
    return (
      <div className="py-12 text-center text-gray-600">
        No users found. Try a different search.
      </div>
    );

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {users.map((u) => {
        const display =
          u.first_name || u.last_name
            ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()
            : u.username;
        return (
          <Link
            key={u.auth_id}
            to={`/profile/${u.username}`}
            className="block rounded-lg overflow-hidden shadow-sm border border-gray-200 bg-white hover:shadow-md transition"
          >
            {u.avatar_url ? (
              <img
                src={u.avatar_url}
                alt={display}
                className="w-full h-44 object-cover"
              />
            ) : (
              <div className="w-full h-44 bg-gray-200" />
            )}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-[#e57f22]">
                {display}
              </h3>
              <p className="mt-1 text-sm text-gray-600">@{u.username}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
