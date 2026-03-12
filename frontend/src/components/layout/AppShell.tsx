/**
 * AppShell — Authenticated app layout.
 *
 * Top bar with:
 *   - Logo + Home button (left)
 *   - Household name (center)
 *   - User avatar + dropdown menu (right)
 *
 * Dropdown contains less-used pages:
 *   - Profile
 *   - Users (primary only)
 *   - Recipe List
 *   - Settings (primary only)
 *   - Support
 *   - Sign Out
 *
 * Main content area renders child routes (the tab-based workflow).
 */

import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BRAND } from '../../config/branding';
import Logo from '../common/Logo';
import {
  Home, ChevronDown, User, Users, BookOpen, Settings,
  HelpCircle, LogOut,
} from 'lucide-react';

const AppShell: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isPrimary = user?.role === 'primary';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNav = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  const handleSignOut = () => {
    setMenuOpen(false);
    signOut();
    navigate('/');
  };

  return (
    <div className="app-shell">
      {/* ================================================================
         Top Navigation Bar
         ================================================================ */}
      <header className="app-topbar">
        <div className="topbar-inner">
          {/* Left: Logo + Home */}
          <div className="topbar-left">
            <Link to="/app" className="topbar-logo" title="Home">
              <Logo size={56} />
            </Link>
            <Link to="/app" className="topbar-home-btn" title="Home">
              <Home size={18} />
            </Link>
          </div>

          {/* Right: User dropdown */}
          <div className="topbar-right" ref={menuRef}>
            <button
              className="topbar-user-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              <span className="topbar-avatar">
                {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
              <span className="topbar-user-name">{user?.displayName}</span>
              <ChevronDown size={16} className={`topbar-chevron ${menuOpen ? 'open' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="topbar-dropdown">
                <div className="dropdown-header">
                  <span className="dropdown-name">{user?.displayName}</span>
                  <span className="dropdown-role">
                    {isPrimary ? 'Primary User' : 'Member'}
                  </span>
                </div>

                <div className="dropdown-divider" />

                <button className="dropdown-item" onClick={() => handleNav('/app/profile')}>
                  <User size={16} />
                  Profile
                </button>

                {isPrimary && (
                  <button className="dropdown-item" onClick={() => handleNav('/app/users')}>
                    <Users size={16} />
                    Users
                  </button>
                )}

                <button className="dropdown-item" onClick={() => handleNav('/app/recipes')}>
                  <BookOpen size={16} />
                  Recipe List
                </button>

                {isPrimary && (
                  <button className="dropdown-item" onClick={() => handleNav('/app/settings')}>
                    <Settings size={16} />
                    Settings
                  </button>
                )}

                <button className="dropdown-item" onClick={() => handleNav('/app/support')}>
                  <HelpCircle size={16} />
                  Support
                </button>

                <div className="dropdown-divider" />

                <button className="dropdown-item dropdown-item--danger" onClick={handleSignOut}>
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ================================================================
         Main Content Area (renders DashboardPage or dropdown pages)
         ================================================================ */}
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
