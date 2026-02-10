import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../componets/ToastContainer';
import { BASE_URL } from '../config/apiConfig';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBids: 0,
    wonAuctions: 0,
    activeAuctions: 0,
    totalSpent: 0
  });

  const navigate = useNavigate();
  const toast = useToast();
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
      setFormData({
        name: res.data.name,
        email: res.data.email,
        phone: res.data.phone || '',
        address: res.data.address || ''
      });
      setLoading(false);
    } catch (err) {
      console.log(err);
      toast.error('Failed to load profile');
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const auctionsRes = await axios.get(`${BASE_URL}/auctions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const auctions = auctionsRes.data;

      const totalBids = auctions.reduce((sum, a) => 
        sum + a.bids.filter(b => b.userId === userId || b.bidder === userId).length, 0
      );
      
      const wonAuctions = auctions.filter(a => 
        a.winner === userId && new Date(a.endTime) < new Date()
      ).length;

      const activeAuctions = auctions.filter(a => 
        a.seller === userId && new Date(a.endTime) > new Date()
      ).length;

      const totalSpent = auctions
        .filter(a => a.winner === userId && a.isPaid)
        .reduce((sum, a) => sum + a.currentBid, 0);

      setStats({ totalBids, wonAuctions, activeAuctions, totalSpent });
    } catch (err) {
      console.log(err);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${BASE_URL}/auth/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Profile updated successfully! ✓');
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await axios.put(`${BASE_URL}/auth/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Password changed successfully! 🔒');
      setShowPasswordChange(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-wrapper">
      <div className="profile-background">
        <div className="bg-gradient gradient-1"></div>
        <div className="bg-gradient gradient-2"></div>
      </div>

      <div className="profile-container">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Back
        </button>

        <div className="profile-header">
          <div className="avatar-section">
            <div className="avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <h1>{user?.name}</h1>
              <p className="user-email">{user?.email}</p>
              <span className="user-badge">
                {user?.isSeller ? '🏪 Seller' : '🛍️ Buyer'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>{stats.totalBids}</h3>
              <p>Total Bids</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-info">
              <h3>{stats.wonAuctions}</h3>
              <p>Won Auctions</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-info">
              <h3>{stats.activeAuctions}</h3>
              <p>Active Listings</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <h3>${stats.totalSpent}</h3>
              <p>Total Spent</p>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="profile-content">
          <div className="profile-section">
            <div className="section-header">
              <h2>Profile Information</h2>
              {!isEditing && (
                <button className="edit-btn" onClick={() => setIsEditing(true)}>
                  ✏️ Edit Profile
                </button>
              )}
            </div>

            {isEditing ? (
              <form className="profile-form" onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your address"
                    rows="3"
                  ></textarea>
                </div>

                <div className="form-actions">
                  <button type="submit" className="save-btn">
                    💾 Save Changes
                  </button>
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user.name,
                        email: user.email,
                        phone: user.phone || '',
                        address: user.address || ''
                      });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-details">
                <div className="detail-item">
                  <span className="detail-label">Full Name:</span>
                  <span className="detail-value">{user?.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{user?.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{user?.phone || 'Not provided'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{user?.address || 'Not provided'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Member Since:</span>
                  <span className="detail-value">
                    {new Date(user?.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', month: 'long', day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Password Section */}
          <div className="profile-section">
            <div className="section-header">
              <h2>Security</h2>
              <button 
                className="change-password-btn" 
                onClick={() => setShowPasswordChange(!showPasswordChange)}
              >
                {showPasswordChange ? '❌ Cancel' : '🔒 Change Password'}
              </button>
            </div>

            {showPasswordChange && (
              <form className="password-form" onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength="6"
                  />
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <button type="submit" className="save-btn">
                  🔐 Update Password
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

