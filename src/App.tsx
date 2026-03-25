/**
 * Composant racine de l'application
 * 
 * Configure tous les providers nécessaires et définit les routes de l'application.
 * 
 * Structure des providers (de l'extérieur vers l'intérieur) :
 * 1. QueryClientProvider - Gestion du cache et des requêtes avec React Query
 * 2. AuthProvider - Gestion de l'authentification
 * 3. CartProvider - Gestion du panier
 * 4. TooltipProvider - Support des tooltips (Radix UI)
 * 
 * Routes :
 * - Routes publiques (login, register) sans layout
 * - Routes dashboard (restaurant, admin) avec leurs propres layouts
 * - Routes principales avec MainLayout (Header + Footer)
 */

import { AppToaster, SonnerToaster } from "@/components/ui/feedback";
import { TooltipProvider } from "@/components/ui/overlays";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import Index from "./pages/Index";
import RestaurantsPage from "./pages/RestaurantsPage";
import RestaurantDetailPage from "./pages/RestaurantDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RegisterRestaurateurPage from "./pages/RegisterRestaurateurPage";
import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/profile/EditProfilePage";
import AllergiesPage from "./pages/profile/AllergiesPage";
import NotificationsPage from "./pages/profile/NotificationsPage";
import SettingsPage from "./pages/profile/SettingsPage";
import FavoritesPage from "./pages/FavoritesPage";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminRestaurants from "./pages/admin/AdminRestaurants";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <AppToaster />
          <SonnerToaster />
          <BrowserRouter>
            <Routes>
              {/* Auth pages without layout */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/register-restaurant" element={<RegisterRestaurateurPage />} />
              <Route path="/partner" element={<RegisterRestaurateurPage />} />
              
              {/* Restaurant dashboard without main layout */}
              <Route path="/dashboard" element={<RestaurantDashboard />} />
              
              {/* Admin dashboard with nested routes */}
              <Route path="/admin" element={<AdminDashboard />}>
                <Route index element={<AdminOverview />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="restaurants" element={<AdminRestaurants />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="analytics" element={<AdminAnalytics />} />
              </Route>
              
              {/* Main layout routes */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/restaurants" element={<RestaurantsPage />} />
                <Route path="/restaurant/:id" element={<RestaurantDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/edit" element={<EditProfilePage />} />
                <Route path="/allergies" element={<AllergiesPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/my-orders" element={<ClientDashboard />} />
              </Route>
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
