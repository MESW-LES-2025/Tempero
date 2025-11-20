import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Loader from "../components/Loader";
import { fetchPlaylistWithRecipes } from "../services/playlistsService";
import RecipeCard from "../components/RecipeCard";

type RecipeInPlaylist = {
  added_at: string;
  recipes: {
    id: string;
    title: string;
    short_description: string | null;
    image_url: string | null;
    prep_time?: number | null;
    cook_time?: number | null;
    servings?: number | null;
    difficulty?: number | null;
  } | null;
};

type Playlist = {
  title: string;
  description: string | null;
  visibility: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    username: string | null;
  };
};

export default function PlaylistDetailPage() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [recipes, setRecipes] = useState<RecipeInPlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playlistId) return;
    setLoading(true);
    setError(null);

    fetchPlaylistWithRecipes(playlistId)
      .then(({ playlist, recipes }) => {
        setPlaylist(playlist as unknown as Playlist);
        setRecipes(recipes as unknown as RecipeInPlaylist[]);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [playlistId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-bright">
        <div className="mx-auto max-w-4xl px-4 pb-12 pt-8">
          <Loader message="Loading list details…" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-bright">
        <div className="mx-auto max-w-4xl px-4 pb-12 pt-8">
          <p className="text-sm text-color-danger font-body">{error}</p>
        </div>
      </main>
    );
  }

  if (!playlist) {
    return (
      <main className="min-h-screen bg-bright">
        <div className="mx-auto max-w-4xl px-4 pb-12 pt-8">
          <p className="text-sm text-dark/60 font-body">List not found.</p>
        </div>
      </main>
    );
  }

  const isPublic = playlist.visibility === "PUBLIC";
  const owner = playlist.profiles;
  const ownerName =
    owner?.first_name || owner?.last_name
      ? `${owner?.first_name ?? ""} ${owner?.last_name ?? ""}`.trim()
      : owner?.username ?? "Unknown cook";

  return (
    <main className="min-h-screen bg-bright">
      <section className="mx-auto max-w-4xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <header className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-heading text-secondary sm:text-3xl">
                {playlist.title}
              </h1>
              <p className="mt-1 text-sm text-dark/70 font-body">
                by{" "}
                <span className="font-semibold text-secondary">
                  {ownerName}
                </span>
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold font-body ${
                isPublic
                  ? "bg-green-100 text-green-700"
                  : "bg-off-white text-dark/70"
              }`}
            >
              {isPublic ? "Public list" : "Private list"}
            </span>
          </div>

          {playlist.description && (
            <p className="mt-3 text-sm text-dark/80 font-body">
              {playlist.description}
            </p>
          )}
        </header>

        {!recipes.length ? (
          <p className="text-sm text-dark/60 font-body">
            This list doesn’t have any recipes yet.
          </p>
        ) : (
          <div className="space-y-3">
            {recipes.map((item) =>
              item.recipes ? (
                <RecipeCard
                  key={item.recipes.id}
                  variant="list"
                  addedAt={item.added_at}
                  recipe={{
                    id: item.recipes.id,
                    title: item.recipes.title,
                    short_description: item.recipes.short_description,
                    image_url: item.recipes.image_url,
                    prep_time: item.recipes.prep_time,
                    cook_time: item.recipes.cook_time,
                    servings: item.recipes.servings,
                    difficulty: item.recipes.difficulty,
                  }}
                />
              ) : null
            )}
          </div>
        )}
      </section>
    </main>
  );
}
