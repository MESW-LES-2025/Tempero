import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../config/supabaseClient";

export default function Navbar() {
  const location = useLocation();

  // Hide navbar on the register page
if (location.pathname === "/register" || location.pathname === "/login" || location.pathname === "/skill-assessment") return null;
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
  // If not logged in, clicking the "Guest" profile should go to the login page
  const profileHref = username ? `/users/${username}` : (user ? "/profile" : "/login");
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
        <Link to="/">
          <img src="/images/logo.png" alt="Tempero Logo" className="h-15" />
        </Link>
      </h1>
      <ul className="flex gap-6 mr-4 items-center">
        <li className="hover:scale-110 hover:-translate-y-1 hover:opacity-70 duration-100">
            <Link to="/lists">Lists</Link>
        </li>
        <li className="hover:scale-110 hover:-translate-y-1 hover:opacity-70 duration-100">
            <Link to="/favorites">Favorites</Link>
        </li>
        <div className="usersection  bg-bright/10 p-2 rounded-md gap-2 flex font-heading ">
        {!user && (
          <li>
            <Link to="/login">Log in</Link>
          </li>
        )}
            
            <li className="border border-bright/20 bg-bright/20 rounded-md px-2 py-1 hover:-translate-y-1 transition-transform duration-200 ease-in-out text-sm">
            <Link to={profileHref}>{profileLabel}</Link>
            </li>
            {user && (
            <button 
              onClick={handleSignOut} 
              className="text-bright/70 cursor-pointer text-xs hover:text-bright" 
              aria-label="Sign out"
              
            >
             <Link to="/login">Log out</Link>
            </button>
            )}
        </div>

      </ul>
    </nav>
  );
}
