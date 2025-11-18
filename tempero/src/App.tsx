import { BrowserRouter, Route, Routes } from "react-router-dom";
import ErrorImage from "./assets/404.png";
import Navbar from "./components/Navbar";
import AssessmentPage from "./pages/AssessmentPage";
import EditProfilePage from "./pages/EditProfilePage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import PlaylistDetailPage from "./pages/PlaylistDetailPage";
import ProfilePage from "./pages/ProfilePage";
import PublicPlaylistsPage from "./pages/PublicPlaylistsPage";
import RegisterPage from "./pages/RegisterPage";
import SearchPage from "./pages/SearchPage";

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
        <Route path="lists" element={<PublicPlaylistsPage />} />
        <Route path="lists/:playlistId" element={<PlaylistDetailPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="skill-assessment" element={<AssessmentPage />} />
        <Route path="profile/:username" element={<ProfilePage />} />
        <Route path="profile/edit" element={<EditProfilePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
