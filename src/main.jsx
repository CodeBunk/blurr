import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { SessionProvider } from './context/SessionProvider.jsx'
import { ChromeProvider } from './context/ChromeProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ChromeProvider>
        <SessionProvider>
          <App />
        </SessionProvider>
      </ChromeProvider>
    </BrowserRouter>
  </StrictMode>,
)
