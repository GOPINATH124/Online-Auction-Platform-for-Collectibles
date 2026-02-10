import React, { useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';
import './ReportModal.css';

function ReportModal({ auctionId, auctionTitle, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const token = localStorage.getItem('token');

  const reportReasons = [
    'Fraudulent listing',
    'Misleading description',
    'Prohibited item',
    'Duplicate listing',
    'Spam',
    'Offensive content',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      alert('Please select a reason for reporting');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/reports/${auctionId}`,
        { reason, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Auction reported successfully. Our team will review it shortly.');
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Error reporting auction');
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🚩 Report Auction</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="auction-info">
            <p><strong>Reporting:</strong> {auctionTitle}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="reason">Reason for reporting:</label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              >
                <option value="">-- Select a reason --</option>
                {reportReasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Additional details (optional):</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="4"
                placeholder="Provide any additional information that might help our review..."
              />
            </div>

            <div className="warning-box">
              <p>⚠️ False reports may result in account penalties. Please only report auctions that violate our policies.</p>
            </div>

            <div className="modal-actions">
              <button
                type="submit"
                className="danger-button"
                disabled={submitting}
              >
                Submit Report
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ReportModal;

