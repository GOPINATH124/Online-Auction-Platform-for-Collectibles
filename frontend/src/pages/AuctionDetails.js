import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../componets/ToastContainer';
import { useSocket } from '../componets/SocketContext';
import RatingDisplay from '../componets/RatingDisplay';
import SocialShare from '../componets/SocialShare';
import AutoBidModal from '../componets/AutoBidModal';
import ReportModal from '../componets/ReportModal';
import ChatModal from '../componets/ChatModal';
import { BASE_URL } from '../config/apiConfig';
import './AuctionDetails.css';

const AuctionDetails = () => {
  const { id } = useParams();
  const [auction, setAuction] = useState(null);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [placingBid, setPlacingBid] = useState(false);
  const [showAutoBidModal, setShowAutoBidModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [reports, setReports] = useState([]);
  const [showReports, setShowReports] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { socket, joinAuction, leaveAuction } = useSocket();
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    fetchAuctionDetails();
    fetchUsers();

    // Join auction room for real-time updates
    if (socket) {
      joinAuction(id);
    }

    return () => {
      if (socket) {
        leaveAuction(id);
      }
    };
  }, [id, socket]);

  // Fetch reports if user is the seller
  useEffect(() => {
    if (auction && auction.seller === userId) {
      fetchReports();
    }
  }, [auction, userId]);

  // Listen for real-time bid updates
  useEffect(() => {
    if (!socket) return;

    const handleNewBid = (data) => {
      if (data.auctionId === id) {
        fetchAuctionDetails();
      }
    };

    socket.on('new-bid', handleNewBid);

    return () => {
      if (socket) {
        socket.off('new-bid', handleNewBid);
      }
    };
  }, [socket, id]);

  const fetchAuctionDetails = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/auctions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuction(res.data);
      setLoading(false);
    } catch (err) {
      console.log(err);
      toast.error('Failed to load auction details');
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usersMap = {};
      res.data.forEach(user => {
        usersMap[user._id] = user.name;
      });
      setUsers(usersMap);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(res.data.reports || []);
    } catch (err) {
      console.log('Error fetching reports:', err);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    
    console.log('=== PLACING BID ===');
    console.log('Auction ID:', id);
    console.log('Bid amount:', bidAmount);
    console.log('Token:', token);
    
    const bidValue = parseFloat(bidAmount);
    console.log('Parsed bid value:', bidValue);
    console.log('Current bid:', auction.currentBid);
    
    if (bidValue <= auction.currentBid) {
      console.log('ERROR: Bid not higher than current bid');
      toast.error(`Bid must be greater than $${auction.currentBid}`);
      return;
    }

    setPlacingBid(true);
    try {
      console.log('Sending bid request...');
      const response = await axios.post(
        `${BASE_URL}/bids/${id}`,
        { amount: bidValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Bid response:', response.data);
      toast.success('Bid placed successfully! 🎉');
      setBidAmount('');
      
      // Refresh auction details after successful bid
      await fetchAuctionDetails();
      
    } catch (err) {
      console.error('Bid error:', err);
      console.error('Error response:', err.response);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to place bid';
      toast.error(errorMsg);
    } finally {
      setPlacingBid(false);
    }
  };

  const handleDeleteAuction = async () => {
    if (!window.confirm('Are you sure you want to delete this auction?')) {
      return;
    }

    try {
      await axios.delete(`${BASE_URL}/auctions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Auction deleted successfully');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete auction');
    }
  };

  const handleEditAuction = () => {
    navigate(`/edit-auction/${id}`);
  };

  const handleBuyNow = async () => {
    if (!window.confirm(`Are you sure you want to buy this item for $${auction.buyNowPrice}?`)) {
      return;
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/auctions/${id}/buy-now`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('🎉 Purchase successful! You won via Buy Now!');
      await fetchAuctionDetails(); // Refresh auction data
      
    } catch (err) {
      console.error('Buy Now error:', err);
      toast.error(err.response?.data?.message || 'Failed to complete Buy Now purchase');
    }
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const end = new Date(auction.endTime);
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const isAuctionActive = () => {
    return new Date(auction.endTime) > new Date();
  };

  if (loading) {
    return (
      <div className="details-loading">
        <div className="loading-spinner"></div>
        <p>Loading auction...</p>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="details-error">
        <h2>Auction not found</h2>
        <button onClick={() => navigate('/auctions')}>Back to Auctions</button>
      </div>
    );
  }

  const sortedBids = [...auction.bids].sort((a, b) => b.amount - a.amount);

  return (
    <div className="auction-details-wrapper">
      <div className="details-container">
        <button className="back-btn" onClick={() => navigate('/auctions')}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Back
        </button>

        <div className="details-grid">
          {/* Main Content */}
          <div className="details-main">
            <div className="auction-header-section">
              <div className="category-badge">{auction.category || 'Other'}</div>
              <h1>{auction.title}</h1>
              <p className="description">{auction.description}</p>
              
              {/* Edit/Delete buttons for seller */}
              {auction.seller === userId && auction.bids.length === 0 && (
                <div className="auction-actions">
                  <button className="edit-btn" onClick={handleEditAuction}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                    Edit Auction
                  </button>
                  <button className="delete-btn" onClick={handleDeleteAuction}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                    Delete Auction
                  </button>
                </div>
              )}
            </div>

            <div className="auction-stats">
              <div className="stat-box">
                <label>Current Bid</label>
                <h2 className="price">${auction.currentBid.toLocaleString()}</h2>
              </div>
              <div className="stat-box">
                <label>Starting Price</label>
                <p>${auction.startingPrice.toLocaleString()}</p>
              </div>
              {/* Show Buy Now Price if enabled (visible to everyone) */}
              {auction.buyNowEnabled && auction.buyNowPrice && !auction.soldViaBuyNow && (
                <div className="stat-box buy-now-box">
                  <label>⚡ Buy Now Price</label>
                  <h2 className="price buy-now-price">${auction.buyNowPrice.toLocaleString()}</h2>
                  {auction.seller === userId && (
                    <small style={{display: 'block', marginTop: '8px', color: '#888', fontSize: '12px'}}>
                      (Buyers will see Buy Now button)
                    </small>
                  )}
                </div>
              )}
              <div className="stat-box">
                <label>Time Remaining</label>
                <p className={!isAuctionActive() ? 'ended' : ''}>
                  {getTimeRemaining()}
                </p>
              </div>
              <div className="stat-box">
                <label>Total Bids</label>
                <p>{auction.bids.length}</p>
              </div>
            </div>

            {/* Bid Form */}
            {isAuctionActive() && auction.seller !== userId && !auction.soldViaBuyNow && (
              <form className="bid-form" onSubmit={handlePlaceBid}>
                <h3>Place Your Bid</h3>
                <div className="bid-input-group">
                  <span className="currency">$</span>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`Enter amount greater than $${auction.currentBid}`}
                    required
                    min={auction.currentBid + 1}
                  />
                  <button type="submit" disabled={placingBid}>
                    {placingBid ? 'Placing...' : '🏆 Place Bid'}
                  </button>
                </div>
                
                {/* Buy Now Button */}
                {auction.buyNowEnabled && auction.buyNowPrice && (
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="buy-now-button"
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '16px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '16px',
                      marginTop: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    ⚡ Buy Now for ${auction.buyNowPrice}
                  </button>
                )}
                
                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                  <button 
                    type="button"
                    onClick={() => setShowAutoBidModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}
                  >
                    🤖 Set Auto-Bid
                  </button>
                </div>
              </form>
            )}

            {/* Message for seller */}
            {isAuctionActive() && auction.seller === userId && !auction.soldViaBuyNow && (
              <div className="seller-message" style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                color: 'white',
                textAlign: 'center',
                fontWeight: '600'
              }}>
                📢 This is your auction
                {auction.buyNowEnabled && auction.buyNowPrice && (
                  <div style={{marginTop: '10px', fontSize: '14px', opacity: '0.9'}}>
                    Buyers will see a "⚡ Buy Now for ${auction.buyNowPrice}" button
                  </div>
                )}
              </div>
            )}

            {/* Social Share Section */}
            <div style={{ margin: '24px 0', padding: '20px', background: 'rgba(108, 92, 231, 0.05)', borderRadius: '12px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>📱 Share this auction:</h3>
              <SocialShare 
                auctionTitle={auction.title}
                auctionId={auction._id}
                currentBid={auction.currentBid}
              />
            </div>

            {/* Action Buttons */}
            {auction.seller !== userId && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setShowChatModal(true)}
                  style={{
                    flex: '1',
                    padding: '12px 20px',
                    background: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  💬 Chat with Seller
                </button>
                <button 
                  onClick={() => setShowReportModal(true)}
                  style={{
                    flex: '1',
                    padding: '12px 20px',
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  🚩 Report Auction
                </button>
              </div>
            )}

            {/* Seller Chat Button */}
            {auction.seller === userId && (
              <div style={{ marginTop: '16px' }}>
                <button 
                  onClick={() => setShowChatModal(true)}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    background: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    marginBottom: '12px'
                  }}
                >
                  💬 View Buyer Messages
                </button>

                {/* Reports Notification */}
                {reports.length > 0 && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(245, 87, 108, 0.1), rgba(240, 147, 251, 0.1))',
                    borderLeft: '4px solid #f5576c',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#f5576c', fontSize: '16px' }}>
                          ⚠️ {reports.length} Report{reports.length > 1 ? 's' : ''} Received
                        </strong>
                        <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                          Your auction has been reported by buyers
                        </p>
                      </div>
                      <button
                        onClick={() => setShowReports(!showReports)}
                        style={{
                          background: '#f5576c',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '13px'
                        }}
                      >
                        {showReports ? 'Hide' : 'View'} Reports
                      </button>
                    </div>

                    {/* Reports List */}
                    {showReports && (
                      <div style={{ marginTop: '16px' }}>
                        {reports.map((report, index) => (
                          <div 
                            key={index}
                            style={{
                              background: 'var(--card-bg)',
                              padding: '12px',
                              borderRadius: '8px',
                              marginBottom: '8px',
                              border: '1px solid rgba(245, 87, 108, 0.2)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                                {report.reason}
                              </strong>
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {new Date(report.reportedAt).toLocaleString()}
                              </span>
                            </div>
                            {report.description && (
                              <p style={{ 
                                margin: 0, 
                                fontSize: '13px', 
                                color: 'var(--text-secondary)',
                                fontStyle: 'italic'
                              }}>
                                "{report.description}"
                              </p>
                            )}
                            <div style={{ 
                              marginTop: '8px', 
                              fontSize: '12px', 
                              color: 'var(--text-secondary)' 
                            }}>
                              Reported by: User ID {report.userId.substring(0, 8)}...
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!isAuctionActive() && auction.winner === userId && (
              <div className="winner-notice">
                <span className="trophy">🏆</span>
                <h3>Congratulations! You won this auction!</h3>
                <button onClick={() => navigate(`/payment/${auction._id}`)}>
                  💳 Complete Payment
                </button>
              </div>
            )}

            {/* Bid History Timeline */}
            <div className="bid-history-section">
              <h3>📊 Bid History ({sortedBids.length})</h3>
              
              {sortedBids.length === 0 ? (
                <div className="no-bids">
                  <p>No bids yet. Be the first to bid!</p>
                </div>
              ) : (
                <div className="timeline">
                  {sortedBids.map((bid, index) => {
                    const bidderName = users[bid.userId || bid.bidder] || 'Anonymous';
                    const isCurrentUserBid = (bid.userId === userId || bid.bidder === userId);
                    const isHighestBid = index === 0;
                    
                    return (
                      <div 
                        key={bid._id} 
                        className={`timeline-item ${isCurrentUserBid ? 'my-bid' : ''} ${isHighestBid ? 'highest-bid' : ''}`}
                      >
                        <div className="timeline-marker">
                          {isHighestBid && <span className="leading-badge">🏆</span>}
                          <div className="marker-dot"></div>
                        </div>
                        <div className="timeline-content">
                          <div className="bid-info">
                            <div className="bidder-info">
                              <span className="bidder-name">
                                {isCurrentUserBid ? 'You' : bidderName}
                                {isHighestBid && <span className="leading-text">Leading</span>}
                              </span>
                              <span className="bid-time">
                                {bid.createdAt ? new Date(bid.createdAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'Just now'}
                              </span>
                            </div>
                            <div className="bid-amount">
                              ${bid.amount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="details-sidebar">
            <div className="seller-card">
              <h3>Seller Information</h3>
              <div className="seller-info">
                <div className="seller-avatar">
                  {users[auction.seller]?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div>
                  <p className="seller-name">{users[auction.seller] || 'Unknown'}</p>
                  <p className="seller-label">Seller</p>
                </div>
              </div>
              {/* Seller Rating */}
              {auction.seller && (
                <RatingDisplay sellerId={auction.seller} showReviews={false} />
              )}
            </div>

            <div className="auction-meta">
              <h3>Auction Details</h3>
              <div className="meta-item">
                <span className="meta-label">Created:</span>
                <span className="meta-value">
                  {new Date(auction.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Ends:</span>
                <span className="meta-value">
                  {new Date(auction.endTime).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Status:</span>
                <span className={`meta-value status ${isAuctionActive() ? 'active' : 'ended'}`}>
                  {isAuctionActive() ? '🟢 Active' : '🔴 Ended'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAutoBidModal && (
        <AutoBidModal
          auctionId={id}
          currentBid={auction.currentBid}
          onClose={() => setShowAutoBidModal(false)}
          onSuccess={() => {
            toast.success('Auto-bid set successfully!');
            fetchAuctionDetails();
          }}
        />
      )}

      {showReportModal && (
        <ReportModal
          auctionId={id}
          auctionTitle={auction.title}
          onClose={() => setShowReportModal(false)}
          onSuccess={() => {
            toast.success('Report submitted successfully! 🚩');
            fetchReports(); // Refresh reports list for seller
          }}
        />
      )}

      {showChatModal && (
        <ChatModal
          auctionId={id}
          auctionTitle={auction.title}
          onClose={() => setShowChatModal(false)}
        />
      )}
    </div>
  );
};

export default AuctionDetails;

