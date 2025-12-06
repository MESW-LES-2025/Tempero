import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const navigate = useNavigate();

  function normalizeError(message?: string | null) {
    if (!message) return null;
    const m = message.toLowerCase();
    if (m.includes("invalid login credentials")) {
      return "Invalid email or password. Make sure your account is confirmed.";
    }
    if (m.includes("email not confirmed") || m.includes("confirm")) {
      return "Email not confirmed. Check your inbox or resend the confirmation.";
    }
    return message;
  }

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
      setErr(normalizeError(error.message));
      return;
    }

    if (data.user) {
      // Check if user needs to take XP assessment
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp')
        .eq('auth_id', data.user.id)
        .single();

      console.log("User profile:", profile);

      if (!profile?.xp) {
        navigate("/skill-assessment");
      } else {
        navigate("/home");
      }
    }
  }

  async function handleResendConfirmation() {
    setErr(null);
    setInfo(null);
    if (!email) {
      setErr("Enter your email first to resend the confirmation link.");
      return;
    }
    try {
      setResending(true);
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) setErr(error.message);
      else setInfo("Confirmation email sent. Please check your inbox (and spam).");
    } finally {
      setResending(false);
    }
  }

  async function handleResetPassword() {
    setErr(null);
    setInfo(null);
    if (!email) {
      setErr("Enter your email first to receive a reset link.");
      return;
    }
    const redirectTo = `${window.location.origin}/update-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) setErr(error.message);
    else setInfo("Password reset email sent. Check your inbox.");
  }

  const showResend =
    err?.toLowerCase().includes("confirm") ||
    err?.toLowerCase().includes("not confirmed") ||
    false;

  return (
    <div className="fixed min-h-screen min-w-screen px-2 flex items-center justify-center bg-[url('/images/croissant-bg.jpg')] bg-cover bg-center">
      <div className="logo fixed top-1 left-1 z-10 ">
        <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Tempero Logo" className="h-16" />
      </div>
      <div className="absolute inset-0 backdrop-blur-xs pointer-events-none"></div>
      <div className="mx-auto mt-12 max-w-md">
        <div className="rounded-xl bg-bright/90 p-6 shadow-sm relative z-10">
          <h1 className="mb-4 text-3xl font-bold font-heading text-main text-center">
            Login
          </h1>
          <p className="mb-10 text-sm text-gray-600">
            Log in to continue your Tempero journey: cook, review and level up.
          </p>

          {err && (
            <div className="mb-3 font-body rounded-lg bg-main/10 px-3 py-2 text-sm text-danger">
              {err}
            </div>
          )}
          {info && (
            <div className="mb-3 font-body rounded-lg bg-main/10 px-3 py-2 text-sm text-main">
              {info}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div className="space-y-1 mb-5">
              <label htmlFor="login-email" className="text-lg font-heading text-dark">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg px-3 py-2 outline-none shadow-xl bg-amber-50 focus:ring-1 focus:ring-main focus:shadow-main/20 border-none transition-all duration-200 ease-in-out"
                placeholder="you@tempero.app"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="login-pass" className="text-lg font-heading text-dark">
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
                  className="w-full rounded-lg px-3 py-2 pr-24 outline-none shadow-xl bg-amber-50 focus:ring-1 focus:ring-main focus:shadow-main/20 border-none transition-all duration-200 ease-in-out"
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
              className="w-full rounded-lg bg-secondary px-4 py-2.5 text-white hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-70 duration-150"
            >
              {loading ? "Signing in…" : "Log in"}
            </button>
          </form>

          <div className="mt-4 flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
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

            {showResend && (
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resending}
                className="self-start text-gray-700 underline underline-offset-4 hover:text-black disabled:opacity-70"
              >
                {resending ? "Resending…" : "Resend confirmation email"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
