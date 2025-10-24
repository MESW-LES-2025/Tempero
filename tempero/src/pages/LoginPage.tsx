import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    if (data.user) {
      // success: vai para a Home 
      navigate("/");
    }
  }

  async function handleResetPassword() {
    setErr(null);
    setInfo(null);

    if (!email) {
      setErr("Enter your email first to receive a reset link.");
      return;
    }

    // Define a rota de redirecionamento após o utilizador clicar no link do email.
    // Garante que este URL está nas Redirect URLs do Supabase.
    const redirectTo = `${window.location.origin}/update-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      setErr(error.message);
    } else {
      setInfo("Password reset email sent. Check your inbox.");
    }
  }

  return (
    <div className="mx-auto mt-12 max-w-md">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold">Welcome back</h1>
        <p className="mb-4 text-sm text-gray-600">
          Log in to continue your Tempero journey.
        </p>

        {err && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}
        {info && (
          <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {info}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="login-email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="login-email"
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
            <label htmlFor="login-pass" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <input
                id="login-pass"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 pr-24 outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Your password"
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-2.5 text-white hover:bg-gray-900 disabled:opacity-70"
          >
            {loading ? "Signing in…" : "Log in"}
          </button>
        </form>

        <div className="mt-3 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={handleResetPassword}
            className="text-gray-700 underline underline-offset-4 hover:text-black"
          >
            Forgot password?
          </button>

          <span className="text-gray-600">
            No account?{" "}
            <Link to="/register" className="underline underline-offset-4">
              Register
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
