import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initSmoothScrolling } from './utils/smoothScroll.ts'

// Initialize smooth scrolling
initSmoothScrolling()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)