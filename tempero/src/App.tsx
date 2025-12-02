import { BrowserRouter, Route, Routes } from "react-router-dom";
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
import SearchPage from "./pages/SearchPage";
import UploadRecipePage from "./pages/UploadRecipePage";

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

export default function App() {
  return (
    <BrowserRouter basename="/Tempero">
      <div className="min-h-screen flex flex-col bg-bright">
        <Navbar />
        <main className="flex-1 py-5 px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route index element={<HomePage />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="/lists/new" element={<CreateListPage />} />
            <Route path="lists" element={<PublicListsPage />} />
            <Route path="lists/:playlistId" element={<ListDetailPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="skill-assessment" element={<AssessmentPage />} />
            <Route path="profile/:username" element={<ProfilePage />} />
            <Route path="profile/edit" element={<EditProfilePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="upload-recipe" element={<UploadRecipePage />} />
            <Route path="recipe/:id" element={<RecipePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
