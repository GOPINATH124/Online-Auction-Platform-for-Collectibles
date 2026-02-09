import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { t } from '../utils/translations';
import './Dashboard.css';

function Dashboard() {
  const isSeller = localStorage.getItem("isSeller");
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName") || "User";

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchStats();
  }, [token, navigate]);

  const fetchStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/auctions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const auctions = res.data;
      
      if (isSeller === "true") {
        calculateSellerStats(auctions);
        generateSellerActivity(auctions);
      } else {
        calculateBuyerStats(auctions);
        generateBuyerActivity(auctions);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setLoading(false);
    }
  };

  const calculateBuyerStats = (auctions) => {
    const watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
    
    // Count active bids (auctions where user has placed a bid and auction is still active)
    const activeBids = auctions.filter((auction) => {
      const isActive = new Date(auction.endTime) > new Date();
      const userBids = auction.bids.filter((bid) => bid.userId === userId || bid.bidder === userId);
      return isActive && userBids.length > 0;
    }).length;

    // Count watching
    const watching = watchlist.length;

    // Count won auctions
    const wonAuctions = auctions.filter((auction) => {
      if (new Date(auction.endTime) > new Date()) return false;
      const userBids = auction.bids.filter((bid) => bid.userId === userId || bid.bidder === userId);
      if (userBids.length === 0) return false;
      const userHighestBid = Math.max(...userBids.map((bid) => bid.amount));
      return userHighestBid === auction.currentBid;
    }).length;

    // Calculate total spent on won auctions
    const spent = auctions.reduce((total, auction) => {
      if (new Date(auction.endTime) > new Date()) return total;
      const userBids = auction.bids.filter((bid) => bid.userId === userId || bid.bidder === userId);
      if (userBids.length === 0) return total;
      const userHighestBid = Math.max(...userBids.map((bid) => bid.amount));
      if (userHighestBid === auction.currentBid && auction.isPaid) {
        return total + auction.currentBid;
      }
      return total;
    }, 0);

    setStats([
      { label: t('activeBids'), value: activeBids.toString(), icon: "🎯", color: "#667eea", path: "/my-bids?filter=active" },
      { label: t('watching'), value: watching.toString(), icon: "👁️", color: "#f093fb", path: "/watchlist" },
      { label: t('wonAuctions'), value: wonAuctions.toString(), icon: "🏆", color: "#4facfe", path: "/my-bids?filter=won" },
      { label: t('spent'), value: `$${spent}`, icon: "💳", color: "#43e97b", path: "/my-bids" }
    ]);
  };

  const calculateSellerStats = (auctions) => {
    const userAuctions = auctions.filter(a => a.seller === userId || a.seller?._id === userId);
    
    const activeAuctions = userAuctions.filter(a => new Date(a.endTime) > new Date()).length;
    const totalBids = userAuctions.reduce((sum, a) => sum + a.bids.length, 0);
    const completed = userAuctions.filter(a => new Date(a.endTime) <= new Date()).length;
    const revenue = userAuctions.reduce((sum, a) => {
      if (new Date(a.endTime) <= new Date() && a.isPaid) {
        return sum + a.currentBid;
      }
      return sum;
    }, 0);

    setStats([
      { label: "Active Auctions", value: activeAuctions.toString(), icon: "📦", color: "#667eea", path: "/auctions" },
      { label: "Total Bids", value: totalBids.toString(), icon: "💰", color: "#f093fb", path: "/auctions" },
      { label: "Revenue", value: `$${revenue}`, icon: "💵", color: "#4facfe", path: "/analytics" },
      { label: "Completed", value: completed.toString(), icon: "✅", color: "#43e97b", path: "/auctions" }
    ]);
  };

  const generateBuyerActivity = (auctions) => {
    const activities = [];
    
    // Get user's bids and related auctions
    auctions.forEach(auction => {
      const userBids = auction.bids.filter(bid => bid.userId === userId || bid.bidder === userId);
      
      if (userBids.length > 0) {
        const latestBid = userBids[userBids.length - 1];
        const isActive = new Date(auction.endTime) > new Date();
        const isWinner = auction.winner === userId;
        const hasEnded = !isActive;
        
        if (hasEnded && isWinner && !auction.isPaid) {
          activities.push({
            type: 'won',
            icon: '🏆',
            title: `${t('youWon')} "${auction.title}"!`,
            description: `${t('winningBid')}: $${auction.currentBid} - ${t('paymentPending')}`,
            color: '#43e97b',
            time: new Date(auction.endTime),
            actionText: t('payNow'),
            actionPath: `/payment/${auction._id}`
          });
        } else if (hasEnded && isWinner && auction.isPaid) {
          activities.push({
            type: 'paid',
            icon: '✅',
            title: `Payment completed for "${auction.title}"`,
            description: `Paid $${auction.currentBid}`,
            color: '#4facfe',
            time: new Date(auction.endTime)
          });
        } else if (hasEnded && !isWinner) {
          activities.push({
            type: 'lost',
            icon: '💔',
            title: `Auction ended: "${auction.title}"`,
            description: `Your bid: $${latestBid.amount} - Final price: $${auction.currentBid}`,
            color: '#f093fb',
            time: new Date(auction.endTime)
          });
        } else if (isActive) {
          const isLeading = latestBid.amount === auction.currentBid;
          activities.push({
            type: isLeading ? 'leading' : 'outbid',
            icon: isLeading ? '🎯' : '⚠️',
            title: isLeading ? `Leading bid on "${auction.title}"` : `Outbid on "${auction.title}"`,
            description: isLeading 
              ? `Your bid: $${latestBid.amount}` 
              : `Your bid: $${latestBid.amount} - Current: $${auction.currentBid}`,
            color: isLeading ? '#667eea' : '#ff6b6b',
            time: new Date(latestBid._id ? new Date(parseInt(latestBid._id.substring(0, 8), 16) * 1000) : auction.createdAt),
            actionText: isLeading ? 'View' : 'Bid Again',
            actionPath: `/auctions`
          });
        }
      }
    });
    
    // Sort by most recent
    activities.sort((a, b) => b.time - a.time);
    setRecentActivity(activities.slice(0, 5));
  };

  const generateSellerActivity = (auctions) => {
    const activities = [];
    const userAuctions = auctions.filter(a => a.seller === userId || a.seller?._id === userId);
    
    userAuctions.forEach(auction => {
      const isActive = new Date(auction.endTime) > new Date();
      const hasEnded = !isActive;
      
      if (auction.bids.length > 0) {
        const latestBid = auction.bids[auction.bids.length - 1];
        const bidTime = new Date(latestBid._id ? new Date(parseInt(latestBid._id.substring(0, 8), 16) * 1000) : auction.createdAt);
        
        if (isActive) {
          activities.push({
            type: 'new_bid',
            icon: '💰',
            title: `New bid on "${auction.title}"`,
            description: `Current bid: $${auction.currentBid} (${auction.bids.length} bids)`,
            color: '#667eea',
            time: bidTime
          });
        } else if (hasEnded && auction.isPaid) {
          activities.push({
            type: 'sold',
            icon: '✅',
            title: `"${auction.title}" sold and paid`,
            description: `Final price: $${auction.currentBid}`,
            color: '#43e97b',
            time: new Date(auction.endTime)
          });
        } else if (hasEnded && auction.winner) {
          activities.push({
            type: 'ended_winner',
            icon: '🎉',
            title: `"${auction.title}" auction ended`,
            description: `Winner found - Final price: $${auction.currentBid} - Awaiting payment`,
            color: '#4facfe',
            time: new Date(auction.endTime)
          });
        }
      } else if (isActive) {
        activities.push({
          type: 'active_no_bids',
          icon: '📢',
          title: `"${auction.title}" is live`,
          description: `No bids yet - Starting price: $${auction.startingPrice}`,
          color: '#f093fb',
          time: new Date(auction.createdAt)
        });
      }
    });
    
    // Sort by most recent
    activities.sort((a, b) => b.time - a.time);
    setRecentActivity(activities.slice(0, 5));
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 5) return t('goodNight');
    if (hour < 12) return t('goodMorning');
    if (hour < 18) return t('goodAfternoon');
    if (hour < 22) return t('goodEvening');
    return t('goodNight');
  };

  const quickActions = isSeller === "true"
    ? [
        {
          title: "Create Auction",
          description: "List a new item for auction",
          icon: "➕",
          color: "#667eea",
          path: "/create-auction"
        },
        {
          title: "My Auctions",
          description: "View and manage your listings",
          icon: "📋",
          color: "#f093fb",
          path: "/auctions"
        },
        {
          title: "My Sales",
          description: "Track winners and payments",
          icon: "💼",
          color: "#43e97b",
          path: "/my-sales"
        },
        {
          title: "Analytics",
          description: "View performance metrics",
          icon: "📊",
          color: "#4facfe",
          path: "/analytics"
        }
      ]
    : [
        {
          title: t('browseAuctions'),
          description: t('exploreAuctions'),
          icon: "🔍",
          color: "#667eea",
          path: "/auctions"
        },
        {
          title: t('myBids'),
          description: t('trackBids'),
          icon: "💰",
          color: "#f093fb",
          path: "/my-bids"
        },
        {
          title: t('myPurchases'),
          description: t('viewPurchases'),
          icon: "🛍️",
          color: "#43e97b",
          path: "/my-purchases"
        },
        {
          title: t('watchlist'),
          description: t('viewWatchlist'),
          icon: "⭐",
          color: "#4facfe",
          path: "/watchlist"
        }
      ];

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="dashboard-container">
        {/* Header Section */}
        <div className="dashboard-header">
          <div className="welcome-section">
            <h1 className="welcome-title">
              {getGreeting()}, {userName}! 👋
            </h1>
            <p className="welcome-subtitle">
              {isSeller === "true" 
                ? "Manage your auctions and track your sales" 
                : t('discoverDeals')}
            </p>
            <div className="user-badge">
              <span className="badge-icon">
                {isSeller === "true" ? "👨‍💼" : "👤"}
              </span>
              <span className="badge-text">
                {isSeller === "true" ? t('sellerAccount') : t('buyerAccount')}
              </span>
            </div>
          </div>
          <div className="time-widget">
            <div className="time-display">
              {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })}
            </div>
            <div className="date-display">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {loading ? (
            <div className="stats-loading">Loading stats...</div>
          ) : (
            stats.map((stat, index) => (
              <div 
                key={index} 
                className="stat-card clickable"
                style={{ '--card-color': stat.color, animationDelay: `${index * 0.1}s` }}
                onClick={() => navigate(stat.path)}
              >
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-content">
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
                <div className="stat-trend">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                  </svg>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h2 className="section-title">{t('quickActions')}</h2>
          <div className="actions-grid">
            {quickActions.map((action, index) => (
              <div 
                key={index}
                className="action-card"
                onClick={() => navigate(action.path)}
                style={{ animationDelay: `${index * 0.1 + 0.4}s` }}
              >
                <div className="action-icon-wrapper" style={{ background: action.color }}>
                  <span className="action-icon">{action.icon}</span>
                </div>
                <div className="action-content">
                  <h3 className="action-title">{action.title}</h3>
                  <p className="action-description">{action.description}</p>
                </div>
                <div className="action-arrow">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="activity-section">
          <h2 className="section-title">{t('recentActivity')}</h2>
          <div className="activity-card">
            {recentActivity.length === 0 ? (
              <div className="activity-empty">
                <div className="empty-icon">📭</div>
                <p className="empty-text">No recent activity</p>
                <p className="empty-subtext">
                  {isSeller === "true" 
                    ? "Start by creating your first auction" 
                    : "Browse auctions to get started"}
                </p>
                <button 
                  className="cta-button"
                  onClick={() => navigate(isSeller === "true" ? "/create-auction" : "/auctions")}
                >
                  <span>{isSeller === "true" ? "Create Auction" : "Browse Auctions"}</span>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                  </svg>
                </button>
              </div>
            ) : (
              <div className="activity-list">
                {recentActivity.map((activity, index) => (
                  <div 
                    key={index} 
                    className="activity-item"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="activity-icon-wrapper" style={{ background: activity.color }}>
                      <span className="activity-icon">{activity.icon}</span>
                    </div>
                    <div className="activity-details">
                      <h4 className="activity-title">{activity.title}</h4>
                      <p className="activity-description">{activity.description}</p>
                      <span className="activity-time">
                        {activity.time.toLocaleDateString()} at {activity.time.toLocaleTimeString()}
                      </span>
                    </div>
                    {activity.actionText && (
                      <button 
                        className="activity-action-btn"
                        onClick={() => navigate(activity.actionPath)}
                      >
                        {activity.actionText}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
