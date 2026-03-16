import { Link, useLocation } from 'react-router-dom';
import { Trophy, Home, BarChart3, Vote, Award, LogOut, Coins, Building2, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { userData, signOut } = useAuth();
  const location = useLocation();

  const links = [
    { to: '/', icon: Home, label: 'Accueil' },
    { to: '/matches', icon: Trophy, label: 'Matchs' },
    { to: '/worldcup', icon: Globe, label: 'CDM 2026', highlight: true },
    { to: '/leaderboard', icon: BarChart3, label: 'Classement' },
    { to: '/polls', icon: Vote, label: 'Sondages' },
    { to: '/awards', icon: Award, label: 'Dundies' },
    { to: '/office', icon: Building2, label: 'Bureau' },
  ];

  return (
    <nav className="bg-office-navy text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-xl">
            <Trophy className="w-6 h-6 text-office-mustard" />
            <span className="font-office tracking-tight">THE OFFICE LEAGUE</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map(({ to, icon: Icon, label, highlight }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  location.pathname === to
                    ? highlight
                      ? 'bg-office-mustard/20 text-office-mustard'
                      : 'bg-white/15 text-white'
                    : highlight
                    ? 'text-office-mustard/60 hover:bg-office-mustard/10 hover:text-office-mustard'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {userData && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-office-mustard/20 px-3 py-1.5 rounded-full">
                <Coins className="w-4 h-4 text-office-mustard" />
                <span className="text-sm font-bold text-office-mustard">
                  {userData.officeCoins.toLocaleString()}
                </span>
              </div>
              <div className="hidden lg:flex items-center gap-2">
                {userData.photoURL ? (
                  <img src={userData.photoURL} alt="" className="w-7 h-7 rounded-full" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-xs font-bold">
                    {userData.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium">{userData.displayName}</span>
              </div>
              <button
                onClick={signOut}
                className="text-white/40 hover:text-white transition-colors p-1.5"
                title="Deconnexion"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex justify-around border-t border-white/10 py-2 px-1">
        {links.slice(0, 5).map(({ to, icon: Icon, label, highlight }) => (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center gap-0.5 text-[10px] px-2 py-1 rounded-lg transition-colors ${
              location.pathname === to
                ? highlight ? 'text-office-mustard' : 'text-office-mustard'
                : 'text-white/40'
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
