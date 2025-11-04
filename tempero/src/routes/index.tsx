import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../components/Navbar";
import HomePage from "../pages/HomePage";
import RegisterPage from "../pages/RegisterPage";

function NotFoundPage() {
  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold">404</h1>
      <p className="text-gray-600">Page not found.</p>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
