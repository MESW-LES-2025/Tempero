import { BrowserRouter, Route, Routes } from "react-router-dom";
import ErrorImage from "./assets/404.png";
import Navbar from "./components/Navbar";
import AssessmentPage from "./pages/AssessmentPage";
import CreateListPage from "./pages/CreateListPage";
import EditProfilePage from "./pages/EditProfilePage";
import HomePage from "./pages/HomePage";
import ListDetailPage from "./pages/ListDetailPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import PublicListsPage from "./pages/PublicListsPage";
import RegisterPage from "./pages/RegisterPage";
import SearchPage from "./pages/SearchPage";
import UploadRecipePage from "./pages/UploadRecipePage";
import RecipePage from "./pages/RecipePage";

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
      <Navbar />
      <Routes>
        <Route index element={<HomePage />} />
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
    </BrowserRouter>
  );
}
