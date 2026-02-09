import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../componets/ToastContainer';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, auctionsRes, paymentsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/statistics', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/admin/auctions', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/admin/payments', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setAuctions(auctionsRes.data);
      setPayments(paymentsRes.data.payments);
      setLoading(false);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        toast.error('Access denied. Admin only.');
        navigate('/dashboard');
      } else {
        toast.error('Failed to load admin data');
      }
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/users/${userId}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User status updated');
      fetchData();
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteAuction = async (auctionId) => {
    if (!window.confirm('Are you sure you want to delete this auction?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/admin/auctions/${auctionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Auction deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete auction');
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>🛡️ Admin Dashboard</h1>
        <p>Manage users, auctions, and platform statistics</p>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          👥 Users ({users.length})
        </button>
        <button 
          className={activeTab === 'auctions' ? 'active' : ''}
          onClick={() => setActiveTab('auctions')}
        >
          🎯 Auctions ({auctions.length})
        </button>
        <button 
          className={activeTab === 'payments' ? 'active' : ''}
          onClick={() => setActiveTab('payments')}
        >
          💰 Payments ({payments.length})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="overview-tab">
          {/* Statistics Cards */}
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon">👥</div>
              <h3>{stats.users.total}</h3>
              <p>Total Users</p>
              <div className="stat-details">
                <span>Sellers: {stats.users.sellers}</span>
                <span>Buyers: {stats.users.buyers}</span>
              </div>
            </div>

            <div className="stat-card purple">
              <div className="stat-icon">🎯</div>
              <h3>{stats.auctions.total}</h3>
              <p>Total Auctions</p>
              <div className="stat-details">
                <span>Active: {stats.auctions.active}</span>
                <span>Ended: {stats.auctions.ended}</span>
              </div>
            </div>

            <div className="stat-card green">
              <div className="stat-icon">💰</div>
              <h3>${stats.revenue.total.toLocaleString()}</h3>
              <p>Total Revenue</p>
              <div className="stat-details">
                <span>Paid: {stats.auctions.paid}</span>
                <span>Avg: ${stats.revenue.average}</span>
              </div>
            </div>

            <div className="stat-card orange">
              <div className="stat-icon">📦</div>
              <h3>{stats.auctions.paid}</h3>
              <p>Completed Sales</p>
              <div className="stat-details">
                <span>Pending: {stats.auctions.ended - stats.auctions.paid}</span>
              </div>
            </div>
          </div>

          {/* Top Sellers */}
          <div className="top-sellers">
            <h2>🏆 Top Sellers</h2>
            <table>
              <thead>
                <tr>
                  <th>Seller</th>
                  <th>Auctions</th>
                  <th>Total Bids</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.topSellers.map((seller, index) => (
                  <tr key={index}>
                    <td>{seller.name}</td>
                    <td>{seller.auctionCount}</td>
                    <td>{seller.totalBids}</td>
                    <td>${seller.totalRevenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent Auctions */}
          <div className="recent-auctions">
            <h2>📌 Recent Auctions</h2>
            <div className="auction-list">
              {stats.recentAuctions.map((auction) => (
                <div key={auction._id} className="auction-item">
                  <h4>{auction.title}</h4>
                  <p>Seller: {auction.seller.name}</p>
                  <p>Current Bid: ${auction.currentBid}</p>
                  <p>Bids: {auction.bids.length}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="users-tab">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Status</th>
                <th>Rating</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${user.isSeller ? 'seller' : 'buyer'}`}>
                      {user.isSeller ? '🏪 Seller' : '🛒 Buyer'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.isBlocked ? 'blocked' : 'active'}`}>
                      {user.isBlocked ? '🚫 Blocked' : '✅ Active'}
                    </span>
                  </td>
                  <td>⭐ {user.rating ? user.rating.toFixed(1) : '0.0'} ({user.totalReviews})</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="actions">
                    <button 
                      onClick={() => handleToggleUserStatus(user._id)}
                      className={user.isBlocked ? 'unblock' : 'block'}
                    >
                      {user.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user._id)}
                      className="delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Auctions Tab */}
      {activeTab === 'auctions' && (
        <div className="auctions-tab">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Seller</th>
                <th>Category</th>
                <th>Current Bid</th>
                <th>Bids</th>
                <th>Status</th>
                <th>End Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {auctions.map((auction) => (
                <tr key={auction._id}>
                  <td>{auction.title}</td>
                  <td>{auction.seller?.name || 'Unknown'}</td>
                  <td>{auction.category}</td>
                  <td>${auction.currentBid}</td>
                  <td>{auction.bids.length}</td>
                  <td>
                    <span className={`badge ${new Date(auction.endTime) > new Date() ? 'active' : 'ended'}`}>
                      {new Date(auction.endTime) > new Date() ? '🟢 Active' : '🔴 Ended'}
                    </span>
                  </td>
                  <td>{new Date(auction.endTime).toLocaleString()}</td>
                  <td className="actions">
                    <button 
                      onClick={() => navigate(`/auction/${auction._id}`)}
                      className="view"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleDeleteAuction(auction._id)}
                      className="delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="payments-tab">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Auction</th>
                <th>Seller</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Transaction ID</th>
                <th>Paid At</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, index) => (
                <tr key={index}>
                  <td>{payment.title}</td>
                  <td>{payment.seller}</td>
                  <td className="amount">${payment.amount.toLocaleString()}</td>
                  <td>
                    <span className="badge payment-method">
                      {payment.method || 'N/A'}
                    </span>
                  </td>
                  <td>{payment.transactionId || 'N/A'}</td>
                  <td>{payment.paidAt ? new Date(payment.paidAt).toLocaleString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
