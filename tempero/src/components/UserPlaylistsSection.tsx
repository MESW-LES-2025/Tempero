import { useEffect, useState } from "react";
import type { Playlist } from "../services/playlistsService";
import { fetchUserPlaylists } from "../services/playlistsService";
import Loader from "./Loader";
import PlaylistCard from "./PlaylistCard";

type Props = {
  userId?: string;
  isOwnProfile: boolean;
};

export default function UserPlaylistsSection({ userId, isOwnProfile }: Props) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    fetchUserPlaylists(userId, isOwnProfile)
      .then(setPlaylists)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId, isOwnProfile]);

  if (!userId) return <p className="text-sm text-slate-500">No user.</p>;
  if (loading) return <Loader message="Loading playlists…" />;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  if (!playlists.length) {
    return (
      <p className="text-sm text-slate-500">
        {isOwnProfile
          ? "You don’t have any playlists yet."
          : "This user has no public playlists yet."}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {playlists.map((p) => (
        <PlaylistCard key={p.id} playlist={p} />
      ))}
    </div>
  );
}
