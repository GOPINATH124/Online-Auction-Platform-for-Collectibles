import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Countdown from "./CountdownTimer";
import axios from "axios";
import { useToast } from "./ToastContainer";
import { BASE_URL } from "../config/apiConfig";
import './AuctionCard.css';

const AuctionCard = ({ auction, refreshAuctions }) => {
  const [bidAmount, setBidAmount] = useState("");
  const [currentBid, setCurrentBid] = useState(auction.currentBid);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const isSeller = localStorage.getItem("isSeller") === "true";

  // Handle bid submission
  const handleBid = async () => {
    if (!bidAmount || bidAmount <= currentBid) {
      toast.warning(`Bid must be higher than current bid: $${currentBid}`);
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `${BASE_URL}/bids/${auction._id}/bid`,
        { amount: bidAmount, userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Bid placed successfully! 🎉");
      setCurrentBid(res.data.auction.currentBid);
      setBidAmount("");
      refreshAuctions();
    } catch (err) {
      console.log(err);
      toast.error(err.response?.data?.message || "Error placing bid");
    } finally {
      setLoading(false);
    }
  };

  const isAuctionEnded = new Date() > new Date(auction.endTime);

  return (
    <div className={`auction-card ${isAuctionEnded ? 'ended' : ''}`}>
      <div className="card-header">
        <div className="card-status">
          {isAuctionEnded ? (
            <span className="status-badge ended">Ended</span>
          ) : (
            <span className="status-badge active">Active</span>
          )}
        </div>
        {isSeller && (
          <div className="seller-badge">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Your Auction
          </div>
        )}
      </div>

      <div className="card-body" onClick={() => navigate(`/auction/${auction._id}`)} style={{cursor: 'pointer'}}>
        <h3 className="auction-title">{auction.title}</h3>
        <p className="auction-description">{auction.description}</p>

        <div className="auction-info">
          <div className="info-item">
            <div className="info-icon">💰</div>
            <div className="info-content">
              <span className="info-label">Current Bid</span>
              <span className="info-value">${currentBid}</span>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon">⏰</div>
            <div className="info-content">
              <span className="info-label">Time Remaining</span>
              <span className="info-value">
                <Countdown endTime={auction.endTime} />
              </span>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon">👥</div>
            <div className="info-content">
              <span className="info-label">Total Bids</span>
              <span className="info-value">{auction.bids?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card-footer">
        {isAuctionEnded ? (
          <div className="ended-message">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Auction has ended
          </div>
        ) : !isSeller ? (
          <div className="bid-section">
            <div className="bid-input-wrapper">
              <span className="currency">$</span>
              <input
                type="number"
                placeholder={`Min: ${Number(currentBid) + 1}`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="bid-input"
                min={Number(currentBid) + 1}
              />
            </div>
            <button 
              onClick={handleBid} 
              className={`bid-button ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Placing...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                  </svg>
                  Place Bid
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="seller-message">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            You cannot bid on your own auction
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionCard;
