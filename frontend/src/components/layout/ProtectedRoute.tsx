/**
 * ProtectedRoute — Guards routes that require authentication.
 * Optionally requires household membership.
 */

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface Props {
  requireHousehold?: boolean;
}

const ProtectedRoute: React.FC<Props> = ({ requireHousehold = false }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireHousehold && !user?.householdId) {
    return <Navigate to="/onboarding/create-household" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
