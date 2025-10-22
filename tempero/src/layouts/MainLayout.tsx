import { NavLink, Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="min-h-dvh flex flex-col bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
        <nav className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4">
          <NavLink to="/" className="font-bold text-xl">Tempero</NavLink>
          <div className="ml-auto flex items-center gap-3">
            <NavLink to="/login" className="text-sm hover:underline">Login</NavLink>
            <NavLink
              to="/register"
              className="inline-flex items-center rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
            >
              Register
            </NavLink>
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        <Outlet />
      </main>

      <footer className="mt-auto border-t px-4 py-6 text-center text-sm text-gray-600">
        © {new Date().getFullYear()} Tempero
      </footer>
    </div>
  );
}
