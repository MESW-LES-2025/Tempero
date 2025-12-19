import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // 1. Verify the user is actually logged in (via the email link)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError("Invalid or expired reset link. Please try requesting a new one.");
      }
    });
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");

    // 2. Validation: Check if passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    // 3. Update the password
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setMsg("Password updated successfully! Redirecting...");
      // Redirect to home (or login) after a short delay
      setTimeout(() => {
        navigate("/home"); 
      }, 2000);
    }
  };

  return (
    <div className="fixed min-h-screen min-w-screen  flex items-center justify-center bg-[url('/images/croissant-bg.jpg')] bg-cover bg-center">
      {/* Overlay */}
      <div className="absolute inset-0 backdrop-blur-xs pointer-events-none"></div>

      {/* Logo (Optional, matches Login Page) */}
      <div
        className="logo fixed top-1 left-1 z-10 cursor-pointer"
        onClick={() => navigate("/login")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
        navigate("/login");
          }
        }}
      >
        <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Tempero Logo" className="h-16" />
      </div>

      <div className="mx-auto mt-12 max-w-md w-full">
        <div className="rounded-xl bg-bright/90 p-6 shadow-sm relative z-10">
          <h1 className="mb-4 text-3xl font-bold font-heading text-main text-center">
            Set New Password
          </h1>
          <p className="mb-6 text-sm text-gray-600 text-center">
            Please enter your new password below.
          </p>

          {msg && (
            <div className="mb-3 rounded-lg bg-green-100 px-3 py-2 text-sm text-green-700 border border-green-200 font-body">
              {msg}
            </div>
          )}

          {error && (
            <div className="mb-3 rounded-lg bg-main/10 px-3 py-2 text-sm text-danger font-body">
              {error}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-4">
            {/* Password Field */}
            <div className="space-y-1">
              <label htmlFor="new-pass" className="text-lg font-heading text-dark">
                New Password
              </label>
              <input
                id="new-pass"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg px-3 py-2 outline-none shadow-xl bg-amber-50 focus:ring-1 focus:ring-main focus:shadow-main/20 border-none transition-all duration-200"
                placeholder="Min 6 characters"
              />
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1">
              <label htmlFor="confirm-pass" className="text-lg font-heading text-dark">
                Confirm Password
              </label>
              <input
                id="confirm-pass"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg px-3 py-2 outline-none shadow-xl bg-amber-50 focus:ring-1 focus:ring-main focus:shadow-main/20 border-none transition-all duration-200"
                placeholder="Retype password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !!msg}
              className="w-full rounded-lg bg-secondary px-4 py-2.5 text-white hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-70 duration-150 mt-4"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}