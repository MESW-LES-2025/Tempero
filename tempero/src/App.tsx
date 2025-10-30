import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";

function NotFoundPage() {
  return <div className="p-6 text-center">404 - Page not found</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Simple navbar just to navigate between routes */}
      <nav className="flex justify-center gap-4 p-4 border-b bg-gray-100">
        <Link to="/" className="hover:underline">
          Home
        </Link>
        <Link to="/register" className="hover:underline">
          Register
        </Link>
        <Link to="/login" className="hover:underline">
          Login
        </Link>
        <Link to="/profile" className="hover:underline">
          Profile
        </Link>
      </nav>

      {/* Page routes */}
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
