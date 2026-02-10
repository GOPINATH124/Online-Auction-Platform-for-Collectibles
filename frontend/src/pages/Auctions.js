import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AuctionCard from "../componets/AuctionCard";
import { useToast } from "../componets/ToastContainer";
import { BASE_URL } from "../config/apiConfig";
import './Auctions.css';

const Auctions = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, ending-soon
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('ending-soon'); // ending-soon, price-low, price-high, newest
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const navigate = useNavigate();
  const toast = useToast();

  const token = localStorage.getItem("token");

  // Fetch all auctions from backend
  const fetchAuctions = async () => {
    try {
      const config = token ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      } : {};
      
      const res = await axios.get(`${BASE_URL}/auctions`, config);
      setAuctions(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching auctions:", err);
      toast.error("Error fetching auctions");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  // Refresh auctions after bidding
  const refreshAuctions = () => {
    fetchAuctions();
  };

  const getFilteredAuctions = () => {
    const now = new Date();
    let filtered = auctions;
    
    // Apply status filter
    switch(filter) {
      case 'active':
        filtered = filtered.filter(a => new Date(a.endTime) > now);
        break;
      case 'ending-soon':
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        filtered = filtered.filter(a => {
          const endDate = new Date(a.endTime);
          return endDate > now && endDate < tomorrow;
        });
        break;
      case 'ended':
        filtered = filtered.filter(a => new Date(a.endTime) <= now);
        break;
      default:
        break;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }

    // Apply price range filter
    if (priceRange.min !== '') {
      filtered = filtered.filter(a => a.currentBid >= Number(priceRange.min));
    }
    if (priceRange.max !== '') {
      filtered = filtered.filter(a => a.currentBid <= Number(priceRange.max));
    }

    // Apply sorting
    switch(sortBy) {
      case 'ending-soon':
        filtered.sort((a, b) => new Date(a.endTime) - new Date(b.endTime));
        break;
      case 'price-low':
        filtered.sort((a, b) => a.currentBid - b.currentBid);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.currentBid - a.currentBid);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredAuctions = getFilteredAuctions();

  if (loading) {
    return (
      <div className="auctions-loading">
        <div className="loading-spinner"></div>
        <p>Loading auctions...</p>
      </div>
    );
  }

  return (
    <div className="auctions-wrapper">
      <div className="auctions-background">
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="bg-orb orb-3"></div>
      </div>

      <div className="auctions-container">
        <div className="auctions-header">
          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            Back
          </button>
          
          <div className="header-content">
            <h1 className="auctions-title">Browse Auctions</h1>
            <p className="auctions-subtitle">
              {filteredAuctions.length} {filteredAuctions.length === 1 ? 'auction' : 'auctions'} available
            </p>
          </div>

          {/* Search Bar */}
          <div className="search-filter-section">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="currentColor" className="search-icon">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input
                type="text"
                placeholder="Search auctions by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery('')}>
                  ✕
                </button>
              )}
            </div>

            <div className="advanced-filters">
              <div className="category-filter">
                <label>Category:</label>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="category-select"
                >
                  <option value="All">All Categories</option>
                  <option value="Electronics">📱 Electronics</option>
                  <option value="Fashion">👗 Fashion</option>
                  <option value="Home & Garden">🏠 Home & Garden</option>
                  <option value="Sports">⚽ Sports</option>
                  <option value="Collectibles">🎨 Collectibles</option>
                  <option value="Automotive">🚗 Automotive</option>
                  <option value="Books">📚 Books</option>
                  <option value="Toys">🧸 Toys</option>
                  <option value="Jewelry">💍 Jewelry</option>
                  <option value="Other">📦 Other</option>
                </select>
              </div>

              <div className="price-filter">
                <label>Price Range:</label>
                <input
                  type="number"
                  placeholder="Min $"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                  className="price-input"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max $"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                  className="price-input"
                />
              </div>

              <div className="sort-filter">
                <label>Sort By:</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="ending-soon">⏰ Ending Soon</option>
                  <option value="price-low">💰 Price: Low to High</option>
                  <option value="price-high">💎 Price: High to Low</option>
                  <option value="newest">✨ Newest First</option>
                </select>
              </div>
            </div>
          </div>

          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              <span>All</span>
              <span className="tab-count">{auctions.length}</span>
            </button>
            <button 
              className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              <span>Active</span>
              <span className="tab-count">
                {auctions.filter(a => new Date(a.endTime) > new Date()).length}
              </span>
            </button>
            <button 
              className={`filter-tab ${filter === 'ending-soon' ? 'active' : ''}`}
              onClick={() => setFilter('ending-soon')}
            >
              <span>Ending Soon</span>
            </button>
            <button 
              className={`filter-tab ${filter === 'ended' ? 'active' : ''}`}
              onClick={() => setFilter('ended')}
            >
              <span>Ended</span>
            </button>
          </div>
        </div>

        <div className="auctions-grid">
          {filteredAuctions.length === 0 ? (
            <div className="no-auctions">
              <div className="empty-icon">📭</div>
              <h3>No Auctions Found</h3>
              <p>
                {filter === 'all' 
                  ? "There are no auctions available at the moment."
                  : `No ${filter} auctions available.`}
              </p>
              <button className="create-btn" onClick={() => navigate("/create-auction")}>
                Create First Auction
              </button>
            </div>
          ) : (
            filteredAuctions.map((auction) => (
              <AuctionCard
                key={auction._id}
                auction={auction}
                refreshAuctions={refreshAuctions}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Auctions;
