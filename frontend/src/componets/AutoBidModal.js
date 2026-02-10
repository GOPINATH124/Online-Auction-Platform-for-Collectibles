import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';
import './AutoBidModal.css';

function AutoBidModal({ auctionId, currentBid, onClose, onSuccess }) {
  const [maxBid, setMaxBid] = useState('');
  const [hasExistingAutoBid, setHasExistingAutoBid] = useState(false);
  const [existingMaxBid, setExistingMaxBid] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAutoBid();
  }, [auctionId]);

  const fetchAutoBid = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/auto-bids/${auctionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.hasAutoBid) {
        setHasExistingAutoBid(true);
        setExistingMaxBid(res.data.autoBid.maxAmount);
        setMaxBid(res.data.autoBid.maxAmount);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching auto-bid:', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const bidAmount = parseFloat(maxBid);

    if (isNaN(bidAmount) || bidAmount <= currentBid) {
      alert(`Maximum bid must be higher than current bid of $${currentBid}`);
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `${BASE_URL}/auto-bids/${auctionId}`,
        { maxAmount: bidAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Error setting auto-bid');
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your auto-bid?')) return;

    setSubmitting(true);
    try {
      await axios.delete(
        `${BASE_URL}/auto-bids/${auctionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Error cancelling auto-bid');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="autobid-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🤖 Auto-Bid Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="info-box">
            <p>
              <strong>How Auto-Bid Works:</strong><br />
              Set your maximum bid, and our system will automatically place bids on your behalf,
              incrementing by $1 each time you're outbid, up to your maximum amount.
            </p>
          </div>

          {hasExistingAutoBid && (
            <div className="existing-autobid">
              <p>✅ You have an active auto-bid of <strong>${existingMaxBid}</strong></p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Current Bid:</label>
              <div className="current-bid-display">${currentBid}</div>
            </div>

            <div className="form-group">
              <label htmlFor="maxBid">Your Maximum Bid:</label>
              <input
                type="number"
                id="maxBid"
                value={maxBid}
                onChange={(e) => setMaxBid(e.target.value)}
                min={currentBid + 1}
                step="1"
                required
                placeholder={`Enter amount higher than $${currentBid}`}
              />
            </div>

            <div className="modal-actions">
              <button 
                type="submit" 
                className="primary-button"
                disabled={submitting}
              >
                {hasExistingAutoBid ? 'Update Auto-Bid' : 'Set Auto-Bid'}
              </button>
              
              {hasExistingAutoBid && (
                <button 
                  type="button" 
                  className="danger-button"
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  Cancel Auto-Bid
                </button>
              )}
              
              <button 
                type="button" 
                className="secondary-button"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AutoBidModal;

