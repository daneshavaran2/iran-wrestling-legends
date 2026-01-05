import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WrestlerProvider } from "@/contexts/WrestlerContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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

// Admin Pages
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminSignupPage from "./pages/admin/AdminSignupPage";
import AdminSetupPage from "./pages/admin/AdminSetupPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminWrestlersPage from "./pages/admin/AdminWrestlersPage";
import AdminWrestlerEditPage from "./pages/admin/AdminWrestlerEditPage";
import NotFound from "./pages/NotFound";

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
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </WrestlerProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
