import React, { useState } from 'react';
import axios from 'axios';
import { useToast } from './ToastContainer';
import './ReviewModal.css';

const ReviewModal = ({ isOpen, onClose, sellerId, sellerName, auctionId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const token = localStorage.getItem('token');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        'http://localhost:5000/api/reviews/add',
        {
          sellerId,
          rating,
          comment,
          auctionId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Review submitted successfully! ⭐');
      if (onReviewSubmitted) onReviewSubmitted();
      onClose();
      setRating(0);
      setComment('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
    setSubmitting(false);
  };

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="review-modal-close" onClick={onClose}>✕</button>
        
        <div className="review-modal-header">
          <h2>Rate Your Experience</h2>
          <p>Share your feedback about {sellerName}</p>
        </div>

        <form onSubmit={handleSubmit} className="review-form">
          <div className="rating-section">
            <label>Your Rating:</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="rating-text">
              {rating === 0 && 'Select a rating'}
              {rating === 1 && '⭐ Poor'}
              {rating === 2 && '⭐⭐ Fair'}
              {rating === 3 && '⭐⭐⭐ Good'}
              {rating === 4 && '⭐⭐⭐⭐ Very Good'}
              {rating === 5 && '⭐⭐⭐⭐⭐ Excellent'}
            </p>
          </div>

          <div className="comment-section">
            <label>Your Review (Optional):</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this seller..."
              rows="4"
            />
          </div>

          <div className="review-modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={submitting || rating === 0}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
