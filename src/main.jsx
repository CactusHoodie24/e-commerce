import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import StoreContextProvider, { StoreContext } from './Context/StoreContext.jsx'
import PaymentContextProvider from './Context/paymentContext.jsx'
import { ToastProvider } from './Context/ToastContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <StoreContextProvider>
  <PaymentContextProvider>
  <ToastProvider>
  <App />
  </ToastProvider>
  </PaymentContextProvider>
  </StoreContextProvider>
  </BrowserRouter>
    
  
)
