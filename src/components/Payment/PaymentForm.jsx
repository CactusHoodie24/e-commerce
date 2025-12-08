import React, { useState } from "react";
import axios from "axios";
axios.defaults.withCredentials = true;
import { useNavigate } from "react-router-dom";
import './PaymentForm.css'
import { BACKEND_URL } from "../../config/backend";

const PaymentForm = ({ user, amount, currency, onSuccess }) => {
  const [provider, setProvider] = useState("airtel");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const backend = BACKEND_URL;

  const handlePay = async () => {
    if (!mobile || mobile.length < 9) {
      alert("Enter a valid phone number");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        userId: user.id,
        email: user.email,
        name: user.name,
        amount,
        currency,
        mobile,
        provider,
      };

      // Log the exact payload sent to the backend for debugging
      console.log('Payment payload ->', payload);

      const paymentRes = await axios.post(`${backend}/api/payment/pay`, payload);

      console.log("Mobile Money Payment Response:", paymentRes.data);

      // Store paymentId in sessionStorage before redirect
      if (paymentRes.data.paymentId) {
        sessionStorage.setItem('lastPaymentId', paymentRes.data.paymentId);
        
        setTimeout(() => {
          navigate(`/payment-success/${paymentRes.data.paymentId}`);
        }, 1500); // Give alert time to display and user time to read
      }

      alert("Payment request sent. Approve the charge on your phone!");

      if (onSuccess) onSuccess(); // Redirect from Cart component

    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
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

      <button className="pay-btn" onClick={handlePay} disabled={loading}>
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
};

export default PaymentForm;
