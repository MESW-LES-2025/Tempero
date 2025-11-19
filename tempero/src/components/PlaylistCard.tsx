import { Link } from "react-router-dom";
import type { Playlist } from "../services/playlistsService";

type PlaylistCardProps = {
  playlist: Playlist;
};

function getDisplayName(playlist: Playlist) {
  const p = playlist.profiles;
  if (!p) return "Unknown cook";
  if (p.first_name || p.last_name) {
    return `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();
  }
  return p.username ?? "Unknown cook";
}

export default function PlaylistCard({ playlist }: PlaylistCardProps) {
  const ownerName = getDisplayName(playlist);
  const recipesCount = playlist.list_recipes?.[0]?.count ?? 0;

  return (
    <Link
      to={`/lists/${playlist.id}`}
      className="block rounded-xl border border-secondary/20 bg-bright p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-heading font-semibold text-secondary">
            {playlist.title}
          </h2>
          <p className="mt-1 text-xs font-body text-dark/70">
            by <span className="font-medium">{ownerName}</span>
          </p>
        </div>

        <span
          className={`rounded-full px-2 py-0.5 text-xs font-body font-medium ${
            playlist.visibility === "PUBLIC"
              ? "bg-main/10 text-main"
              : "bg-dark/10 text-dark"
          }`}
        >
          {playlist.visibility === "PUBLIC" ? "Public" : "Private"}
        </span>
      </div>

      {playlist.description && (
        <p className="mt-3 line-clamp-2 text-sm font-body text-dark/80">
          {playlist.description}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between text-xs font-body text-dark/70">
        <span>
          {recipesCount} recipe{recipesCount === 1 ? "" : "s"}
        </span>
        <span className="font-medium text-main">View playlist →</span>
      </div>
    </Link>
  );
}
