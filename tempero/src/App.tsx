import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";


function NotFoundPage() {
  return <div className="p-6 text-center">404 - Page not found</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Simple navbar just to navigate between routes */}
      <nav className="flex justify-center gap-4 p-4 border-b bg-gray-100">
        <Link to="/" className="hover:underline">Home</Link>
        <Link to="/register" className="hover:underline">Register</Link>
        <Link to="/login" className="hover:underline">Login</Link>
      </nav>

      {/* Page routes */}
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="login" element={<LoginPage />} /> 
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
