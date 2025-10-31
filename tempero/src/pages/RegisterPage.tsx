import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { supabase } from "../config/supabaseClient";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  // New states for live username validation
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Debounced availability check
useEffect(() => {
  setUsernameError(null);
  setUsernameAvailable(null);

  const raw = username.trim();
  if (!raw) return;
  if (raw.length < 4) {
    setUsernameError("Username must be at least 4 characters.");
    return;
  }

  let mounted = true;
  setCheckingUsername(true);



  const timeout = setTimeout(async () => {
    const { data, error } = await supabase.rpc("is_username_available", {
      p_username: username,
    });

    if (!mounted) return;
    setCheckingUsername(false);

    if (error) {
      console.error("Username check error:", error);
      setUsernameError("Could not check username. Try again.");
      setUsernameAvailable(null);
      return;
    }

    // data === true means available
    setUsernameAvailable(Boolean(data));
  }, 400);

  return () => {
    mounted = false;
    clearTimeout(timeout);
  };
}, [username]);


  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    // prevent submit until username is explicitly available
    if (usernameAvailable !== true) {
      setErr("Please choose an available username.");
      return;
    }

    if (password.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password, options: {data: {username: username.trim(), bio: null, profile_picture_url: null}} });

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    // Success: do NOT auto-login — send user to Login page
    navigate("/login");
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[url('/images/croissant-bg.jpg')] bg-cover bg-center ">
      <div className="absolute inset-0  backdrop-blur-xs  pointer-events-none"></div>
      <div className="mx-auto mt-12 max-w-md ">
        <div className="rounded-xl  bg-bright/90 p-6 shadow-sm relative z-10">
            <h1 className="mb-4 text-3xl font-bold font-heading text-main text-center">Register</h1>
          <p className="mb-10 text-sm text-gray-600">
            Start your journey with Tempero: cook, review and level up.
          </p>

          {err && (
            <div className="mb-3 font-body rounded-lg  bg-main/10 px-3 py-2 text-sm text-danger">
              {err}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            <div className="space-y-1 mb-5">
              <label htmlFor="reg-email" className="text-lg font-heading text-dark">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 outline-none shadow-xl bg-amber-50 focus:ring-1 focus:ring-main focus:shadow-main/20 border-none  transition-all duration-200 ease-in-out"
                placeholder="you@tempero.app"
              />
            </div>

            <div className="space-y-1 mb-3">
              <label htmlFor="reg-username" className="text-lg font-heading text-dark">
                Username
              </label>
              <input
                id="reg-username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 outline-none shadow-xl bg-amber-50 focus:ring-1 focus:ring-main focus:shadow-main/20 border-none  transition-all duration-200 ease-in-out"
                placeholder="Choose a unique username"
              />
              <div className="mt-1 text-sm">
                {checkingUsername && (
                  <span className="text-gray-600">Checking availability…</span>
                )}
                {!checkingUsername && usernameError && (
                  <span className="text-danger">{usernameError}</span>
                )}
                {!checkingUsername && usernameAvailable === false && !usernameError && (
                  <span className="text-danger">Username is already taken.</span>
                )}
                {!checkingUsername && usernameAvailable === true && (
                  <span className="text-main">Username is available.</span>
                )}
              </div>
            </div>

            <div className="space-y-1 ">
              <label htmlFor="reg-pass" className="text-lg font-heading text-dark">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-pass"
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 outline-none shadow-xl bg-amber-50 focus:ring-1 focus:ring-main focus:shadow-main/20 border-none  transition-all duration-200 ease-in-out"
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-900"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-4 mb-15">
                Use at least 8 characters. Consider a mix of letters, numbers, and symbols.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || usernameAvailable !== true}
              className="w-full rounded-lg bg-secondary px-4 py-2.5 text-white hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-70  duration-150"
            >
              {loading ? "Creating account…" : "Register"}
            </button>
          </form>

          <p className="mt-4 text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="underline underline-offset-4">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
