import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../config/apiConfig';
import './BiddingStats.css';

function BiddingStats() {
  const [stats, setStats] = useState(null);
  const [bidHistory, setBidHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, won, lost
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchBiddingStats();
  }, []);

  const fetchBiddingStats = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/users/bidding-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data.stats);
      setBidHistory(res.data.bidHistory);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching bidding stats:', err);
      setLoading(false);
    }
  };

  const getFilteredHistory = () => {
    if (filter === 'all') return bidHistory;
    if (filter === 'active') return bidHistory.filter(bid => bid.isActive);
    if (filter === 'won') return bidHistory.filter(bid => bid.isWinner && !bid.isActive);
    if (filter === 'lost') return bidHistory.filter(bid => !bid.isWinner && !bid.isActive);
    return bidHistory;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your bidding stats...</p>
      </div>
    );
  }

  const filteredHistory = getFilteredHistory();

  return (
    <div className="bidding-stats-wrapper">
      <div className="stats-container">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>

        <div className="stats-header">
          <h1>📊 My Bidding Stats</h1>
          <p>Track your bidding activity and performance</p>
        </div>

        {/* Stats Overview Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <label>Total Bids</label>
              <h2>{stats?.totalBids || 0}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <label>Auctions Won</label>
              <h2>{stats?.auctionsWon || 0}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <label>Win Rate</label>
              <h2>{stats?.winRate || 0}%</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <label>Total Spent</label>
              <h2>${stats?.totalSpent?.toLocaleString() || 0}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <label>Active Bids</label>
              <h2>{stats?.activeBids || 0}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">❤️</div>
            <div className="stat-content">
              <label>Favorite Category</label>
              <h2 style={{ fontSize: '16px' }}>{stats?.favoriteCategory || 'None'}</h2>
            </div>
          </div>
        </div>

        {/* Bid History Section */}
        <div className="history-section">
          <div className="history-header">
            <h2>📜 Bid History</h2>
            <div className="filter-buttons">
              <button 
                className={filter === 'all' ? 'active' : ''} 
                onClick={() => setFilter('all')}
              >
                All ({bidHistory.length})
              </button>
              <button 
                className={filter === 'active' ? 'active' : ''} 
                onClick={() => setFilter('active')}
              >
                Active ({bidHistory.filter(b => b.isActive).length})
              </button>
              <button 
                className={filter === 'won' ? 'active' : ''} 
                onClick={() => setFilter('won')}
              >
                Won ({bidHistory.filter(b => b.isWinner && !b.isActive).length})
              </button>
              <button 
                className={filter === 'lost' ? 'active' : ''} 
                onClick={() => setFilter('lost')}
              >
                Lost ({bidHistory.filter(b => !b.isWinner && !b.isActive).length})
              </button>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="no-history">
              <p>📭 No bidding history found for this filter</p>
            </div>
          ) : (
            <div className="history-grid">
              {filteredHistory.map((bid) => (
                <div 
                  key={bid.auctionId} 
                  className={`history-card ${bid.isActive ? 'active' : ''} ${bid.isWinner ? 'won' : ''}`}
                  onClick={() => navigate(`/auctions/${bid.auctionId}`)}
                >
                  {bid.image && (
                    <div className="history-image">
                      <img src={bid.image} alt={bid.title} />
                      {bid.isActive && <span className="live-badge">🔴 LIVE</span>}
                      {bid.isWinner && !bid.isActive && <span className="winner-badge">🏆 WON</span>}
                    </div>
                  )}
                  
                  <div className="history-content">
                    <h3>{bid.title}</h3>
                    <span className="category-tag">{bid.category}</span>
                    
                    <div className="bid-details">
                      <div className="detail-row">
                        <span>Your Highest Bid:</span>
                        <strong>${bid.highestBid}</strong>
                      </div>
                      <div className="detail-row">
                        <span>Current Bid:</span>
                        <strong>${bid.currentBid}</strong>
                      </div>
                      <div className="detail-row">
                        <span>Total Bids:</span>
                        <strong>{bid.totalBids}</strong>
                      </div>
                    </div>

                    {bid.isActive ? (
                      <div className="status-badge active-badge">
                        ⚡ Active Auction
                      </div>
                    ) : bid.isWinner ? (
                      <div className="status-badge winner-badge-bottom">
                        🎉 You Won! {bid.isPaid ? '✅ Paid' : '💳 Payment Pending'}
                      </div>
                    ) : (
                      <div className="status-badge lost-badge">
                        ❌ Auction Ended
                      </div>
                    )}

                    <div className="end-time">
                      {bid.isActive ? 'Ends' : 'Ended'}: {new Date(bid.endTime).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BiddingStats;

