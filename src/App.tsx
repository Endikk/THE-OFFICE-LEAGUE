import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import LoginForm from './components/auth/LoginForm';
import JoinOffice from './components/office/JoinOffice';
import Dashboard from './pages/Dashboard';
import MatchesPage from './pages/MatchesPage';
import LeaderboardPage from './pages/LeaderboardPage';
import PollsPage from './pages/PollsPage';
import AwardsPage from './pages/AwardsPage';
import LoadingSpinner from './components/common/LoadingSpinner';

function AppContent() {
  const { firebaseUser, userData, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!firebaseUser) return <LoginForm />;
  if (!userData?.officeId) return <JoinOffice />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/polls" element={<PollsPage />} />
        <Route path="/awards" element={<AwardsPage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
