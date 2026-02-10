import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../componets/ToastContainer";
import { BASE_URL } from '../config/apiConfig';
import './CreateAuction.css';

function CreateAuction() {
  const navigate = useNavigate();
  const toast = useToast();

  const [auction, setAuction] = useState({
    title: "",
    description: "",
    category: "Electronics",
    startingPrice: "",
    endTime: "",
    buyNowEnabled: false,
    buyNowPrice: ""
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [errors, setErrors] = useState({});

  const isSeller = localStorage.getItem("isSeller");

  if (isSeller !== "true") {
    return (
      <div className="access-denied-wrapper">
        <div className="access-denied-card">
          <div className="denied-icon">🚫</div>
          <h2>Access Denied</h2>
          <p>Only sellers can create auctions.</p>
          <button className="back-button" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors = {};
    
    if (!auction.title.trim()) {
      newErrors.title = "Title is required";
    }
    
    if (!auction.description.trim()) {
      newErrors.description = "Description is required";
    }
    
    if (!auction.startingPrice || auction.startingPrice <= 0) {
      newErrors.startingPrice = "Starting price must be greater than 0";
    }
    
    if (!auction.endTime) {
      newErrors.endTime = "End time is required";
    } else {
      const endDate = new Date(auction.endTime);
      const now = new Date();
      if (endDate <= now) {
        newErrors.endTime = "End time must be in the future";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAuction({ ...auction, [name]: value });
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }
    
    setImages(files);
    
    // Create image previews
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append("title", auction.title);
      formData.append("description", auction.description);
      formData.append("category", auction.category);
      formData.append("startingPrice", auction.startingPrice);
      formData.append("endTime", auction.endTime);
      
      // Append all images
      images.forEach((image) => {
        formData.append("images", image);
      });

      const response = await axios.post(
        `${BASE_URL}/auctions`,
        formData,
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
            "Content-Type": "multipart/form-data"
          }
        }
      );
      toast.success("Auction Created Successfully! 🎉");
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err) {
      console.error("Error creating auction:", err);
      const errorMessage = err.response?.data?.message 
        || err.response?.data?.error 
        || "Error creating auction. Please check your connection and try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-auction-wrapper">
      <div className="create-auction-background">
        <div className="bg-circle circle-1"></div>
        <div className="bg-circle circle-2"></div>
        <div className="bg-circle circle-3"></div>
      </div>

      <div className="create-auction-container">
        <div className="create-auction-card">
          <div className="auction-header">
            <button className="back-btn" onClick={() => navigate("/dashboard")}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
              Back
            </button>
            <div className="header-content">
              <div className="header-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              </div>
              <h1 className="auction-title">Create New Auction</h1>
              <p className="auction-subtitle">List your item and start receiving bids</p>
            </div>
          </div>

          <form className="auction-form" onSubmit={handleSubmit}>
            <div className={`form-group ${focusedField === 'title' ? 'focused' : ''} ${errors.title ? 'error' : ''}`}>
              <label className="form-label">
                <span className="label-icon">📝</span>
                Auction Title
              </label>
              <input
                type="text"
                name="title"
                value={auction.title}
                onChange={handleChange}
                onFocus={() => setFocusedField('title')}
                onBlur={() => setFocusedField('')}
                placeholder="e.g., Vintage Camera, Gaming Laptop, Artwork"
                className="form-input"
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
            </div>

            <div className={`form-group ${focusedField === 'description' ? 'focused' : ''} ${errors.description ? 'error' : ''}`}>
              <label className="form-label">
                <span className="label-icon">📄</span>
                Description
              </label>
              <textarea
                name="description"
                value={auction.description}
                onChange={handleChange}
                onFocus={() => setFocusedField('description')}
                onBlur={() => setFocusedField('')}
                placeholder="Provide detailed information about your item..."
                className="form-textarea"
                rows="5"
              />
              {errors.description && <span className="error-message">{errors.description}</span>}
            </div>

            <div className={`form-group ${focusedField === 'category' ? 'focused' : ''}`}>
              <label className="form-label">
                <span className="label-icon">📦</span>
                Category
              </label>
              <select
                name="category"
                value={auction.category}
                onChange={handleChange}
                onFocus={() => setFocusedField('category')}
                onBlur={() => setFocusedField('')}
                className="form-select"
              >
                <option value="Electronics">📱 Electronics</option>
                <option value="Fashion">👗 Fashion</option>
                <option value="Home & Garden">🏠 Home & Garden</option>
                <option value="Sports">⚽ Sports & Outdoors</option>
                <option value="Collectibles">🎨 Collectibles & Art</option>
                <option value="Automotive">🚗 Automotive</option>
                <option value="Books">📚 Books & Media</option>
                <option value="Toys">🧸 Toys & Games</option>
                <option value="Jewelry">💍 Jewelry & Watches</option>
                <option value="Other">📦 Other</option>
              </select>
            </div>

            <div className="form-row">
              <div className={`form-group ${focusedField === 'startingPrice' ? 'focused' : ''} ${errors.startingPrice ? 'error' : ''}`}>
                <label className="form-label">
                  <span className="label-icon">💰</span>
                  Starting Price
                </label>
                <div className="price-input-wrapper">
                  <span className="currency-symbol">$</span>
                  <input
                    type="number"
                    name="startingPrice"
                    value={auction.startingPrice}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('startingPrice')}
                    onBlur={() => setFocusedField('')}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="form-input price-input"
                  />
                </div>
                {errors.startingPrice && <span className="error-message">{errors.startingPrice}</span>}
              </div>

              <div className={`form-group ${focusedField === 'endTime' ? 'focused' : ''} ${errors.endTime ? 'error' : ''}`}>
                <label className="form-label">
                  <span className="label-icon">⏰</span>
                  Auction End Time
                </label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={auction.endTime}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('endTime')}
                  onBlur={() => setFocusedField('')}
                  className="form-input"
                />
                {errors.endTime && <span className="error-message">{errors.endTime}</span>}
              </div>
            </div>

            {/* Buy Now Option */}
            <div className="form-group buy-now-section">
              <div className="buy-now-header">
                <label className="form-label">
                  <span className="label-icon">⚡</span>
                  Buy Now Option
                </label>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={auction.buyNowEnabled}
                    onChange={(e) => setAuction({ ...auction, buyNowEnabled: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <p className="form-hint">Allow buyers to purchase immediately at a fixed price</p>
              
              {auction.buyNowEnabled && (
                <div className={`form-group ${focusedField === 'buyNowPrice' ? 'focused' : ''}`} style={{ marginTop: '16px' }}>
                  <label className="form-label">
                    <span className="label-icon">💎</span>
                    Buy Now Price
                  </label>
                  <div className="price-input-wrapper">
                    <span className="currency-symbol">$</span>
                    <input
                      type="number"
                      name="buyNowPrice"
                      value={auction.buyNowPrice}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('buyNowPrice')}
                      onBlur={() => setFocusedField('')}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="form-input price-input"
                    />
                  </div>
                  <p className="form-hint">Set a price higher than starting bid</p>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">📷</span>
                Upload Images
              </label>
              <div className="image-upload-container">
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="imageUpload" className="image-upload-btn">
                  <span className="upload-icon">📤</span>
                  Choose Images (Max 5)
                </label>
                <span className="upload-hint">Supported: JPG, PNG, GIF, WebP (Max 5MB each)</span>
              </div>

              {imagePreviews.length > 0 && (
                <div className="image-previews">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="image-preview-item">
                      <img src={preview} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => removeImage(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => navigate("/dashboard")}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={`submit-button ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    Create Auction
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateAuction;

