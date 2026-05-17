import React, { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WrestlerProvider } from "@/contexts/WrestlerContext";
import { OfflineDataProvider } from "@/contexts/OfflineDataContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PageTransition } from "@/components/PageTransition";
import { LoadingSpinner } from "@/components/LoadingSpinner";
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

// Public museum pages (offline kiosk — no admin, no auth)
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
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin pages (open access — no auth)
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminWrestlersPage = lazy(() => import("./pages/admin/AdminWrestlersPage"));
const AdminWrestlerEditPage = lazy(() => import("./pages/admin/AdminWrestlerEditPage"));
const AdminHistoryPage = lazy(() => import("./pages/admin/AdminHistoryPage"));
const AdminBuildingsPage = lazy(() => import("./pages/admin/AdminBuildingsPage"));
const AdminBooksPage = lazy(() => import("./pages/admin/AdminBooksPage"));
const AdminAlbumsPage = lazy(() => import("./pages/admin/AdminAlbumsPage"));
const AdminAudioPage = lazy(() => import("./pages/admin/AdminAudioPage"));
const AdminAboutPage = lazy(() => import("./pages/admin/AdminAboutPage"));
const AdminOfflineSettingsPage = lazy(() => import("./pages/admin/AdminOfflineSettingsPage"));
const AdminGeneralSettingsPage = lazy(() => import("./pages/admin/AdminGeneralSettingsPage"));
const AdminBackupPage = lazy(() => import("./pages/admin/AdminBackupPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  useEffect(() => {
    prefetchRoutes();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider>
          <TooltipProvider>
            <OfflineDataProvider>
              <WrestlerProvider>
                <VirtualKeyboardProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <BackgroundMusicPlayer />
                    <InstallPrompt />
                    <Suspense fallback={<LoadingSpinner />}>
                      <PageTransition>
                        <Routes>
                          <Route path="/" element={<MuseumHomePage />} />
                          <Route path="/wrestlers" element={<WrestlersListPage />} />
                          <Route path="/wrestler/:id" element={<WrestlerProfilePage />} />
                          <Route path="/history" element={<HistoryListPage />} />
                          <Route path="/history/:slug" element={<HistoryDetailPage />} />
                          <Route path="/buildings" element={<BuildingsListPage />} />
                          <Route path="/buildings/:id" element={<BuildingDetailPage />} />
                          <Route path="/books" element={<BooksListPage />} />
                          <Route path="/albums" element={<AlbumsListPage />} />
                          <Route path="/albums/:id" element={<AlbumGalleryPage />} />
                          <Route path="/about" element={<AboutMuseumPage />} />
                          <Route path="/install" element={<InstallPage />} />
                          <Route path="/install-guide" element={<InstallGuidePage />} />
                          <Route path="/settings/cache" element={<CacheSettingsPage />} />
                          <Route path="/admin" element={<AdminDashboardPage />} />
                          <Route path="/admin/wrestlers" element={<AdminWrestlersPage />} />
                          <Route path="/admin/wrestlers/:id" element={<AdminWrestlerEditPage />} />
                          <Route path="/admin/history" element={<AdminHistoryPage />} />
                          <Route path="/admin/buildings" element={<AdminBuildingsPage />} />
                          <Route path="/admin/books" element={<AdminBooksPage />} />
                          <Route path="/admin/albums" element={<AdminAlbumsPage />} />
                          <Route path="/admin/audio" element={<AdminAudioPage />} />
                          <Route path="/admin/about" element={<AdminAboutPage />} />
                          <Route path="/admin/offline" element={<AdminOfflineSettingsPage />} />
                          <Route path="/admin/settings" element={<AdminGeneralSettingsPage />} />
                          <Route path="/admin/backup" element={<AdminBackupPage />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </PageTransition>
                    </Suspense>
                  </BrowserRouter>
                </VirtualKeyboardProvider>
              </WrestlerProvider>
            </OfflineDataProvider>
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
