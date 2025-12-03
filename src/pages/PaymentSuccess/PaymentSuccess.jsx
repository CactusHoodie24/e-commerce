import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './PaymentSuccess.css'
import { assets } from '../../assets/assets'

const PaymentSuccess = () => {
  const { paymentId } = useParams()
  const navigate = useNavigate()
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        setLoading(true)
        const apiUrl = `http://localhost:5000/api/payment/payment-processing/${paymentId}`
        console.log('Fetching payment details from:', apiUrl)
        
        const response = await fetch(apiUrl)
        
        console.log('Response status:', response.status)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch payment details. Status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('Payment data received:', data)
        
        if (data.success) {
          setPayment(data.payment)
        } else {
          setError(data.message || 'Failed to load payment details')
        }
      } catch (err) {
        console.error('Payment fetch error:', err)
        setError(err.message || 'An error occurred while fetching payment details')
      } finally {
        setLoading(false)
      }
    }

    if (paymentId) {
      console.log('PaymentId from URL params:', paymentId)
      fetchPaymentDetails()
    } else {
      setError('No payment ID found in URL')
      setLoading(false)
    }
  }, [paymentId])

  if (loading) {
    return (
      <div className='payment-success-container'>
        <div className='loading'>Loading payment details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='payment-success-container'>
        <div className='error-box'>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/cart')}>Back to Cart</button>
        </div>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className='payment-success-container'>
        <div className='error-box'>
          <h2>Payment Not Found</h2>
          <p>We couldn't find the payment details for this transaction.</p>
          <button onClick={() => navigate('/cart')}>Back to Cart</button>
        </div>
      </div>
    )
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'success':
      case 'completed':
        return '#28a745'
      case 'pending':
        return '#ffc107'
      case 'failed':
        return '#dc3545'
      default:
        return '#6c757d'
    }
  }

  return (
    <div className='payment-success-container'>
      <div className='success-card'>
        <div className='success-header'>
          <div className='success-icon'>✓</div>
          <h1>Payment Successful!</h1>
          <p>Your transaction has been processed</p>
        </div>

        <div className='payment-details'>
          <div className='detail-section'>
            <h3>Transaction Details</h3>
            
            <div className='detail-row'>
              <span className='label'>Charge ID:</span>
              <span className='value'>{payment.chargeId || 'N/A'}</span>
            </div>

            <div className='detail-row'>
              <span className='label'>Amount:</span>
              <span className='value highlight'>
                {payment.currency} {payment.amount?.toFixed(2) || '0.00'}
              </span>
            </div>

            <div className='detail-row'>
              <span className='label'>Provider:</span>
              <span className='value'>{payment.provider || 'N/A'}</span>
            </div>

            <div className='detail-row'>
              <span className='label'>Status:</span>
              <span 
                className='value status'
                style={{ color: getStatusColor(payment.status) }}
              >
                {payment.status ? payment.status.charAt(0).toUpperCase() + payment.status.slice(1) : 'N/A'}
              </span>
            </div>

            <div className='detail-row'>
              <span className='label'>Transaction Date:</span>
              <span className='value'>{formatDate(payment.createdAt)}</span>
            </div>
          </div>

          {payment.userId && (
            <div className='detail-section'>
              <h3>Customer Information</h3>
              <div className='detail-row'>
                <span className='label'>User ID:</span>
                <span className='value'>
                  {typeof payment.userId === 'object' ? payment.userId._id : payment.userId}
                </span>
              </div>
              {typeof payment.userId === 'object' && payment.userId.name && (
                <div className='detail-row'>
                  <span className='label'>Name:</span>
                  <span className='value'>{payment.userId.name}</span>
                </div>
              )}
              {typeof payment.userId === 'object' && payment.userId.email && (
                <div className='detail-row'>
                  <span className='label'>Email:</span>
                  <span className='value'>{payment.userId.email}</span>
                </div>
              )}
            </div>
          )}

          {payment.cartId && (
            <div className='detail-section'>
              <h3>Order Information</h3>
              <div className='detail-row'>
                <span className='label'>Order ID:</span>
                <span className='value'>
                  {typeof payment.cartId === 'object' ? payment.cartId._id : payment.cartId}
                </span>
              </div>
              {typeof payment.cartId === 'object' && payment.cartId.totalamount && (
                <div className='detail-row'>
                  <span className='label'>Cart Total:</span>
                  <span className='value'>{payment.cartId.currency || 'MWK'} {payment.cartId.totalamount}</span>
                </div>
              )}
              {typeof payment.cartId === 'object' && payment.cartId.status && (
                <div className='detail-row'>
                  <span className='label'>Cart Status:</span>
                  <span className='value'>{payment.cartId.status}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className='payment-actions'>
          <button className='btn btn-primary' onClick={() => navigate('/')}>
            Continue Shopping
          </button>
          <button className='btn btn-secondary' onClick={() => navigate('/cart')}>
            View Cart
          </button>
        </div>

        <div className='payment-footer'>
          <p>A confirmation email has been sent to your registered email address.</p>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccess
