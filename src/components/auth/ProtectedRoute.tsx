import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOffice?: boolean;
}

export default function ProtectedRoute({ children, requireOffice = false }: ProtectedRouteProps) {
  const { firebaseUser, userData, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-office-paper flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Pas connecté → login
  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Connecté mais pas d'office → page bureau
  if (requireOffice && !userData?.officeId) {
    return <Navigate to="/office/join" replace />;
  }

  return <>{children}</>;
}
