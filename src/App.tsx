import React, { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WrestlerProvider } from "@/contexts/WrestlerContext";
import { OfflineDataProvider } from "@/contexts/OfflineDataContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageTransition } from "@/components/PageTransition";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import AdminLayout from "@/components/AdminLayout";
import { BackgroundMusicPlayer } from "@/components/BackgroundMusicPlayer";
import InstallPrompt from "@/components/InstallPrompt";
import { VirtualKeyboardProvider } from "@/components/VirtualKeyboardProvider";

// Prefetch critical routes after initial load for 10x faster navigation
const prefetchRoutes = () => {
  setTimeout(() => {
    import("./pages/WrestlersListPage");
    import("./pages/AlbumsListPage");
    import("./pages/HistoryListPage");
  }, 2000);
};

// Lazy load public pages
const MuseumHomePage = lazy(() => import("./pages/MuseumHomePage"));
const WrestlersListPage = lazy(() => import("./pages/WrestlersListPage"));
const WrestlerProfilePage = lazy(() => import("./pages/WrestlerProfilePage"));
const HistoryListPage = lazy(() => import("./pages/HistoryListPage"));
const HistoryDetailPage = lazy(() => import("./pages/HistoryDetailPage"));
const BuildingsListPage = lazy(() => import("./pages/BuildingsListPage"));
const BuildingDetailPage = lazy(() => import("./pages/BuildingDetailPage"));
const BooksListPage = lazy(() => import("./pages/BooksListPage"));
const AlbumsListPage = lazy(() => import("./pages/AlbumsListPage"));
const AlbumGalleryPage = lazy(() => import("./pages/AlbumGalleryPage"));
const AboutMuseumPage = lazy(() => import("./pages/AboutMuseumPage"));
const InstallPage = lazy(() => import("./pages/InstallPage"));
const InstallGuidePage = lazy(() => import("./pages/InstallGuidePage"));
const CacheSettingsPage = lazy(() => import("./pages/CacheSettingsPage"));

// Lazy load admin pages
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminSignupPage = lazy(() => import("./pages/admin/AdminSignupPage"));
const AdminSetupPage = lazy(() => import("./pages/admin/AdminSetupPage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminWrestlersPage = lazy(() => import("./pages/admin/AdminWrestlersPage"));
const AdminWrestlerEditPage = lazy(() => import("./pages/admin/AdminWrestlerEditPage"));
const AdminHistoryPage = lazy(() => import("./pages/admin/AdminHistoryPage"));
const AdminBuildingsPage = lazy(() => import("./pages/admin/AdminBuildingsPage"));
const AdminBooksPage = lazy(() => import("./pages/admin/AdminBooksPage"));
const AdminAlbumsPage = lazy(() => import("./pages/admin/AdminAlbumsPage"));
const AdminAboutPage = lazy(() => import("./pages/admin/AdminAboutPage"));
const AdminAudioPage = lazy(() => import("./pages/admin/AdminAudioPage"));
const AdminOfflineSettingsPage = lazy(() => import("./pages/admin/AdminOfflineSettingsPage"));
const AdminBackupPage = lazy(() => import("./pages/admin/AdminBackupPage"));
const AdminGeneralSettingsPage = lazy(() => import("./pages/admin/AdminGeneralSettingsPage"));
const AdminResetPasswordPage = lazy(() => import("./pages/admin/AdminResetPasswordPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      gcTime: 10 * 60 * 1000,   // 10 minutes garbage collection
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  // Prefetch routes after initial load
  useEffect(() => {
    prefetchRoutes();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider>
          <TooltipProvider>
            <AuthProvider>
              <OfflineDataProvider>
              <WrestlerProvider>
              <VirtualKeyboardProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <BackgroundMusicPlayer />
                <OfflineIndicator />
                <InstallPrompt />
              <Suspense fallback={<LoadingSpinner />}>
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
                  
                  {/* Install */}
                  <Route path="/install" element={<InstallPage />} />
                  <Route path="/install-guide" element={<InstallGuidePage />} />
                  
                  {/* Cache Settings */}
                  <Route path="/settings/cache" element={<CacheSettingsPage />} />
                
                {/* Auth Routes */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin/signup" element={<AdminSignupPage />} />
                <Route path="/admin/setup" element={<AdminSetupPage />} />
                <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />
                
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
                <Route path="/admin/offline" element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <AdminOfflineSettingsPage />
                    </AdminLayout>
                  </ProtectedRoute>
                } />
                <Route path="/admin/backup" element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <AdminBackupPage />
                    </AdminLayout>
                  </ProtectedRoute>
                } />
                <Route path="/admin/settings" element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <AdminGeneralSettingsPage />
                    </AdminLayout>
                  </ProtectedRoute>
                } />
                
                  <Route path="*" element={<NotFound />} />
                  </Routes>
                </PageTransition>
              </Suspense>
              </BrowserRouter>
              </VirtualKeyboardProvider>
              </WrestlerProvider>
              </OfflineDataProvider>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
