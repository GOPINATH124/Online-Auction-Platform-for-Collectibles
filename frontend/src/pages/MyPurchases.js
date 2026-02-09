import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../componets/ToastContainer";
import { generateInvoice, generateReceipt } from "../utils/invoiceGenerator";
import ReviewModal from "../componets/ReviewModal";
import "./MyPurchases.css";

function MyPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, paid, unpaid
  const [reviewModal, setReviewModal] = useState({ isOpen: false, sellerId: null, sellerName: '', auctionId: null });
  const navigate = useNavigate();
  const toast = useToast();

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchPurchases();
  }, [token, navigate]);

  const fetchPurchases = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/auctions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filter auctions where user is the winner and auction has ended
      const wonAuctions = res.data.filter((auction) => {
        const hasEnded = new Date(auction.endTime) <= new Date();
        const isWinner = auction.winner === userId;
        return hasEnded && isWinner;
      });

      setPurchases(wonAuctions);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      toast.error("Failed to load purchases");
      setLoading(false);
    }
  };

  const getFilteredPurchases = () => {
    switch (filter) {
      case "paid":
        return purchases.filter((p) => p.isPaid);
      case "unpaid":
        return purchases.filter((p) => !p.isPaid);
      default:
        return purchases;
    }
  };

  const calculateTotalSpent = () => {
    return purchases
      .filter((p) => p.isPaid)
      .reduce((sum, p) => sum + p.currentBid, 0);
  };

  const calculatePendingPayments = () => {
    return purchases
      .filter((p) => !p.isPaid)
      .reduce((sum, p) => sum + p.currentBid, 0);
  };

  const openReviewModal = (sellerId, sellerName, auctionId) => {
    setReviewModal({ isOpen: true, sellerId, sellerName, auctionId });
  };

  const closeReviewModal = () => {
    setReviewModal({ isOpen: false, sellerId: null, sellerName: '', auctionId: null });
  };

  // Calculate time remaining for payment (1 hour from auction end)
  // For transferred auctions, no timer shown
  const getPaymentTimeRemaining = (endTime, transferredToSecondBidder) => {
    // If transferred to 2nd bidder, show no countdown
    if (transferredToSecondBidder) {
      return { 
        expired: false, 
        text: 'Payment Required Now', 
        urgent: true,
        isSecondChance: true
      };
    }

    const auctionEnd = new Date(endTime);
    const paymentDeadline = new Date(auctionEnd.getTime() + 60 * 60 * 1000); // 1 hour
    const now = new Date();
    const timeLeft = paymentDeadline - now;

    if (timeLeft <= 0) {
      return { expired: true, text: 'Deadline Expired - Transferring...', urgent: true };
    }

    const minutes = Math.floor(timeLeft / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return { expired: false, text: `${hours}h ${mins}m remaining`, urgent: hours < 1 };
    }
    return { expired: false, text: `${mins}m remaining`, urgent: true };
  };

  if (loading) {
    return (
      <div className="purchases-loading">
        <div className="loading-spinner"></div>
        <p>Loading your purchases...</p>
      </div>
    );
  }

  const filteredPurchases = getFilteredPurchases();
  const totalSpent = calculateTotalSpent();
  const pendingPayments = calculatePendingPayments();

  return (
    <div className="purchases-wrapper">
      <div className="purchases-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="purchases-container">
        <button onClick={() => navigate("/dashboard")} className="back-btn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          Back
        </button>

        <div className="purchases-header">
          <div className="header-icon">🛍️</div>
          <h1 className="purchases-title">My Purchases</h1>
          <p className="purchases-subtitle">
            All auctions you've won and completed
          </p>
        </div>

        {/* Summary Cards */}
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon" style={{ background: '#43e97b' }}>
              ✅
            </div>
            <div className="summary-content">
              <div className="summary-label">Total Purchased</div>
              <div className="summary-value">{purchases.length}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon" style={{ background: '#4facfe' }}>
              💳
            </div>
            <div className="summary-content">
              <div className="summary-label">Total Spent</div>
              <div className="summary-value">${totalSpent}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon" style={{ background: '#f093fb' }}>
              ⏳
            </div>
            <div className="summary-content">
              <div className="summary-label">Pending Payments</div>
              <div className="summary-value">${pendingPayments}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon" style={{ background: '#667eea' }}>
              📦
            </div>
            <div className="summary-content">
              <div className="summary-label">Paid Items</div>
              <div className="summary-value">{purchases.filter(p => p.isPaid).length}</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Purchases
            <span className="tab-count">{purchases.length}</span>
          </button>
          <button
            className={`filter-tab ${filter === "paid" ? "active" : ""}`}
            onClick={() => setFilter("paid")}
          >
            Paid
            <span className="tab-count">
              {purchases.filter((p) => p.isPaid).length}
            </span>
          </button>
          <button
            className={`filter-tab ${filter === "unpaid" ? "active" : ""}`}
            onClick={() => setFilter("unpaid")}
          >
            Pending Payment
            <span className="tab-count">
              {purchases.filter((p) => !p.isPaid).length}
            </span>
          </button>
        </div>

        {/* Purchases List */}
        {filteredPurchases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎁</div>
            <h3>No purchases found</h3>
            <p>
              {filter === "all"
                ? "You haven't won any auctions yet. Start bidding!"
                : filter === "paid"
                ? "No paid purchases yet"
                : "No pending payments"}
            </p>
            <button
              className="browse-btn"
              onClick={() => navigate("/auctions")}
            >
              Browse Auctions
            </button>
          </div>
        ) : (
          <div className="purchases-list">
            {filteredPurchases.map((purchase, index) => (
              <div
                key={purchase._id}
                className={`purchase-card ${purchase.isPaid ? "paid" : "unpaid"}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="purchase-header">
                  <div className="purchase-status">
                    {purchase.isPaid ? (
                      <span className="status-badge paid">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        Paid
                      </span>
                    ) : (
                      <span className="status-badge unpaid">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                        </svg>
                        Payment Pending
                      </span>
                    )}
                  </div>
                  <div className="purchase-date">
                    {new Date(purchase.endTime).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>

                <div className="purchase-body">
                  <h3 className="product-name">{purchase.title}</h3>
                  <p className="product-description">{purchase.description}</p>

                  <div className="purchase-details">
                    <div className="detail-row">
                      <span className="detail-label">Product:</span>
                      <span className="detail-value">{purchase.title}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Winning Bid:</span>
                      <span className="detail-value price">${purchase.currentBid}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Total Bids:</span>
                      <span className="detail-value">{purchase.bids.length}</span>
                    </div>
                    
                    {/* Payment Deadline Timer */}
                    {!purchase.isPaid && (
                      <div className="detail-row">
                        <span className="detail-label">
                          {purchase.transferredToSecondBidder ? '⚡' : '⏰'} Payment Deadline:
                        </span>
                        <span className={`detail-value ${getPaymentTimeRemaining(purchase.endTime, purchase.transferredToSecondBidder).urgent ? 'urgent-timer' : ''} ${getPaymentTimeRemaining(purchase.endTime, purchase.transferredToSecondBidder).expired ? 'expired-timer' : ''} ${purchase.transferredToSecondBidder ? 'second-chance' : ''}`}>
                          {getPaymentTimeRemaining(purchase.endTime, purchase.transferredToSecondBidder).text}
                        </span>
                      </div>
                    )}
                    
                    <div className="detail-row">
                      <span className="detail-label">Auction Ended:</span>
                      <span className="detail-value">
                        {new Date(purchase.endTime).toLocaleString()}
                      </span>
                    </div>
                    <div className="detail-row highlight">
                      <span className="detail-label">Amount Paid:</span>
                      <span className="detail-value amount">
                        ${purchase.isPaid ? purchase.currentBid : "0"} / ${purchase.currentBid}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="purchase-footer">
                  {!purchase.isPaid ? (
                    <button
                      className="action-btn pay-now"
                      onClick={() => navigate(`/payment/${purchase._id}`)}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                      </svg>
                      Complete Payment
                    </button>
                  ) : (
                    <div className="paid-actions">
                      <div className="paid-info">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        <span>Payment Completed</span>
                      </div>
                      <div className="download-buttons">
                        <button
                          className="action-btn download-invoice"
                          onClick={() => generateInvoice(
                            purchase,
                            purchase.paymentDetails?.transactionId || `INV${Date.now()}`,
                            purchase.paymentDetails || {
                              method: 'Direct Payment',
                              paidAt: new Date(),
                              amount: purchase.currentBid
                            }
                          )}
                        >
                          📄 Download Invoice
                        </button>
                        <button
                          className="action-btn download-receipt"
                          onClick={() => generateReceipt(
                            purchase,
                            purchase.paymentDetails?.transactionId || `REC${Date.now()}`,
                            purchase.paymentDetails || {
                              method: 'Direct Payment',
                              paidAt: new Date(),
                              amount: purchase.currentBid
                            }
                          )}
                        >
                          🧾 Download Receipt
                        </button>
                        <button
                          className="action-btn review-seller"
                          onClick={() => openReviewModal(purchase.seller, 'Seller', purchase._id)}
                        >
                          ⭐ Rate Seller
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={closeReviewModal}
        sellerId={reviewModal.sellerId}
        sellerName={reviewModal.sellerName}
        auctionId={reviewModal.auctionId}
        onReviewSubmitted={fetchPurchases}
      />
    </div>
  );
}

export default MyPurchases;
