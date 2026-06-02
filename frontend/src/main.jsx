import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { InterviewProvider } from './context/InterviewContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <InterviewProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </InterviewProvider>
    </ThemeProvider>
  </React.StrictMode>
)
