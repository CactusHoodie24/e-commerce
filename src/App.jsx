import React, { useState, useEffect, useRef } from 'react'
import Navbar from './components/Navbar/Navbar'
import { Route, Routes, useNavigate } from 'react-router-dom'
import Home from './pages/Home/Home'
import Placeorder from './pages/Placeorder/Placeorder'
import Cart from './pages/Cart/Cart'
import PaymentSuccess from './pages/PaymentSuccess/PaymentSuccess'
import Transactions from './pages/Transactions/Transactions'
import Footer from './components/Footer/Footer'
import LoginPopup from './components/LoginPopup/LoginPopup'
import ToastContainer from './components/Toast/ToastContainer'
import axios from 'axios'
import { BACKEND_URL } from './config/backend'
import { usePayment } from './Context/paymentContext'
import { useToast } from './Context/ToastContext'
axios.defaults.withCredentials = true

const App = () => {
  const [showLogin,setShowLogin] = useState(false)
  const navigate = useNavigate()
  const backend = BACKEND_URL
  const IDEMPOTENCY_STORAGE_KEY = "pendingIdempotencyKey"
  const { state, dispatch } = usePayment();
  const { toasts, addToast, removeToast } = useToast();
  const prevStatusRef = useRef(state.status)

  // Watch payment state changes and show toasts
  useEffect(() => {
    const prevStatus = prevStatusRef.current
    const currentStatus = state.status

    // Only show toast if status actually changed
    if (prevStatus !== currentStatus) {
      switch (currentStatus) {
        case 'RECONCILE_PROCESSING':
        case 'PROCESSING':
          addToast('Checking transaction status...', 'processing', 3000)
          break
        case 'SUBMITTING':
          addToast('Submitting payment request...', 'info', 3000)
          break
        case 'SUCCESS':
          addToast('Payment successful! Redirecting...', 'success', 3000)
          break
        case 'FAILED':
          addToast(
            state.error || 'Payment failed. Please try again.',
            'error',
            6000
          )
          break
        case 'EXPIRED':
          addToast(
            'Transaction could not be completed. Please try again.',
            'error',
            6000
          )
          break
        default:
          break
      }
    }

    prevStatusRef.current = currentStatus
  }, [state.status, state.error, addToast])

  // Reconciliation logic - runs immediately on app load
  useEffect(() => {
    async function reconcile() {
      const pendingKeyString = localStorage.getItem(IDEMPOTENCY_STORAGE_KEY)
      if (!pendingKeyString) return
      dispatch({ type: "RECONCILE_PROCESSING" });
      try {
        // Parse the stored transaction object
        const pendingTransaction = JSON.parse(pendingKeyString)
        const { key, payload, attemptCount = 0 } = pendingTransaction

        if (!key) {
          console.error("Invalid pending transaction format")
          localStorage.removeItem(IDEMPOTENCY_STORAGE_KEY)
          dispatch({ type: "RECONCILE_FAILURE", error: "Invalid pending transaction format" });
          return
        }

        // Check payment status using the key
        const response = await axios.get(
          `${backend}/api/payment/status?key=${key}`,
        )
        const status = response.data.status

        if (status === "SUCCESS") {
          dispatch({ type: "RECONCILE_SUCCESS", paymentId: response.data.paymentId });
          localStorage.removeItem(IDEMPOTENCY_STORAGE_KEY)
          navigate(`/payment-success/${response.data.paymentId}`)
        } else if (status === "NOT_FOUND") {
          // Retry payment logic
          if (attemptCount >= 3) {
            localStorage.removeItem(IDEMPOTENCY_STORAGE_KEY)
            dispatch({
              type: "EXPIRE"
            });            
            return
          }

          const updatedTransaction = {
            ...pendingTransaction,
            attemptCount: attemptCount + 1,
          }
          localStorage.setItem(
            IDEMPOTENCY_STORAGE_KEY,
            JSON.stringify(updatedTransaction),
          )
          dispatch({ type: "SUBMIT_REQUEST" });
          try {
            const paymentRes = await axios.post(
              `${backend}/api/payment/pay`,
              payload,
              { headers: { "Idempotency-Key": key } },
            )

            if (paymentRes.data.paymentId) {
              console.log(
                "Retry successful, waiting for reconciliation",
                paymentRes.data.paymentId,
              )
            }

            dispatch({ type: "SUBMIT_SUCCESS", paymentId: paymentRes.data.paymentId });
            addToast("Retrying your transaction. Approve the charge on your phone!", "info", 5000);
          } catch (error) {
            console.error("Retry failed:", error)
            dispatch({ type: "SUBMIT_FAILURE", error: error.message || "Retry failed. Please check your payment status or try again later." });
            // Keep the key for next retry attempt
          }
        } else {
          // Status is PENDING or PROCESSING
          addToast(
            "Your transaction is still being processed. Please check back later.",
            "info",
            5000
          )
          // Keep the key for next reconciliation
        }
      } catch (error) {
        console.error("Error checking payment status:", error)
        // Don't remove the key on error - keep it for retry on next app load
        // Network errors or server errors should not cause us to lose the transaction
        if (error.response?.status === 404) {
          // Key not found on server - might need retry
          console.log("Payment status check returned 404, keeping key for retry")
        } else if (error.code === "ERR_NETWORK" || !error.response) {
          // Network error - definitely keep the key
          console.log("Network error during reconciliation, keeping key")
        }
      }
    }
    reconcile()
  }, [backend, navigate, dispatch, addToast])
  return (
    <>
    {showLogin?<LoginPopup setShowLogin={setShowLogin}/>:<></>}
    <ToastContainer toasts={toasts} removeToast={removeToast} />
<div className='app'>
      <Navbar setShowLogin={setShowLogin} />
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/cart' element={<Cart/>} />
        <Route path='/placeorder' element={<Placeorder/>} />
        <Route path='/payment-success/:paymentId' element={<PaymentSuccess/>} />
        <Route path='/transactions' element={<Transactions/>} />
      </Routes>
    </div>
    <Footer />
    </> 
  )
}

export default App