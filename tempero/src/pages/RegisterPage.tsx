import { useState } from "react";
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

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    if (username.trim().length < 4) {
      setErr("Username must be at least 4 characters.");
      setLoading(false);
      return;
    }

    // Check username uniqueness in "profiles" table
    const { data: existing, error: fetchErr } = await supabase
      .from("profiles")
      .select("authId")
      .eq("username", username)
      .limit(1)
      .maybeSingle();
    if (fetchErr) {
      setErr(fetchErr.message);
      setLoading(false);
      return;
    }
    if (existing) {
      setErr("Username already taken.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setErr("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    // Success: do NOT auto-login — send user to Login page
    alert("Registration successful! Please log in.");
    navigate("/login");
  }

  return (
    <div className="mx-auto mt-12 max-w-md">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold">Create your account</h1>
        <p className="mb-4 text-sm text-gray-600">
          Start your Tempero journey — cook, review, and level up.
        </p>

        {err && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="reg-email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="you@tempero.app"
            />
          </div>

            <div className="space-y-1">
              <label htmlFor="reg-username" className="text-sm font-medium">
                Username
              </label>
              <input
                id="reg-username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Choose a unique username"
              />
          </div>

          <div className="space-y-1">
            <label htmlFor="reg-pass" className="text-sm font-medium">
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
                className="w-full rounded-lg border px-3 py-2 pr-24 outline-none focus:ring-2 focus:ring-gray-900"
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
            <p className="text-xs text-gray-500">
              Use at least 8 characters. Consider a mix of letters, numbers, and symbols.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-2.5 text-white hover:bg-gray-900 disabled:opacity-70"
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
  );
}
