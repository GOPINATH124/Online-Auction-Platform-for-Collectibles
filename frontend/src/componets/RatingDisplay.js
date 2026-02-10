import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';
import './RatingDisplay.css';

const RatingDisplay = ({ sellerId, showReviews = true }) => {
  const [ratingData, setRatingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchRating();
  }, [sellerId]);

  const fetchRating = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/reviews/seller/${sellerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRatingData(res.data);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  if (loading) return <div className="rating-loading">Loading rating...</div>;
  if (!ratingData) return null;

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<span key={i} className="star filled">★</span>);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<span key={i} className="star half">★</span>);
      } else {
        stars.push(<span key={i} className="star empty">★</span>);
      }
    }
    return stars;
  };

  return (
    <div className="rating-display">
      <div className="rating-summary" onClick={() => !showReviews && navigate(`/seller/${sellerId}/reviews`)} style={{ cursor: !showReviews ? 'pointer' : 'default' }}>
        <div className="rating-score">
          <h2>{ratingData.rating.toFixed(1)}</h2>
          <div className="stars-display">
            {renderStars(ratingData.rating)}
          </div>
          <p className="review-count">
            {ratingData.totalReviews} {ratingData.totalReviews === 1 ? 'review' : 'reviews'}
          </p>
          {!showReviews && ratingData.totalReviews > 0 && (
            <button className="view-all-btn">View All Reviews →</button>
          )}
        </div>
      </div>

      {showReviews && ratingData.reviews && ratingData.reviews.length > 0 && (
        <div className="reviews-list">
          <h3>Customer Reviews</h3>
          {ratingData.reviews.map((review, index) => (
            <div key={index} className="review-item">
              <div className="review-header">
                <div className="reviewer-info">
                  <div className="reviewer-avatar">
                    {review.reviewerName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="reviewer-name">{review.reviewerName || 'Anonymous'}</p>
                    <div className="review-stars">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                </div>
                <span className="review-date">
                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
              {review.comment && (
                <p className="review-comment">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RatingDisplay;

