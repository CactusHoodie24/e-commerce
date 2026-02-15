import React, { useState } from "react";
import axios from "axios";
axios.defaults.withCredentials = true;
import { useNavigate } from "react-router-dom";
import "./PaymentForm.css";
import { BACKEND_URL } from "../../config/backend";
import { usePayment } from "../../Context/paymentContext";
import { useToast } from "../../Context/ToastContext";

const PaymentForm = ({ user, amount, currency, onSuccess }) => {
  const [provider, setProvider] = useState("airtel");
  const [mobile, setMobile] = useState("");
  const navigate = useNavigate();
  const { state, dispatch } = usePayment();
  const { addToast } = useToast();

  const backend = BACKEND_URL;

  const IDEMPOTENCY_STORAGE_KEY = "pendingIdempotencyKey";

  // Derive loading and hasPendingPayment from state.status
  const isLoading = state.status === "SUBMITTING" || state.status === "PROCESSING" || state.status === "RECONCILE_PROCESSING";
  const hasPendingPayment = state.status === "PROCESSING" || 
                            state.status === "CREATED_LOCAL" 
                           

  const generateUUID = () => {
    if (
      typeof window !== "undefined" &&
      window.crypto &&
      window.crypto.randomUUID
    ) {
      return window.crypto.randomUUID();
    }

    // fallback UUID v4
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  };

  const getOrCreateIdempotencyKey = () => {
    try {
      const existing = localStorage.getItem(IDEMPOTENCY_STORAGE_KEY);
      if (existing) {
        const parsed = JSON.parse(existing);
        return parsed.key;
      }
      return generateUUID();
    } catch (e) {
      return generateUUID();
    }
  };

  const savePendingTransaction = (key, payload) => {
    try {
      const pendingTransaction = {
        key,
        payload,
        createdAt: Date.now(),
      };
      localStorage.setItem(
        IDEMPOTENCY_STORAGE_KEY,
        JSON.stringify(pendingTransaction),
      );
    } catch (e) {
      console.error("Failed to save pending transaction:", e);
    }
  };

  const handlePay = async () => {
    if (!mobile || mobile.length < 9) {
      addToast("Enter a valid phone number", "error", 4000);
      return;
    }

    try {
     

      // create or reuse an idempotency key for this client-initiated transaction
      const idempotencyKey = getOrCreateIdempotencyKey();
     

      const payload = {
        userId: user.id,
        email: user.email,
        name: user.name,
        amount,
        currency,
        mobile,
        provider,
        idempotencyKey,
      };

      // Save pending transaction to localStorage BEFORE making the request
      savePendingTransaction(idempotencyKey, payload);
      dispatch({ type: "SUBMIT_REQUEST" });

      // Log the exact payload sent to the backend for debugging
      console.log("Payment payload ->", payload);

      const paymentRes = await axios.post(
        `${backend}/api/payment/pay`,
        payload,
        { headers: { "Idempotency-Key": idempotencyKey } },
      );

      console.log("Mobile Money Payment Response:", paymentRes.data);

      // Store paymentId in sessionStorage before redirect
      if (paymentRes.data.paymentId) {
        sessionStorage.setItem("lastPaymentId", paymentRes.data.paymentId);

        // clear the pending idempotency key on successful creation
        try {
          localStorage.removeItem(IDEMPOTENCY_STORAGE_KEY);
        } catch (e) {}

        dispatch({ type: "SUBMIT_SUCCESS", paymentId: paymentRes.data.paymentId });

        setTimeout(() => {
          navigate(`/payment-success/${paymentRes.data.paymentId}`);
        }, 1500); // Give toast time to display and user time to read
      }

      if (onSuccess) onSuccess(); // Redirect from Cart component
    } catch (error) {
      console.error("Payment error:", error);
      dispatch({ type: "SUBMIT_FAILURE", error: error.message || "Payment failed. Try again." });
      // The pending transaction is already saved in localStorage for reconciliation
    }
  };

  return (
    <>
      <div className="payment-box">
        <h3>Select Mobile Money</h3>

        <div className="providers">
          <label>
            <input
              type="radio"
              value="airtel"
              checked={provider === "airtel"}
              onChange={() => setProvider("airtel")}
            />
            Airtel Money
          </label>

          <label>
            <input
              type="radio"
              value="tnm"
              checked={provider === "tnm"}
              onChange={() => setProvider("tnm")}
            />
            TNM Mpamba
          </label>
        </div>

        <input
          type="text"
          className="phone-input"
          placeholder="Enter phone number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />

        <button className="pay-btn" onClick={handlePay} disabled={isLoading || hasPendingPayment}>
          {isLoading ? "Processing..." : hasPendingPayment ? "Payment Pending…" : "Pay Now"}
        </button>
      </div>
    </>
  );
};

export default PaymentForm;
