import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Intro from './components/Intro'
import Home from './routes/Home'
import Login from './routes/Login'
import Signup from './routes/Signup'
import Onboarding from './routes/Onboarding'
import Bottle from './routes/Bottle'
import Friends from './routes/Friends'
import Share from './routes/Share'

export default function App() {
  return (
    <>
      <Intro />
      <Routes>
        {/* Public: landing page for logged-out visitors, shelf for logged-in ones */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/share/:token" element={<Share />} />

        {/* Requires sign-in: viewing/adding to a bottle, friends, onboarding */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/b/:id" element={<Bottle />} />
          <Route path="/friends" element={<Friends />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
