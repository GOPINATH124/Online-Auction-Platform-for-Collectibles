import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../componets/ToastContainer';
import { BASE_URL } from '../config/apiConfig';
import './CreateAuction.css';

const EditAuction = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    startingPrice: '',
    endTime: ''
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingAuction, setFetchingAuction] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAuction();
  }, [id]);

  const fetchAuction = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/auctions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const auction = res.data;
      
      // Format date for datetime-local input
      const endDate = new Date(auction.endTime);
      const formattedDate = endDate.toISOString().slice(0, 16);
      
      setFormData({
        title: auction.title,
        description: auction.description,
        category: auction.category,
        startingPrice: auction.startingPrice,
        endTime: formattedDate
      });

      // Set existing image previews
      if (auction.images && auction.images.length > 0) {
        setImagePreviews(auction.images.map(img => img.url));
      }

      setFetchingAuction(false);
    } catch (err) {
      toast.error('Failed to load auction details');
      navigate('/dashboard');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);

    // Generate previews
    const previews = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result);
        if (previews.length === files.length) {
          setImagePreviews(previews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('startingPrice', formData.startingPrice);
      data.append('endTime', formData.endTime);

      // Append images if new ones are selected
      if (images.length > 0) {
        images.forEach(image => {
          data.append('images', image);
        });
      }

      await axios.put(`${BASE_URL}/auctions/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Auction updated successfully! 🎉');
      navigate(`/auction/${id}`);
    } catch (err) {
      console.error('Update error:', err.response?.data);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to update auction';
      toast.error(errorMsg);
    }
    setLoading(false);
  };

  if (fetchingAuction) {
    return (
      <div className="create-auction-page">
        <div className="create-auction-container">
          <p style={{ textAlign: 'center', padding: '40px' }}>Loading auction...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-auction-page">
      <div className="create-auction-container">
        <div className="form-header">
          <h2>Edit Auction</h2>
          <p>Update your auction details (Note: Cannot edit if there are existing bids)</p>
        </div>

        <form onSubmit={handleSubmit} className="auction-form">
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Vintage Camera"
              required
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your item in detail..."
              rows="5"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Home">Home</option>
                <option value="Books">Books</option>
                <option value="Toys">Toys</option>
                <option value="Sports">Sports</option>
                <option value="Art">Art</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Starting Price ($) *</label>
              <input
                type="number"
                name="startingPrice"
                value={formData.startingPrice}
                onChange={handleChange}
                placeholder="100"
                min="1"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Auction End Time *</label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Upload New Images (Optional, max 5)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="file-input"
            />
            <small className="help-text">Leave empty to keep existing images</small>
          </div>

          {imagePreviews.length > 0 && (
            <div className="image-previews">
              <label>{images.length > 0 ? 'New Images' : 'Current Images'}</label>
              <div className="preview-grid">
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="preview-item">
                    <img src={preview} alt={`Preview ${idx + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate(`/auction/${id}`)}
            >
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Updating...' : 'Update Auction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAuction;

