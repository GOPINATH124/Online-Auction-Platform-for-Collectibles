import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useToast } from './ToastContainer';
import { sendNotification, NotificationTypes, requestNotificationPermission } from '../utils/pushNotifications';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Request notification permission on load
    requestNotificationPermission();

    // Connect to Socket.io server
    const newSocket = io('http://localhost:5000');
    
    newSocket.on('connect', () => {
      console.log('Connected to Socket.io server');
    });

    newSocket.on('new-bid', (data) => {
      toast.info(`🎯 New bid on ${data.auctionId}: $${data.amount} by ${data.bidderName}`);
      
      // Send push notification for new bid on seller's auction
      const userId = localStorage.getItem('userId');
      if (data.sellerId === userId) {
        sendNotification(NotificationTypes.BID_PLACED, {
          bidderName: data.bidderName,
          bidAmount: data.amount,
          auctionTitle: data.auctionTitle,
          auctionId: data.auctionId,
          auctionImage: data.auctionImage
        });
      }
    });

    // Listen for outbid notifications
    newSocket.on('outbid', (data) => {
      toast.warning(`😞 You have been outbid on ${data.auctionTitle}`);
      sendNotification(NotificationTypes.OUTBID, {
        auctionTitle: data.auctionTitle,
        currentBid: data.currentBid,
        auctionId: data.auctionId,
        auctionImage: data.auctionImage
      });
    });

    // Listen for auction won notifications
    newSocket.on('auction-won', (data) => {
      toast.success(`🎉 Congratulations! You won ${data.auctionTitle}!`);
      sendNotification(NotificationTypes.AUCTION_WON, {
        auctionTitle: data.auctionTitle,
        winningBid: data.winningBid,
        auctionId: data.auctionId,
        auctionImage: data.auctionImage
      });
    });

    // Listen for new chat messages
    newSocket.on('new-chat-message', (data) => {
      // Only notify if not on the chat page
      if (!window.location.pathname.includes('/auctions/')) {
        sendNotification(NotificationTypes.NEW_MESSAGE, {
          senderName: data.senderName,
          message: data.message,
          auctionId: data.auctionId,
          chatId: data.chatId
        });
      }
    });

    // Listen for payment notifications
    newSocket.on('payment-confirmed', (data) => {
      toast.success(`✅ ${data.message}`);
    });

    newSocket.on('payment-received', (data) => {
      toast.success(`💰 Payment received: $${data.amount} for "${data.auctionTitle}"`);
    });

    newSocket.on('payment-refunded', (data) => {
      toast.info(`🔄 Refund processed for "${data.auctionTitle}"`);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
    });

    // Join user-specific room for personal notifications
    const userId = localStorage.getItem('userId');
    if (userId) {
      newSocket.emit('join-user-room', userId);
    }

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinAuction = (auctionId) => {
    if (socket) {
      socket.emit('join-auction', auctionId);
    }
  };

  const leaveAuction = (auctionId) => {
    if (socket) {
      socket.emit('leave-auction', auctionId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, joinAuction, leaveAuction }}>
      {children}
    </SocketContext.Provider>
  );
};
