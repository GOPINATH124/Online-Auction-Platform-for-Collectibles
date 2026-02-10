import axios from "axios";

// Base URL for backend
// Automatically detect if running locally or on production
const getBaseURL = () => {
  // If running on localhost (development), use local backend
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  }
  // If deployed on Vercel or any other host, use production backend
  return "https://online-auction-platform-for-collectible.onrender.com/api";
};

const BASE_URL = getBaseURL();

// Export BASE_URL for use in other components
export { BASE_URL };

// Configure axios defaults
axios.defaults.withCredentials = false;

// Get token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
};

// -------------------
// USER AUTH
// -------------------
export const registerUser = async (userData) => {
  try {
    const res = await axios.post(`${BASE_URL}/auth/register`, userData);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const loginUser = async (credentials) => {
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, credentials);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// -------------------
// AUCTIONS
// -------------------
export const getAllAuctions = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/auctions`, getAuthHeaders());
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAuctionById = async (id) => {
  try {
    const res = await axios.get(`${BASE_URL}/auctions/${id}`, getAuthHeaders());
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createAuction = async (auctionData) => {
  try {
    const res = await axios.post(`${BASE_URL}/auctions`, auctionData, getAuthHeaders());
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// -------------------
// BID
// -------------------
export const placeBid = async (auctionId, bidData) => {
  try {
    const res = await axios.post(`${BASE_URL}/auctions/${auctionId}/bid`, bidData, getAuthHeaders());
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// -------------------
// PAYMENT
// -------------------
export const payAuction = async (auctionId) => {
  try {
    const res = await axios.post(`${BASE_URL}/auctions/${auctionId}/pay`, {}, getAuthHeaders());
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
