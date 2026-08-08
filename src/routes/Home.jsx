import { Navigate } from 'react-router-dom'
import { useSession } from '../context/SessionProvider'
import { FullScreenLoader } from '../components/ProtectedRoute'
import Landing from './Landing'
import Shelf from './Shelf'

// "/" is public: logged-out visitors see the landing page, logged-in users
// see their shelf. Only actions that need an identity (adding a bottle,
// writing a story, tagging) push toward sign-in — not the page itself.
export default function Home() {
  const { session, loading, needsOnboarding } = useSession()

  if (loading) return <FullScreenLoader />
  if (!session) return <Landing />
  if (needsOnboarding) return <Navigate to="/onboarding" replace />
  return <Shelf />
}
