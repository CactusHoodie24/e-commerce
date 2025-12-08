import React, { useEffect, useState, useContext } from 'react'
import './Transactions.css'
import { StoreContext } from '../../Context/StoreContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
axios.defaults.withCredentials = true;
import { BACKEND_URL } from '../../config/backend'

const Transactions = () => {
  const { user } = useContext(StoreContext);
  const navigate = useNavigate();
  const backend = BACKEND_URL;

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${backend}/api/payment/transactions`);
        
        if (res.data.success) {
          setTransactions(res.data.transactions);
        } else {
          setError(res.data.message || "Failed to load transactions");
        }
      } catch (err) {
        console.error("Transactions fetch error:", err);
        setError(err.response?.data?.message || "Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user, navigate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'completed':
        return 'status-success';
      case 'failed':
        return 'status-failed';
      case 'pending':
        return 'status-pending';
      default:
        return 'status-unknown';
    }
  };

  const getStatusLabel = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="transactions-container">
        <div className="loading">Loading transactions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transactions-container">
        <div className="error-box">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="transactions-container">
      <div className="transactions-header">
        <h1>My Transactions</h1>
        <p className="transactions-count">
          {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}
        </p>
      </div>

      {transactions.length === 0 ? (
        <div className="no-transactions">
          <p>No transactions found.</p>
          <button onClick={() => navigate('/')}>Start Shopping</button>
        </div>
      ) : (
        <div className="transactions-list">
          <div className="transactions-table-header">
            <p>Date</p>
            <p>Charge ID</p>
            <p>Provider</p>
            <p>Amount</p>
            <p>Status</p>
            <p>Action</p>
          </div>

          {transactions.map((transaction) => (
            <div key={transaction.id} className="transaction-item">
              <p className="transaction-date">{formatDate(transaction.createdAt)}</p>
              <p className="transaction-charge-id">{transaction.chargeId || 'N/A'}</p>
              <p className="transaction-provider">
                {transaction.provider ? transaction.provider.toUpperCase() : 'N/A'}
              </p>
              <p className="transaction-amount">
                {transaction.currency || 'MWK'} {transaction.amount?.toFixed(2) || '0.00'}
              </p>
              <p className={`transaction-status ${getStatusClass(transaction.status)}`}>
                {getStatusLabel(transaction.status)}
              </p>
              <button
                className="view-details-btn"
                onClick={() => navigate(`/payment-success/${transaction.id}`)}
              >
                View
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Transactions;

