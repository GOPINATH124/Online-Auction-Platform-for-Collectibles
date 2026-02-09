import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RatingDisplay from '../componets/RatingDisplay';
import './SellerReviews.css';

const SellerReviews = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="seller-reviews-page">
      <div className="reviews-container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Back
        </button>

        <div className="reviews-header">
          <h1>Seller Reviews</h1>
          <p>See what buyers are saying about this seller</p>
        </div>

        <RatingDisplay sellerId={sellerId} showReviews={true} />
      </div>
    </div>
  );
};

export default SellerReviews;
