import { Link, useLocation } from 'react-router-dom';
import { Trophy, Home, BarChart3, Vote, Award, LogOut, Coins } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { signOut } from '../../services/auth';

export default function Navbar() {
  const { userData } = useAuth();
  const location = useLocation();

  const links = [
    { to: '/', icon: Home, label: 'Accueil' },
    { to: '/matches', icon: Trophy, label: 'Matchs' },
    { to: '/leaderboard', icon: BarChart3, label: 'Classement' },
    { to: '/polls', icon: Vote, label: 'Sondages' },
    { to: '/awards', icon: Award, label: 'Dundies' },
  ];

  return (
    <nav className="bg-dunder-blue text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <Trophy className="w-6 h-6 text-dunder-gold" />
            <span className="font-office">THE OFFICE LEAGUE</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === to
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {userData && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 bg-dunder-gold/20 px-3 py-1.5 rounded-full">
                <Coins className="w-4 h-4 text-dunder-gold" />
                <span className="text-sm font-semibold text-dunder-gold">
                  {userData.officeCoins}
                </span>
              </div>
              <span className="text-sm hidden lg:block">{userData.displayName}</span>
              <button
                onClick={signOut}
                className="text-white/70 hover:text-white transition-colors"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex justify-around border-t border-white/10 py-2">
        {links.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center gap-0.5 text-xs ${
              location.pathname === to ? 'text-dunder-gold' : 'text-white/60'
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
