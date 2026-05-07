import React, { useState } from "react";
import axios from "axios";
axios.defaults.withCredentials = true;
import { useNavigate } from "react-router-dom";
import "./PaymentForm.css";
import { BACKEND_URL } from "../../config/backend";
import { usePayment } from "../../Context/paymentContext";
import { useToast } from "../../Context/ToastContext";
import { getOrCreateIdempotencyKey } from "../../utils/getorCreateIdempotencyKey";

const PaymentForm = ({ user, amount, currency }) => {
  const [paymentMethod, setPaymentMethod] = useState("mobile_money");
  const [provider, setProvider] = useState("airtel");
  const [mobile, setMobile] = useState("");
  const [bankInstructions, setBankInstructions] = useState(null);
  const navigate = useNavigate();
  const { state, dispatch } = usePayment();
  const { addToast } = useToast();

  const backend = BACKEND_URL;
  const IDEMPOTENCY_STORAGE_KEY = "pendingIdempotencyKey";

  const isLoading =
    state.status === "SUBMITTING" ||
    state.status === "PROCESSING" ||
    state.status === "RECONCILE_PROCESSING";
  const hasPendingPayment =
    state.status === "PROCESSING" || state.status === "CREATED_LOCAL";

  const savePendingTransaction = (key, payload) => {
    try {
      const pendingTransaction = {
        transactionId: key,
        status: "CREATED_LOCAL",
        attempts: 0,
        payload,
        createdAt: Date.now(),
        lastUpdatedAt: Date.now(),
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
    if (paymentMethod === "mobile_money" && (!mobile || mobile.length < 9)) {
      addToast("Enter a valid phone number", "error", 4000);
      return;
    }

    try {
      const idempotencyKey = getOrCreateIdempotencyKey(
        IDEMPOTENCY_STORAGE_KEY,
      );

      const payload = {
        userId: user.id,
        email: user.email,
        name: user.name,
        amount,
        currency,
        mobile: paymentMethod === "mobile_money" ? mobile : undefined,
        provider: paymentMethod === "bank" ? "bank" : provider,
        paymentMethod,
        idempotencyKey,
      };

      savePendingTransaction(idempotencyKey, payload);
      dispatch({ type: "SUBMIT_REQUEST" });

      console.log("Payment payload ->", payload);

      const paymentRes = await axios.post(`${backend}/api/payment/pay`, payload, {
        headers: { "Idempotency-Key": idempotencyKey },
      });

      console.log("Payment Response:", paymentRes.data);

      if (paymentRes.data.bankInstructions) {
        setBankInstructions(paymentRes.data.bankInstructions);
        addToast(paymentRes.data.bankInstructions.message, "info", 7000);
      }

      if (paymentRes.data.paymentId) {
        sessionStorage.setItem("lastPaymentId", paymentRes.data.paymentId);

        try {
          localStorage.removeItem(IDEMPOTENCY_STORAGE_KEY);
        } catch (e) {
          console.error("Failed to clear pending transaction:", e);
        }

        dispatch({
          type: "SUBMIT_SUCCESS",
          paymentId: paymentRes.data.paymentId,
        });

        const redirectDelay = paymentRes.data.bankInstructions ? 5000 : 1500;

        setTimeout(() => {
          navigate(`/payment-success/${paymentRes.data.paymentId}`);
        }, redirectDelay);
      }
    } catch (error) {
      console.error("Payment error:", error);
      dispatch({
        type: "SUBMIT_FAILURE",
        error: error.message || "Payment failed. Try again.",
      });
    }
  };

  return (
    <>
      <div className="payment-box">
        <h3>Select Payment Method</h3>

        <div className="providers">
          <label>
            <input
              type="radio"
              value="mobile_money"
              checked={paymentMethod === "mobile_money"}
              onChange={() => {
                setPaymentMethod("mobile_money");
                setBankInstructions(null);
              }}
            />
            Mobile Money
          </label>

          <label>
            <input
              type="radio"
              value="bank"
              checked={paymentMethod === "bank"}
              onChange={() => setPaymentMethod("bank")}
            />
            Pay through bank
          </label>
        </div>

        {paymentMethod === "mobile_money" && (
          <>
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
          </>
        )}

        {bankInstructions && (
          <div className="bank-instructions">
            <p>{bankInstructions.message}</p>
            <span>Account name: {bankInstructions.accountName}</span>
          </div>
        )}

        <button
          className="pay-btn"
          onClick={handlePay}
          disabled={isLoading || hasPendingPayment}
        >
          {isLoading
            ? "Processing..."
            : hasPendingPayment
              ? "Payment Pending..."
              : paymentMethod === "bank"
                ? "Pay Through Bank"
                : "Pay Now"}
        </button>
      </div>
    </>
  );
};

export default PaymentForm;
