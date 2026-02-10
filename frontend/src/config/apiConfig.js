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

export const BASE_URL = getBaseURL();
