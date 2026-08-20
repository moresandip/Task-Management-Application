import { Link, useNavigate } from 'react-router-dom';
import { CheckSquare, LogOut, User, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Navbar
 * Top navigation bar displayed on all authenticated pages.
 * Shows the app logo, current user's name, and a logout button.
 */
function Navbar({ onNewTask }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:shadow-brand-500/50 transition-shadow">
              <CheckSquare className="w-4.5 h-4.5 text-white" size={18} />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">
              Task<span className="text-brand-400">Manager</span>
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* New Task Button */}
            {onNewTask && (
              <button
                onClick={onNewTask}
                className="btn-primary hidden sm:inline-flex"
              >
                <Plus size={16} />
                New Task
              </button>
            )}

            {/* User info */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-light">
              <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center">
                <User size={14} className="text-white" />
              </div>
              <span className="text-sm font-medium text-slate-300 hidden sm:block max-w-[120px] truncate">
                {user?.name}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10 !px-3"
              title="Logout"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
