import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import ToastContainer from './components/common/ToastContainer';
import Confetti from './components/common/Confetti';
import { useNotifications } from './context/NotificationContext';
import { useMatchListener, useMatchReminderListener } from './hooks/useMatchListener';
import { useLeaderboardListener } from './hooks/useLeaderboardListener';
import { useDundieListener } from './hooks/useDundieListener';

// Pages publiques (auth)
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Pages semi-protégées (connecté mais pas d'office)
import JoinOfficePage from './pages/JoinOfficePage';
import CreateOfficePage from './pages/CreateOfficePage';

// Pages protégées (connecté + office)
import Dashboard from './pages/Dashboard';
import MatchesPage from './pages/MatchesPage';
import BetHistoryPage from './pages/BetHistoryPage';
import LeaderboardPage from './pages/LeaderboardPage';
import PollsPage from './pages/PollsPage';
import AwardsPage from './pages/AwardsPage';
import OfficeDashboard from './pages/OfficeDashboard';
import WorldCupPage from './pages/WorldCupPage';

// ─── Layout avec Navbar + listener de matchs ───
function AppLayout({ children }: { children: React.ReactNode }) {
  useMatchListener();
  useMatchReminderListener();
  useLeaderboardListener();
  useDundieListener();
  return (
    <div className="min-h-screen bg-office-paper">
      <Navbar />
      <main className="pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}

// ─── Overlay global (toasts + confetti) ───
function GlobalOverlay() {
  const { showVictory } = useNotifications();
  return (
    <>
      <ToastContainer />
      <Confetti active={showVictory} />
    </>
  );
}

function AppRoutes() {
  return (
    <>
      <GlobalOverlay />
      <Routes>
        {/* ─── Routes publiques (auth) ─── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ─── Routes semi-protégées (connecté, pas besoin d'office) ─── */}
        <Route path="/office/join" element={
          <ProtectedRoute>
            <JoinOfficePage />
          </ProtectedRoute>
        } />
        <Route path="/office/create" element={
          <ProtectedRoute>
            <CreateOfficePage />
          </ProtectedRoute>
        } />

        {/* ─── Routes protégées (connecté + office requis) ─── */}
        <Route path="/" element={
          <ProtectedRoute requireOffice>
            <AppLayout><Dashboard /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/matches" element={
          <ProtectedRoute requireOffice>
            <AppLayout><MatchesPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/bets" element={
          <ProtectedRoute requireOffice>
            <AppLayout><BetHistoryPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/worldcup" element={
          <ProtectedRoute requireOffice>
            <AppLayout><WorldCupPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/leaderboard" element={
          <ProtectedRoute requireOffice>
            <AppLayout><LeaderboardPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/polls" element={
          <ProtectedRoute requireOffice>
            <AppLayout><PollsPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/awards" element={
          <ProtectedRoute requireOffice>
            <AppLayout><AwardsPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/office" element={
          <ProtectedRoute requireOffice>
            <AppLayout><OfficeDashboard /></AppLayout>
          </ProtectedRoute>
        } />

        {/* ─── Catch-all ─── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppRoutes />
      </NotificationProvider>
    </AuthProvider>
  );
}
