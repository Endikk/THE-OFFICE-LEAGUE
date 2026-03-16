import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Trophy, Home, BarChart3, Vote, Award, LogOut, Coins,
  Building2, Globe, Target, Menu, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import QuoteBanner from '../common/QuoteBanner';
import NotificationBell from '../notifications/NotificationBell';

export default function Navbar() {
  const { userData, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: '/', icon: Home, label: 'Accueil' },
    { to: '/matches', icon: Trophy, label: 'Matchs' },
    { to: '/bets', icon: Target, label: 'Mes paris' },
    { to: '/worldcup', icon: Globe, label: 'CDM 2026', highlight: true },
    { to: '/leaderboard', icon: BarChart3, label: 'Classement' },
    { to: '/polls', icon: Vote, label: 'Sondages' },
    { to: '/awards', icon: Award, label: 'Dundies' },
    { to: '/office', icon: Building2, label: 'Bureau' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50">
      {/* Quote banner */}
      <QuoteBanner />

      {/* Main nav */}
      <nav className="bg-office-navy shadow-nav">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 bg-office-mustard rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <Trophy className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="font-heading font-bold text-white text-base tracking-tight block leading-none">
                  THE OFFICE LEAGUE
                </span>
                <span className="text-[9px] text-white/30 tracking-[0.15em] uppercase font-sans">
                  Dunder Mifflin Sports Division
                </span>
              </div>
              <span className="sm:hidden font-heading font-bold text-white text-sm">
                OFFICE LEAGUE
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-0.5">
              {links.map(({ to, icon: Icon, label, highlight }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive(to)
                      ? highlight
                        ? 'bg-office-mustard/20 text-office-mustard'
                        : 'bg-white/15 text-white'
                      : highlight
                      ? 'text-office-mustard/50 hover:bg-office-mustard/10 hover:text-office-mustard'
                      : 'text-white/50 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {userData && (
                <>
                  {/* OfficeCoins */}
                  <div className="flex items-center gap-1.5 bg-office-mustard/15 px-3 py-1.5 rounded-full border border-office-mustard/20">
                    <Coins className="w-3.5 h-3.5 text-office-mustard" />
                    <span className="text-xs font-mono font-bold text-office-mustard">
                      {userData.officeCoins.toLocaleString()}
                    </span>
                  </div>

                  {/* Notification bell */}
                  <NotificationBell />

                  {/* User avatar */}
                  <div className="hidden md:flex items-center gap-2">
                    {userData.photoURL ? (
                      <img
                        src={userData.photoURL}
                        alt=""
                        className="w-7 h-7 rounded-full border-2 border-white/20"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-office-paper/15 flex items-center justify-center text-[10px] font-bold text-white border-2 border-white/20">
                        {userData.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-medium text-white/80">{userData.displayName}</span>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={signOut}
                    className="text-white/30 hover:text-white transition-colors p-1.5 hidden md:block"
                    title="Deconnexion"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden text-white/60 hover:text-white p-1.5 transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/10 animate-slide-down">
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
              {links.map(({ to, icon: Icon, label, highlight }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive(to)
                      ? highlight
                        ? 'bg-office-mustard/20 text-office-mustard'
                        : 'bg-white/15 text-white'
                      : 'text-white/50 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}

              {userData && (
                <div className="border-t border-white/10 pt-3 mt-2">
                  <div className="flex items-center gap-3 px-3 py-2">
                    {userData.photoURL ? (
                      <img src={userData.photoURL} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-xs font-bold text-white">
                        {userData.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">{userData.displayName}</p>
                      <p className="text-xs text-office-mustard font-mono">
                        {userData.officeCoins.toLocaleString()} coins
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={signOut}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-office-red-light hover:bg-white/5 w-full transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Deconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-office-paper-dark/60 z-50 safe-area-bottom">
        <div className="flex justify-around py-1.5 px-1">
          {links.slice(0, 5).map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 text-[10px] px-2 py-1 rounded-lg transition-colors ${
                isActive(to)
                  ? 'text-office-mustard'
                  : 'text-office-brown-light/40'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive(to) ? '' : ''}`} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
