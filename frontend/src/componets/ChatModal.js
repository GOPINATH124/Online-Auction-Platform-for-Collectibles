import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSocket } from './SocketContext';
import { BASE_URL } from '../config/apiConfig';
import './ChatModal.css';

function ChatModal({ auctionId, auctionTitle, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatId, setChatId] = useState(null);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const { socket } = useSocket();

  useEffect(() => {
    fetchChat();
    
    // Join chat room
    if (socket) {
      socket.emit('join-chat', auctionId);

      const handleNewMessage = (data) => {
        if (data.chatId === chatId) {
          setMessages(prev => [...prev, data.message]);
          scrollToBottom();
        }
      };

      socket.on('new-message', handleNewMessage);
    }

    return () => {
      if (socket) {
        socket.emit('leave-chat', auctionId);
        socket.off('new-message');
      }
    };
  }, [auctionId, socket, chatId]);

  const fetchChat = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/chat/${auctionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChatId(res.data.chat._id);
      setMessages(res.data.chat.messages || []);
      setLoading(false);
      scrollToBottom();
      
      // Mark messages as read
      await axios.put(
        `${BASE_URL}/chat/${auctionId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Error fetching chat:', err);
      alert(err.response?.data?.message || 'Error loading chat. You must bid on this auction to chat.');
      onClose();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await axios.post(
        `${BASE_URL}/chat/${auctionId}/message`,
        { message: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage('');
      setSending(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error sending message');
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 minute
    if (diff < 60000) return 'Just now';
    
    // Less than 1 hour
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins}m ago`;
    }
    
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }
    
    // Show date
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-header">
          <div>
            <h2>💬 Chat</h2>
            <p className="chat-subtitle">{auctionTitle}</p>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="no-messages">
              <p>👋 No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.senderId === userId ? 'own-message' : 'other-message'}`}
              >
                <div className="message-content">
                  {msg.senderId !== userId && (
                    <div className="message-sender">{msg.senderName}</div>
                  )}
                  <div className="message-text">{msg.message}</div>
                  <div className="message-time">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
          />
          <button type="submit" disabled={sending || !newMessage.trim()}>
            {sending ? '...' : '➤'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatModal;

