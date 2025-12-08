import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PaymentSuccess.css";
import { BACKEND_URL } from "../../config/backend";

const PaymentSuccess = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [waiting, setWaiting] = useState(true);
  const latestChargeIdRef = useRef(null);
  const backupTriggeredRef = useRef(false);

  useEffect(() => {
    let interval;
    let timeout;

      const fetchPaymentDetails = async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/payment/payment-processing/${paymentId}`,
          {
            credentials: "include", // <--- REQUIRED
          }
        );
        const data = await res.json();

        if (data.success) {
          setPayment(data.payment);
          if (data.payment?.chargeId) {
            latestChargeIdRef.current = data.payment.chargeId;
          }

          // If webhook updated the payment, stop polling
          if (
            data.payment.status === "success" ||
            data.payment.status === "completed"
          ) {
            setWaiting(false);
            clearInterval(interval);
            clearTimeout(timeout);
          }
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (paymentId) {
      fetchPaymentDetails();

      // Start polling every 3 seconds
      interval = setInterval(fetchPaymentDetails, 3000);

      // 🛑 After 30 seconds, fallback to manual confirmation
      timeout = setTimeout(async () => {
        if (backupTriggeredRef.current) {
          return;
        }
        backupTriggeredRef.current = true;
        console.log("Webhook did not arrive. Running backup confirmation...");

        try {
          // Use the provider charge ID (payment.chargeId) — server expects chargeId,
          // not the MongoDB paymentId. Stored in ref so we have the latest value.
          const providerChargeId = latestChargeIdRef.current;

          if (!providerChargeId) {
            console.warn(
              "No provider chargeId available for backup confirmation"
            );
            setError(
              "We could not confirm your payment automatically. Please contact support."
            );
            return;
          }

          const res = await fetch(
            `${BACKEND_URL}/api/confirm/backup-confirm`,
            {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chargeId: providerChargeId,
              }),
            }
          );

          const backup = await res.json();

          if (backup.success) {
            console.log("Backup verified payment:", backup.payment);
            setPayment(backup.payment);
            
            // Only stop waiting if payment is actually successful
            if (backup.verifiedStatus === "success" || backup.verifiedStatus === "completed") {
              setWaiting(false);
              clearInterval(interval);
            } else {
              // Payment verification shows it failed
              setError(`Payment verification shows status: ${backup.verifiedStatus || "failed"}. Please contact support if you completed the payment.`);
              setWaiting(false);
              clearInterval(interval);
            }
          } else {
            // Backup verification failed
            setError(backup.message || "Could not verify payment status. Please contact support.");
            setWaiting(false);
            clearInterval(interval);
          }
        } catch (e) {
          console.error("Backup update failed", e);
        }
      }, 30000); // <-- 30 seconds
    }

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [paymentId]);

  // Initial loading
  if (loading) {
    return (
      <div className="payment-success-container">
        <div className="loading">Loading payment details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-success-container">
        <div className="error-box">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate("/cart")}>Back to Cart</button>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="payment-success-container">
        <div className="error-box">
          <h2>No Payment Found</h2>
          <button onClick={() => navigate("/cart")}>Back</button>
        </div>
      </div>
    );
  }

  // Webhook has not confirmed yet, still waiting
  if (waiting) {
    return (
      <div className="payment-success-container">
        <div className="waiting-box">
          <div className="spinner"></div>
          <h2>Waiting for confirmation...</h2>
          <p>We’re finalizing your payment. This may take a few moments.</p>
        </div>
      </div>
    );
  }

  // Success view
  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="payment-success-container">
      <div className="success-card">
        <div className="success-header">
          <div className="success-icon">✓</div>
          <h1>Payment Successful!</h1>
          <p>Your transaction has been confirmed</p>
        </div>

        <div className="payment-details">
          <div className="detail-section">
            <h3>Transaction Details</h3>

            <div className="detail-row">
              <span className="label">Charge ID:</span>
              <span className="value">{payment.chargeId}</span>
            </div>

            <div className="detail-row">
              <span className="label">Amount:</span>
              <span className="value highlight">
                {payment.currency} {payment.amount?.toFixed(2)}
              </span>
            </div>

            <div className="detail-row">
              <span className="label">Status:</span>
              <span className="value success">Success</span>
            </div>

            <div className="detail-row">
              <span className="label">Date:</span>
              <span className="value">{formatDate(payment.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="payment-actions">
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
