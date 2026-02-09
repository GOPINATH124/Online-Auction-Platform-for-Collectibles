// Request permission for push notifications
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

// Show push notification
export const showNotification = (title, options = {}) => {
    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            icon: '/logo192.png',
            badge: '/logo192.png',
            vibrate: [200, 100, 200],
            ...options
        });

        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000);

        // Click handler
        notification.onclick = () => {
            window.focus();
            if (options.url) {
                window.location.href = options.url;
            }
            notification.close();
        };

        return notification;
    }
    return null;
};

// Notification types
export const NotificationTypes = {
    OUTBID: 'outbid',
    AUCTION_ENDING: 'auction_ending',
    AUCTION_WON: 'auction_won',
    NEW_MESSAGE: 'new_message',
    PAYMENT_REMINDER: 'payment_reminder',
    BID_PLACED: 'bid_placed'
};

// Send notification based on type
export const sendNotification = (type, data) => {
    switch (type) {
        case NotificationTypes.OUTBID:
            return showNotification('You have been outbid! 😞', {
                body: `Someone placed a higher bid on "${data.auctionTitle}". Current bid: $${data.currentBid}`,
                icon: data.auctionImage || '/logo192.png',
                tag: `outbid-${data.auctionId}`,
                url: `/auctions/${data.auctionId}`
            });

        case NotificationTypes.AUCTION_ENDING:
            return showNotification('⏰ Auction Ending Soon!', {
                body: `"${data.auctionTitle}" ends in ${data.timeRemaining}. Place your bid now!`,
                icon: data.auctionImage || '/logo192.png',
                tag: `ending-${data.auctionId}`,
                url: `/auctions/${data.auctionId}`,
                requireInteraction: true
            });

        case NotificationTypes.AUCTION_WON:
            return showNotification('🎉 Congratulations! You Won!', {
                body: `You won "${data.auctionTitle}" for $${data.winningBid}. Complete payment within 24 hours.`,
                icon: data.auctionImage || '/logo192.png',
                tag: `won-${data.auctionId}`,
                url: `/payment/${data.auctionId}`,
                requireInteraction: true
            });

        case NotificationTypes.NEW_MESSAGE:
            return showNotification('💬 New Message', {
                body: `${data.senderName}: ${data.message}`,
                icon: '/logo192.png',
                tag: `message-${data.chatId}`,
                url: `/auctions/${data.auctionId}`
            });

        case NotificationTypes.PAYMENT_REMINDER:
            return showNotification('💳 Payment Reminder', {
                body: `Payment for "${data.auctionTitle}" is due. Complete payment to finalize purchase.`,
                icon: data.auctionImage || '/logo192.png',
                tag: `payment-${data.auctionId}`,
                url: `/payment/${data.auctionId}`,
                requireInteraction: true
            });

        case NotificationTypes.BID_PLACED:
            return showNotification('🎯 New Bid on Your Auction', {
                body: `${data.bidderName} placed a bid of $${data.bidAmount} on "${data.auctionTitle}"`,
                icon: data.auctionImage || '/logo192.png',
                tag: `bid-${data.auctionId}`,
                url: `/auctions/${data.auctionId}`
            });

        default:
            return null;
    }
};

// Check if notifications are enabled
export const areNotificationsEnabled = () => {
    return 'Notification' in window && Notification.permission === 'granted';
};
