import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../config/supabaseClient";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();


  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(data?.user ?? null);
      } catch {
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

  // Hide navbar on the register page
  if (location.pathname === "/register" || location.pathname === "/login" || location.pathname === "/skill-assessment") return null;

  const username = user?.user_metadata?.username ?? null;
  // If not logged in, clicking the "Guest" profile should go to the login page
  const profileHref = username ? `/profile/${username}` : (user ? "/profile" : "/login");
  const profileLabel = username ?? (user ? "Profile" : "Guest");

  //Active link highlight
  const active = "text-dark scale-110 border-b-1 border-dark/50 border-bright";

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate("/search");
    setShowMobileSearch(false);
  }

  return (
    <>
  <nav className="fixed top-0 left-0 right-0 z-50 navbar text-bright text-lg max-[500px]:text-sm font-heading flex flex-row justify-between bg-main px-4 py-3 shadow-lg items-center">
        <div className="flex items-center gap-4">
          <h1 className="logo">
            <Link to="/home/">
              <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Tempero Logo" className="h-15 max-[500px]:h-10 min-h-5 min-w-9 min" />
            </Link>
          </h1>
          
          {/* Desktop search form - hidden below 700px */}
          <button
            onClick={() => navigate("/search")}
            className="hidden min-[700px]:block text-bright/70 hover:text-bright p-2"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
          </button>


          {/* Mobile search icon - visible only below 700px */}
          <button
            onClick={() => navigate("/search")}
            className="min-[700px]:hidden text-bright/70 hover:text-bright p-2"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
          </button>
        </div>
        
        {/* XP Progress Bar */}
        <div className="flex-1 max-w-xs mx-4">
          <div className="text-sm text-bright font-heading mb-1">Level 3 — Home Chef</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-4 bg-bright/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-bright rounded-full transition-all duration-300"
                style={{ width: '65%' }}
              />
            </div>
            <span className="text-sm text-bright font-heading whitespace-nowrap">3500/4000</span>
          </div>
        </div>

        <ul className="flex gap-6 mr-4 items-center">

         <li className="hover:scale-110 hover:-translate-y-1 hover:opacity-70 duration-100">
             <NavLink
       to="/lists"
       className={({ isActive }) => `${isActive ? active : ""} px-1`}
     >
       Lists
     </NavLink>
         </li>
 
         <li className="hover:scale-110 hover:-translate-y-1 hover:opacity-70 duration-100">
             <NavLink
       to="/favorites"
       className={({ isActive }) => `${isActive ? active : ""} px-1`}
     >
       Favorites
     </NavLink>
         </li>
 
         {/* profile link */}
     <div className="usersection max-[500px]:flex-col max-[500px]:text-xs bg-bright/10 p-2 rounded-md gap-2 flex font-heading  ">
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
             <Link to="/login" className="max-[500px]:text-3xs">Log out</Link>
            </button>
            )}
        </div>
         </ul>
      </nav>
 
       {/* spacer to avoid content being hidden under the fixed navbar */}
       <div className="h-16 md:h-20" />
 
       {/* Mobile search overlay - shown below navbar on small screens */}
       {showMobileSearch && (
         <div className="min-[700px]:hidden fixed left-0 right-0 top-22 z-40 mx-2 rounded-lg bg-main px-4 py-3 shadow-lg">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes..."
              className="w-full pl-10 rounded-lg bg-bright/10 px-4 py-2 text-sm text-bright placeholder-bright/50 outline-none focus:ring-2 focus:ring-bright/30 transition-all"
              aria-label="Search recipes"
              autoFocus
            />
            <button
              type="submit"
              className="absolute left-2 top-1/2 -translate-y-1/2 text-bright/70 hover:text-bright"
              aria-label="Submit search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 " viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}