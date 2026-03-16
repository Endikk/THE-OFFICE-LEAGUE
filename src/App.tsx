import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navbar from './components/layout/Navbar';

// Pages publiques (auth)
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Pages semi-protégées (connecté mais pas d'office)
import JoinOfficePage from './pages/JoinOfficePage';
import CreateOfficePage from './pages/CreateOfficePage';

// Pages protégées (connecté + office)
import Dashboard from './pages/Dashboard';
import MatchesPage from './pages/MatchesPage';
import LeaderboardPage from './pages/LeaderboardPage';
import PollsPage from './pages/PollsPage';
import AwardsPage from './pages/AwardsPage';
import OfficeDashboard from './pages/OfficeDashboard';

function AppRoutes() {
  return (
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
          <div className="min-h-screen bg-office-paper">
            <Navbar />
            <Dashboard />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/matches" element={
        <ProtectedRoute requireOffice>
          <div className="min-h-screen bg-office-paper">
            <Navbar />
            <MatchesPage />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/leaderboard" element={
        <ProtectedRoute requireOffice>
          <div className="min-h-screen bg-office-paper">
            <Navbar />
            <LeaderboardPage />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/polls" element={
        <ProtectedRoute requireOffice>
          <div className="min-h-screen bg-office-paper">
            <Navbar />
            <PollsPage />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/awards" element={
        <ProtectedRoute requireOffice>
          <div className="min-h-screen bg-office-paper">
            <Navbar />
            <AwardsPage />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/office" element={
        <ProtectedRoute requireOffice>
          <div className="min-h-screen bg-office-paper">
            <Navbar />
            <OfficeDashboard />
          </div>
        </ProtectedRoute>
      } />

      {/* ─── Catch-all ─── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
