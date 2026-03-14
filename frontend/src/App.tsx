/**
 * App — Root component with routing.
 *
 * Public routes: homepage, pricing, faq, contact, login (no auth required).
 * App routes: require auth + household membership.
 *   - /app = Dashboard with 3-tab workflow (home)
 *   - /app/profile, /app/users, /app/recipes, /app/settings, /app/support = dropdown pages
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Public pages
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/public/LoginPage';
import PricingPage from './pages/public/PricingPage';
import FaqPage from './pages/public/FaqPage';
import ContactPage from './pages/public/ContactPage';

// Onboarding
import CreateHouseholdPage from './pages/onboarding/CreateHouseholdPage';

// App pages
import DashboardPage from './pages/app/DashboardPage';
import ProfilePage from './pages/app/ProfilePage';
import UsersPage from './pages/app/UsersPage';
import RecipesPage from './pages/app/RecipesPage';
import SettingsPage from './pages/app/SettingsPage';
import SupportPage from './pages/app/SupportPage';
import AccountPage from './pages/app/AccountPage';
import SubscribePage from './pages/app/SubscribePage';

// Accept invite
import AcceptInvitePage from './pages/accept-invite/AcceptInvitePage';

// Layout
import PublicLayout from './components/layout/PublicLayout';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/layout/ProtectedRoute';

const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', fontFamily: 'Inter, sans-serif', color: '#6B7280',
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes — marketing pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/app" replace /> : <LoginPage />
        } />
        <Route path="/signup" element={
          isAuthenticated ? <Navigate to="/app" replace /> : <LoginPage />
        } />
      </Route>

      {/* Accept invitation */}
      <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />

      {/* Onboarding — authenticated but no household */}
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding/create-household" element={<CreateHouseholdPage />} />
      </Route>

      {/* Authenticated app routes */}
      <Route element={<ProtectedRoute requireHousehold />}>
        <Route element={<AppShell />}>
          {/* Home = Dashboard with tab workflow */}
          <Route path="/app" element={<DashboardPage />} />

          {/* Dropdown menu pages */}
          <Route path="/app/profile" element={<ProfilePage />} />
          <Route path="/app/users" element={<UsersPage />} />
          <Route path="/app/recipes" element={<RecipesPage />} />
          <Route path="/app/settings" element={<SettingsPage />} />
          <Route path="/app/support" element={<SupportPage />} />
          <Route path="/app/account" element={<AccountPage />} />
          <Route path="/app/subscribe" element={<SubscribePage />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;