import { BrowserRouter, Route, Routes, Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./config/supabaseClient";
import ErrorImage from "./assets/404.png";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import AboutPage from "./pages/AboutPage";
import AssessmentPage from "./pages/AssessmentPage";
import CreateListPage from "./pages/CreateListPage";
import EditProfilePage from "./pages/EditProfilePage";
import FaqPage from "./pages/FaqPage";
import HomePage from "./pages/HomePage";
import ListDetailPage from "./pages/ListDetailPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import PublicListsPage from "./pages/PublicListsPage";
import RecipePage from "./pages/RecipePage";
import RegisterPage from "./pages/RegisterPage";
import ReviewPage from "./pages/ReviewPage";
import SearchPage from "./pages/SearchPage";
import UploadRecipePage from "./pages/UploadRecipePage";

/* Auth guard component: redirects to /login when user is not authenticated */
function RequireAuth() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ?? null);
      setChecking(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (checking) return null; // loading

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}

function NotFoundPage() {
  return (
    <div className="p-6 text-center">
      {
        <img
          src={ErrorImage}
          alt="404 Not Found"
          className="mx-auto scale-50"
        />
      }
    </div>
  );
}

/* Layout wrapper for pages that need Navbar + Footer + padding */
function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-bright">
      <Navbar />
      <main className="flex-1 py-5 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/Tempero">
      <Routes>
        {/* Full-bleed auth pages: no navbar/footer/padding */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        {/* All other pages use the main layout */}
        <Route element={<MainLayout />}>
          {/* Default landing page: About */}
          <Route index element={<AboutPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="*" element={<NotFoundPage />} />

          {/* Protected routes: user must be logged in */}
          <Route element={<RequireAuth />}>
            <Route path="home" element={<HomePage />} />
            <Route path="skill-assessment" element={<AssessmentPage />} />
            <Route path="lists/new" element={<CreateListPage />} />
            <Route path="lists" element={<PublicListsPage />} />
            <Route path="lists/:playlistId" element={<ListDetailPage />} />
            <Route path="profile/:username" element={<ProfilePage />} />
            <Route path="profile/edit" element={<EditProfilePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="upload-recipe" element={<UploadRecipePage />} />
            <Route path="recipe/:id" element={<RecipePage />} />
            <Route path="review/:id" element={<ReviewPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
