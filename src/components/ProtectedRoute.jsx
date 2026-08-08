import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSession } from '../context/SessionProvider'

export default function ProtectedRoute() {
  const { session, loading, needsOnboarding } = useSession()
  const location = useLocation()

  if (loading) return <FullScreenLoader />
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />
  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }
  return <Outlet />
}

export function FullScreenLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#F4F3F0] text-[#94918B] font-mono text-xs uppercase tracking-widest">
      loading…
    </div>
  )
}
