import { useEffect, useState } from "react";

import ListCard from "../components/ListCard";
import Loader from "../components/Loader";
import type { Playlist } from "../services/playlistsService";
import { fetchAllPublicPlaylists } from "../services/playlistsService";

export default function PublicListsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchAllPublicPlaylists()
      .then(setPlaylists)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-bright">
      <section className="mx-auto max-w-5xl px-4 pb-12 pt-8 sm:px-6 lg:px-10">
        <header className="mb-6">
          <h1 className="text-2xl font-heading text-secondary sm:text-3xl">
            Recipe lists
          </h1>
          <p className="mt-1 text-sm font-body text-dark">
            Explore recipe collections created and shared by the Tempero
            community.
          </p>
        </header>

        {loading && <Loader message="Loading public recipe lists…" />}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && !playlists.length && (
          <p className="text-sm text-dark/70 font-body">
            No public recipe lists have been created yet.
          </p>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {playlists.map((playlist) => (
            <ListCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      </section>
    </main>
  );
}
