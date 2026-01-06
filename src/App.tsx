import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WrestlerProvider } from "@/contexts/WrestlerContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageTransition } from "@/components/PageTransition";
import AdminLayout from "@/components/AdminLayout";

// Public Pages
import MuseumHomePage from "./pages/MuseumHomePage";
import WrestlersListPage from "./pages/WrestlersListPage";
import WrestlerProfilePage from "./pages/WrestlerProfilePage";
import HistoryListPage from "./pages/HistoryListPage";
import HistoryDetailPage from "./pages/HistoryDetailPage";
import BuildingsListPage from "./pages/BuildingsListPage";
import BuildingDetailPage from "./pages/BuildingDetailPage";
import BooksListPage from "./pages/BooksListPage";
import AlbumsListPage from "./pages/AlbumsListPage";
import AlbumGalleryPage from "./pages/AlbumGalleryPage";
import AboutMuseumPage from "./pages/AboutMuseumPage";

// Admin Pages
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminSignupPage from "./pages/admin/AdminSignupPage";
import AdminSetupPage from "./pages/admin/AdminSetupPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminWrestlersPage from "./pages/admin/AdminWrestlersPage";
import AdminWrestlerEditPage from "./pages/admin/AdminWrestlerEditPage";
import AdminHistoryPage from "./pages/admin/AdminHistoryPage";
import AdminBuildingsPage from "./pages/admin/AdminBuildingsPage";
import AdminBooksPage from "./pages/admin/AdminBooksPage";
import AdminAlbumsPage from "./pages/admin/AdminAlbumsPage";
import AdminAboutPage from "./pages/admin/AdminAboutPage";
import AdminAudioPage from "./pages/admin/AdminAudioPage";
import NotFound from "./pages/NotFound";
import { BackgroundMusicPlayer } from "@/components/BackgroundMusicPlayer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <WrestlerProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <BackgroundMusicPlayer />
            <PageTransition>
              <Routes>
                {/* Public Routes - Museum */}
                <Route path="/" element={<MuseumHomePage />} />
                
                {/* Wrestlers */}
                <Route path="/wrestlers" element={<WrestlersListPage />} />
                <Route path="/wrestler/:id" element={<WrestlerProfilePage />} />
                
                {/* History */}
                <Route path="/history" element={<HistoryListPage />} />
                <Route path="/history/:slug" element={<HistoryDetailPage />} />
                
                {/* Buildings */}
                <Route path="/buildings" element={<BuildingsListPage />} />
                <Route path="/buildings/:id" element={<BuildingDetailPage />} />
                
                {/* Books */}
                <Route path="/books" element={<BooksListPage />} />
                
                {/* Albums */}
                <Route path="/albums" element={<AlbumsListPage />} />
                <Route path="/albums/:id" element={<AlbumGalleryPage />} />
                
                {/* About */}
                <Route path="/about" element={<AboutMuseumPage />} />
              
              {/* Auth Routes */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin/signup" element={<AdminSignupPage />} />
              <Route path="/admin/setup" element={<AdminSetupPage />} />
              
              {/* Protected Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminDashboardPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/wrestlers" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminWrestlersPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/wrestlers/:id" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminWrestlerEditPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/history" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminHistoryPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/buildings" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminBuildingsPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/books" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminBooksPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/albums" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminAlbumsPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/about" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminAboutPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/audio" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminAudioPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PageTransition>
          </BrowserRouter>
          </WrestlerProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
