import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import CountdownTimer from "../componets/CountdownTimer";
import { useToast } from "../componets/ToastContainer";
import AutoBidModal from "../componets/AutoBidModal";
import SocialShare from "../componets/SocialShare";
import ReportModal from "../componets/ReportModal";
import ChatModal from "../componets/ChatModal";
import { BASE_URL } from "../config/apiConfig";

const PlaceBid = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [auction, setAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [showAutoBidModal, setShowAutoBidModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const isSeller = localStorage.getItem("isSeller") === "true";

  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/auctions/${auctionId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAuction(res.data);
      } catch (err) {
        console.log(err);
        toast.error("Error fetching auction details");
      }
    };

    fetchAuction();
  }, [auctionId, token]);

  const handleBid = async () => {
    const bidValue = parseFloat(bidAmount);
    
    // Validate bid amount
    if (!bidAmount || isNaN(bidValue) || bidValue <= 0) {
      toast.warning("Please enter a valid bid amount");
      return;
    }

    if (bidValue <= auction.currentBid) {
      toast.warning(`Bid must be higher than current bid: ₹${auction.currentBid}`);
      return;
    }

    // Maximum bid limit
    if (bidValue > 100000000000) {
      toast.error("Bid too large! Maximum allowed is ₹100,000,000,000");
      return;
    }

    try {
      const res = await axios.post(
        `${BASE_URL}/auctions/${auctionId}/bid`,
        { amount: bidValue, userId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Bid placed successfully! 🎉");
      setAuction(res.data);
      setBidAmount("");
    } catch (err) {
      console.log(err);
      toast.error(err.response?.data?.message || "Error placing bid");
    }
  };

  if (!auction) {
    return <h2>Loading auction...</h2>;
  }

  const isAuctionEnded = new Date() > new Date(auction.endTime);

  if (isSeller) {
    return <h2>Access Denied. Sellers cannot bid on their own auction.</h2>;
  }

  return (
    <div style={styles.container}>
      <h2>{auction.title}</h2>
      <p>{auction.description}</p>
      <p>
        <strong>Current Bid:</strong> ₹{auction.currentBid}
      </p>
      <p>
        <strong>Auction Ends:</strong>{" "}
        <CountdownTimer endTime={auction.endTime} />
      </p>

      {isAuctionEnded ? (
        <p style={{ color: "red" }}>Auction Ended</p>
      ) : (
        <div style={styles.bidContainer}>
          <input
            type="number"
            placeholder={`Bid > ${auction.currentBid}`}
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            style={styles.input}
          />
          <button onClick={handleBid} style={styles.button}>
            Place Bid
          </button>
        </div>
      )}

      {!isAuctionEnded && (
        <div style={{marginTop: '16px'}}>
          <button onClick={() => setShowAutoBidModal(true)} style={styles.autoBidButton}>
            🤖 Set Auto-Bid
          </button>
        </div>
      )}

      <div style={{marginTop: '20px'}}>
        <h3>Share this auction:</h3>
        <SocialShare 
          auctionTitle={auction.title}
          auctionId={auction._id}
          currentBid={auction.currentBid}
        />
      </div>

      <div style={{marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'center'}}>
        <button onClick={() => setShowChatModal(true)} style={styles.chatButton}>
          💬 Chat with Seller
        </button>
        <button onClick={() => setShowReportModal(true)} style={styles.reportButton}>
          🚩 Report Auction
        </button>
      </div>

      {showAutoBidModal && (
        <AutoBidModal
          auctionId={auctionId}
          currentBid={auction.currentBid}
          onClose={() => setShowAutoBidModal(false)}
          onSuccess={() => {
            toast.success('Auto-bid set successfully!');
            window.location.reload();
          }}
        />
      )}

      {showReportModal && (
        <ReportModal
          auctionId={auctionId}
          auctionTitle={auction.title}
          onClose={() => setShowReportModal(false)}
          onSuccess={() => toast.success('Report submitted')}
        />
      )}

      {showChatModal && (
        <ChatModal
          auctionId={auctionId}
          auctionTitle={auction.title}
          onClose={() => setShowChatModal(false)}
        />
      )}
    </div>
  );
};

export default PlaceBid;

const styles = {
  container: {
    maxWidth: "500px",
    margin: "30px auto",
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    boxShadow: "2px 2px 10px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  bidContainer: {
    marginTop: "20px",
    display: "flex",
    gap: "10px",
    justifyContent: "center",
  },
  input: {
    padding: "10px",
    fontSize: "16px",
    width: "150px",
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#2196f3",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  autoBidButton: {
    padding: "10px 20px",
    fontSize: "16px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "600",
  },
  chatButton: {
    padding: "10px 20px",
    fontSize: "14px",
    backgroundColor: "#27ae60",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  reportButton: {
    padding: "10px 20px",
    fontSize: "14px",
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};