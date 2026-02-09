import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../componets/ToastContainer";
import { useSocket } from "../componets/SocketContext";
import { QRCodeSVG } from "qrcode.react";
import "./Payment.css";

const Payment = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { socket } = useSocket();

  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("qr"); // 'qr' or 'card'
  const [showQR, setShowQR] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  // Real-time payment notifications
  useEffect(() => {
    if (socket) {
      socket.on('payment-confirmed', (data) => {
        if (data.auctionId === auctionId) {
          toast.success('🎉 ' + data.message);
          setTimeout(() => navigate('/my-purchases'), 2000);
        }
      });

      socket.on('payment-received', (data) => {
        if (data.auctionId === auctionId) {
          toast.success(`💰 Payment received: $${data.amount}`);
        }
      });

      socket.on('payment-refunded', (data) => {
        if (data.auctionId === auctionId) {
          toast.info('🔄 ' + data.message);
        }
      });

      return () => {
        if (socket) {
          socket.off('payment-confirmed');
          socket.off('payment-received');
          socket.off('payment-refunded');
        }
      };
    }
  }, [socket, auctionId, navigate, toast]);

  // Fetch auction details
  const fetchAuction = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/auctions/${auctionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuction(res.data);
      setLoading(false);
    } catch (err) {
      console.log(err);
      toast.error("Error fetching auction details");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchAuction();
  }, [auctionId, token]);

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate payment time remaining (1 hour from auction end)
  // For transferred auctions, show no timer - they must pay immediately
  const getPaymentTimeRemaining = (endTime, transferredToSecondBidder) => {
    // If this was transferred to 2nd bidder, no timer - must pay now
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
    const now = currentTime;
    const timeLeft = paymentDeadline - now;

    if (timeLeft <= 0) {
      // Calculate how long ago the deadline passed
      const overdue = Math.abs(timeLeft);
      const overdueMinutes = Math.floor(overdue / (1000 * 60));
      const overdueHours = Math.floor(overdueMinutes / 60);
      const overdueMins = overdueMinutes % 60;
      
      return { 
        expired: true, 
        text: 'Deadline Expired - Transferring...', 
        urgent: true,
        deadlineTime: paymentDeadline.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric', 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
        expiredAgo: overdueHours > 0 ? `${overdueHours}h ${overdueMins}m ago` : `${overdueMins}m ago`
      };
    }

    const minutes = Math.floor(timeLeft / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const secs = Math.floor((timeLeft % (1000 * 60)) / 1000);

    if (hours > 0) {
      return { expired: false, text: `${hours}h ${mins}m ${secs}s remaining`, urgent: hours < 1 };
    }
    return { expired: false, text: `${mins}m ${secs}s remaining`, urgent: true };
  };

  const handlePayment = async () => {
    setShowConfirmDialog(false);
    setProcessing(true);
    
    // Simulate payment processing time
    setTimeout(async () => {
      try {
        const res = await axios.post(
          `http://localhost:5000/api/auctions/${auctionId}/pay`,
          { method: paymentMethod === "qr" ? "QR Code" : "Direct Payment" },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success(`Payment successful! 🎉💳\nTransaction ID: ${res.data.transactionId}`);
        setTimeout(() => navigate("/my-purchases"), 2000);
      } catch (err) {
        console.log(err);
        toast.error(err.response?.data?.message || "Payment failed");
        setProcessing(false);
      }
    }, 2000);
  };

  const openConfirmDialog = () => {
    setShowConfirmDialog(true);
  };

  const closeConfirmDialog = () => {
    setShowConfirmDialog(false);
  };

  if (loading) {
    return (
      <div className="payment-loading">
        <div className="loading-spinner"></div>
        <p>Loading payment details...</p>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="payment-error">
        <h2>❌ Auction Not Found</h2>
        <button onClick={() => navigate("/auctions")}>Back to Auctions</button>
      </div>
    );
  }

  const isAuctionEnded = new Date() > new Date(auction.endTime);
  // Convert both to strings for comparison and trim any whitespace
  const isWinner = auction.winner && userId && 
    auction.winner.toString().trim().toLowerCase() === userId.toString().trim().toLowerCase();
  
  console.log("=== PAYMENT PAGE DEBUG ===");
  console.log("Auction ID:", auctionId);
  console.log("Auction Title:", auction.title);
  console.log("Auction Winner (raw):", auction.winner);
  console.log("Auction Winner (type):", typeof auction.winner);
  console.log("Auction Winner (trimmed):", auction.winner?.toString().trim());
  console.log("Current UserId (raw):", userId);
  console.log("Current UserId (type):", typeof userId);
  console.log("Current UserId (trimmed):", userId?.toString().trim());
  console.log("Winner comparison result:", isWinner);
  console.log("Auction ended?:", isAuctionEnded);
  console.log("Auction isPaid?:", auction.isPaid);
  console.log("========================");

  if (!isAuctionEnded) {
    return (
      <div className="payment-wrapper">
        <div className="payment-card error-card">
          <div className="error-icon">⏳</div>
          <h2>Auction Not Ended</h2>
          <p>This auction is still active. Payment is only available after the auction ends.</p>
          <button className="back-button" onClick={() => navigate("/auctions")}>
            View Auctions
          </button>
        </div>
      </div>
    );
  }

  if (!isWinner) {
    return (
      <div className="payment-wrapper">
        <div className="payment-card error-card">
          <div className="error-icon">🚫</div>
          <h2>Access Denied</h2>
          <p>Only the winner can make payment for this auction.</p>
          <button className="back-button" onClick={() => navigate("/auctions")}>
            Back to Auctions
          </button>
        </div>
      </div>
    );
  }

  if (auction.isPaid) {
    return (
      <div className="payment-wrapper">
        <div className="payment-card success-card">
          <div className="success-icon">✓</div>
          <h2>Payment Completed!</h2>
          <p>Thank you! Your payment has already been processed.</p>
          <button className="back-button" onClick={() => navigate("/watchlist")}>
            Go to Watchlist
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-wrapper">
      <div className="payment-background">
        <div className="payment-orb orb-1"></div>
        <div className="payment-orb orb-2"></div>
      </div>

      <div className="payment-container">
        <button className="back-btn" onClick={() => navigate("/watchlist")}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          Back
        </button>

        <div className="payment-card">
          <div className="payment-header">
            <div className="payment-icon">💳</div>
            <h1>Payment Checkout</h1>
            <p>Scan QR code or pay directly to complete your purchase</p>
          </div>

          {/* Payment Deadline Timer */}
          {auction && (() => {
            const timeInfo = getPaymentTimeRemaining(auction.endTime, auction.transferredToSecondBidder);
            
            if (timeInfo.expired) {
              return (
                <div className="payment-deadline expired">
                  <div className="deadline-icon">⏰</div>
                  <div className="deadline-content">
                    <h3>Payment Deadline Expired</h3>
                    <p className="deadline-warning" style={{ marginBottom: '12px' }}>
                      {timeInfo.text}
                    </p>
                    <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                      <div style={{ marginBottom: '4px' }}>
                        <strong>Deadline was:</strong> {timeInfo.deadlineTime}
                      </div>
                      <div style={{ color: '#d32f2f', fontWeight: '600' }}>
                        <strong>Expired:</strong> {timeInfo.expiredAgo}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            
            // If transferred to 2nd bidder, show special message
            if (timeInfo.isSecondChance) {
              return (
                <div className="payment-deadline urgent">
                  <div className="deadline-icon">⚠️</div>
                  <div className="deadline-content">
                    <h3>Second Chance Winner</h3>
                    <p className="deadline-warning">
                      ⚡ You are the second highest bidder. The original winner missed their payment deadline.
                      Please complete your payment now to secure this item.
                    </p>
                  </div>
                </div>
              );
            }
            
            return (
              <div className={`payment-deadline ${timeInfo.urgent ? 'urgent' : ''}`}>
                <div className="deadline-icon">⏰</div>
                <div className="deadline-content">
                  <h3>Payment Deadline</h3>
                  <div className="deadline-timer">
                    <span className="timer-label">Time Remaining:</span>
                    <span className={`timer-value ${timeInfo.urgent ? 'urgent-pulse' : ''}`}>
                      {timeInfo.text}
                    </span>
                  </div>
                  {timeInfo.urgent && (
                    <p className="deadline-warning">
                      ⚠️ Hurry! Complete payment soon or the auction will be transferred to the next bidder
                    </p>
                  )}
                  {!timeInfo.urgent && (
                    <p className="deadline-info">
                      Complete your payment within 1 hour to secure your purchase
                    </p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Payment Method Tabs */}
          <div className="payment-tabs">
            <button
              className={`tab-button ${paymentMethod === "qr" ? "active" : ""}`}
              onClick={() => setPaymentMethod("qr")}
            >
              <span>📱</span>
              QR Code Payment
            </button>
            <button
              className={`tab-button ${paymentMethod === "card" ? "active" : ""}`}
              onClick={() => setPaymentMethod("card")}
            >
              <span>💳</span>
              Direct Payment
            </button>
          </div>

          <div className="auction-details">
            <h3>Auction Details</h3>
            <div className="detail-item">
              <span className="detail-label">Item:</span>
              <span className="detail-value">{auction.title}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Description:</span>
              <span className="detail-value">{auction.description}</span>
            </div>
            <div className="detail-item highlight">
              <span className="detail-label">Winning Bid:</span>
              <span className="detail-value amount">${auction.currentBid}</span>
            </div>
          </div>

          {/* QR Code Payment Section */}
          {paymentMethod === "qr" && (
            <div className="qr-payment-section">
              <div className="qr-container">
                <h3>Scan to Pay</h3>
                <div className="qr-code-wrapper">
                  {/* Replace with your own QR code image */}
                  <img 
                    src="/gpay-qr.png" 
                    alt="GPay QR Code" 
                    style={{width: '200px', height: '200px', objectFit: 'contain'}}
                    onError={(e) => {
                      // Fallback to generated QR if image not found
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'block';
                    }}
                  />
                  <div style={{display: 'none'}}>
                    <QRCodeSVG
                      value={`upi://pay?pa=gr702597@oksbi&pn=AuctionPlatform&am=${auction.currentBid}&cu=INR&tn=Payment for ${auction.title.substring(0, 30)}`}
                      size={200}
                      level="H"
                      includeMargin={true}
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  </div>
                </div>
                <div className="qr-instructions">
                  <p><strong>📱 How to Pay:</strong></p>
                  <ol>
                    <li>Open your payment app (GPay, PhonePe, Paytm, etc.)</li>
                    <li>Scan this QR code with your camera</li>
                    <li>Confirm the payment amount: <strong>₹{auction.currentBid}</strong></li>
                    <li>Complete the transaction</li>
                  </ol>
                </div>
                <div className="payment-info">
                  <div className="info-item">
                    <span className="info-label">💰 Amount:</span>
                    <span className="info-value">₹{auction.currentBid}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">🆔 Transaction ID:</span>
                    <span className="info-value">{auctionId.substring(0, 12)}...</span>
                  </div>
                </div>
              </div>
              
              {/* I've Paid Button for QR Code Payment */}
              <button
                className="pay-button"
                onClick={openConfirmDialog}
                disabled={processing}
                style={{marginTop: '20px'}}
              >
                {processing ? (
                  <>
                    <div className="spinner"></div>
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    ✅ I've Paid - Confirm Payment
                  </>
                )}
              </button>
            </div>
          )}

          {/* Direct Payment Section */}
          {paymentMethod === "card" && (
            <div className="card-payment-section">
              <div className="payment-summary">
                <div className="summary-row">
                  <span>Auction Amount</span>
                  <span>${auction.currentBid}</span>
                </div>
                <div className="summary-row">
                  <span>Processing Fee</span>
                  <span>$0</span>
                </div>
                <div className="summary-row total">
                  <span>Total Amount</span>
                  <span>${auction.currentBid}</span>
                </div>
              </div>

              <button
                className="pay-button"
                onClick={openConfirmDialog}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <div className="spinner"></div>
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    Proceed to Pay ${auction.currentBid}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Confirmation Dialog */}
          {showConfirmDialog && (
            <div className="confirm-dialog-overlay" onClick={closeConfirmDialog}>
              <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="dialog-header">
                  <h3>⚠️ Confirm Payment</h3>
                  <button className="close-dialog" onClick={closeConfirmDialog}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  </button>
                </div>
                <div className="dialog-body">
                  <div className="confirm-details">
                    <div className="confirm-item">
                      <span className="confirm-label">Product:</span>
                      <span className="confirm-value">{auction.title}</span>
                    </div>
                    <div className="confirm-item">
                      <span className="confirm-label">Amount to Pay:</span>
                      <span className="confirm-value amount">${auction.currentBid}</span>
                    </div>
                    <div className="confirm-item">
                      <span className="confirm-label">Payment Method:</span>
                      <span className="confirm-value">
                        {paymentMethod === "qr" ? "📱 QR Code Payment" : "💳 Direct Payment"}
                      </span>
                    </div>
                  </div>
                  <p className="confirm-warning">
                    ⚠️ Are you sure you want to proceed with this payment? This action cannot be undone.
                  </p>
                </div>
                <div className="dialog-footer">
                  <button className="cancel-button" onClick={closeConfirmDialog}>
                    Cancel
                  </button>
                  <button className="confirm-button" onClick={handlePayment}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    Yes, Confirm Payment
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="payment-security">
            <div className="security-badge">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
              <span>Secure Payment</span>
            </div>
            <div className="security-badge">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </svg>
              <span>256-bit Encryption</span>
            </div>
          </div>

          <p className="payment-note">
            {paymentMethod === "qr" 
              ? "🔒 Scan the QR code with your preferred payment app to complete the transaction securely." 
              : "🔒 This is a demo payment. In production, integrate with Stripe, PayPal, or Razorpay."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Payment;
