import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../config/supabaseClient";

export default function Navbar() {
  const location = useLocation();

  // Hide navbar on the register page
if (location.pathname === "/register" || location.pathname === "/login") return null;
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(data?.user ?? null);
      } catch (err) {
        // ignore
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const username = user?.user_metadata?.username ?? null;
  const profileHref = username ? `/users/${username}` : "/profile";
  const profileLabel = username ?? (user ? "Profile" : "Guest");

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  }

  return (
    <nav className="navbar text-bright text-lg font-heading flex flex-row w-screen-2 justify-between bg-main px-3 py-4 m-2 rounded-lg shadow-lg items-center">
      <h1 className="logo">
        <Link to="/">Tempero</Link>
      </h1>
      <ul className="flex gap-4 mr-4 items-center">
        {user && (
          <li>
            <button 
              onClick={handleSignOut} 
              className="text-bright/70 cursor-pointer" 
              aria-label="Sign out"
            >
              Log out
            </button>
          </li>
        )}

        {!user && (
          <li>
            <Link to="/login">Log in</Link>
          </li>
        )}
        <li className="border border-bright/20 bg-bright/10 rounded-md px-2 py-1 hover:bg-bright/10 transition-colors">
          <Link to={profileHref}>{profileLabel}</Link>
        </li>

      </ul>
    </nav>
  );
}
