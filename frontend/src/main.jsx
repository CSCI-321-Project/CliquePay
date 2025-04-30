import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { SecurityProvider } from './context/SecurityContext'

// Make sure this line exists
document.documentElement.classList.add('dark');
if (!import.meta.env.VITE_DEBUG_ENABLED) {
  console.log = () => {};
}
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SecurityProvider>
      <App />
    </SecurityProvider>
  </React.StrictMode>,
)