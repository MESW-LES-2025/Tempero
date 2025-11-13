import { useEffect, useMemo, useState } from "react";
import { supabase } from "../config/supabaseClient";

type Tab = "recipes" | "users";

type Recipe = {
  id: string | number;
  title: string;
  description?: string | null;
  image_url?: string | null;
  ingredients?: string[] | null;
};

type Profile = {
  auth_id: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
};

const ING_FILTERS = [1, 2, 3, 4, 5];

export default function SearchPage() {
  const [tab, setTab] = useState<Tab>("recipes");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // results
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);

  const [ingFilters, setIngFilters] = useState<Set<number>>(new Set());

  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);

      try {
        if (tab === "recipes") {

        let qb = supabase
          .from("recipes")
          .select("id,title,description:instructions,image_url,ingredients")
          .order("title", { ascending: true });


          if (debouncedQuery) {
            qb = qb.or(
              `title.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`
            );
          }

          const { data, error } = await qb;
          if (cancelled) return;
          if (error) throw error;

          setRecipes((data ?? []) as Recipe[]);
          setUsers([]); // clear others
        } else {
 
          let qb = supabase
            .from("profiles")
            .select("auth_id,username,first_name,last_name,avatar_url:profile_picture_url")
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
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Failed to fetch results.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tab, debouncedQuery]);


  const filteredRecipes = useMemo(() => {
    if (ingFilters.size === 0) return recipes;
    return recipes.filter((r) => {
      const len = r.ingredients?.length ?? 0;
      return ingFilters.has(len);
    });
  }, [recipes, ingFilters]);

  function toggleFilter(n: number) {
    setIngFilters((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  return (
    <div className="min-h-screen w-full bg-amber-50">
      {/* Top nav*/}
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

        <div className="flex justify-center">
          <div className="relative w-full max-w-xl">
            <span className="absolute left-3 top-1/2 -translate-y-1/2">🔍</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === "recipes" ? "Thai rice" : "Find a user"}
              className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 shadow-sm focus:ring-2 focus:ring-[#e57f22] outline-none"
            />
          </div>
        </div>

        {tab === "recipes" && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-gray-700">
            {ING_FILTERS.map((n) => (
              <label
                key={n}
                className="inline-flex items-center gap-2 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#e57f22]"
                  checked={ingFilters.has(n)}
                  onChange={() => toggleFilter(n)}
                />
                <span className="italic">
                  {n} ingredient{n > 1 ? "s" : ""}
                </span>
              </label>
            ))}
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
          <RecipeGrid recipes={filteredRecipes} />
        ) : (
          <UserGrid users={users} />
        )}
      </div>
    </div>
  );
}

/* ---------- UI PARTIALS ---------- */

function RecipeGrid({ recipes }: { recipes: Recipe[] }) {
  if (!recipes.length)
    return (
      <div className="py-12 text-center text-gray-600">
        No recipes found. Try adjusting your search or filters.
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
            <h3 className="text-lg font-semibold text-[#e57f22]">{r.title}</h3>
            {r.description && (
              <p className="mt-2 text-sm text-gray-700 leading-relaxed line-clamp-5">
                {r.description}
              </p>
            )}
            {typeof r.ingredients?.length === "number" && (
              <p className="mt-2 text-xs text-gray-500">
                {r.ingredients.length} ingredient
                {r.ingredients.length === 1 ? "" : "s"}
              </p>
            )}
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
          (u.first_name || u.last_name)
            ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()
            : u.username;
        return (
          <article
            key={u.auth_id}
            className="rounded-lg overflow-hidden shadow-sm border border-gray-200 bg-white hover:shadow-md transition"
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
          </article>
        );
      })}
    </div>
  );
}
