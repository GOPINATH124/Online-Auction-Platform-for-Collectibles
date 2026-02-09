import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoice = (auction, transactionId, paymentDetails) => {
  const doc = new jsPDF();
  
  // Colors
  const primaryColor = [102, 126, 234];
  const darkColor = [51, 51, 51];
  const lightColor = [128, 128, 128];

  // Header with logo
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont(undefined, 'bold');
  doc.text('AUCTION PLATFORM', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text('Payment Receipt & Invoice', 105, 30, { align: 'center' });

  // Reset text color
  doc.setTextColor(...darkColor);

  // Invoice Details Box
  doc.setFillColor(245, 245, 245);
  doc.rect(15, 50, 180, 30, 'F');
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('Invoice Number:', 20, 60);
  doc.text('Transaction ID:', 20, 68);
  doc.text('Payment Date:', 20, 76);
  
  doc.setFont(undefined, 'normal');
  doc.text(transactionId, 70, 60);
  doc.text(transactionId, 70, 68);
  doc.text(new Date(paymentDetails.paidAt).toLocaleString(), 70, 76);

  doc.setFont(undefined, 'bold');
  doc.text('Payment Method:', 130, 60);
  doc.text('Status:', 130, 68);
  
  doc.setFont(undefined, 'normal');
  doc.text(paymentDetails.method, 170, 60);
  doc.setTextColor(34, 197, 94);
  doc.text('PAID', 170, 68);
  doc.setTextColor(...darkColor);

  // Buyer & Seller Information
  let yPos = 95;
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Buyer Information', 20, yPos);
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  yPos += 8;
  doc.text(`Name: ${localStorage.getItem('userName') || 'Buyer'}`, 20, yPos);
  yPos += 6;
  doc.text(`Email: ${localStorage.getItem('userEmail') || 'N/A'}`, 20, yPos);

  yPos += 15;
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Seller Information', 20, yPos);
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  yPos += 8;
  doc.text(`Seller ID: ${auction.seller}`, 20, yPos);

  // Item Details Table
  yPos += 15;
  autoTable(doc, {
    startY: yPos,
    head: [['Item Description', 'Category', 'Winning Bid']],
    body: [
      [
        auction.title,
        auction.category || 'N/A',
        `$${auction.currentBid.toLocaleString()}`
      ]
    ],
    headStyles: {
      fillColor: primaryColor,
      fontSize: 11,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 50 },
      2: { cellWidth: 40, halign: 'right' },
    },
    theme: 'grid',
  });

  // Auction Details
  yPos = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Auction Details', 20, yPos);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  yPos += 8;
  doc.text(`Started: ${new Date(auction.createdAt).toLocaleDateString()}`, 20, yPos);
  yPos += 6;
  doc.text(`Ended: ${new Date(auction.endTime).toLocaleDateString()}`, 20, yPos);
  yPos += 6;
  doc.text(`Total Bids: ${auction.bids?.length || 0}`, 20, yPos);

  // Payment Summary
  yPos += 15;
  autoTable(doc, {
    startY: yPos,
    body: [
      ['Item Total', `$${auction.currentBid.toLocaleString()}`],
      ['Processing Fee', '$0.00'],
      ['Tax', '$0.00'],
    ],
    bodyStyles: {
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 140, fontStyle: 'bold' },
      1: { cellWidth: 40, halign: 'right' },
    },
    theme: 'plain',
  });

  // Total Amount Box
  yPos = doc.lastAutoTable.finalY + 2;
  doc.setFillColor(...primaryColor);
  doc.rect(15, yPos, 180, 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('TOTAL PAID', 20, yPos + 8);
  doc.text(`$${auction.currentBid.toLocaleString()}`, 190, yPos + 8, { align: 'right' });
  
  doc.setTextColor(...darkColor);

  // Footer
  yPos = 270;
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...lightColor);
  doc.text('Thank you for your purchase!', 105, yPos, { align: 'center' });
  yPos += 5;
  doc.text('For support, contact: support@auctionplatform.com', 105, yPos, { align: 'center' });
  yPos += 5;
  doc.text('Generated on: ' + new Date().toLocaleString(), 105, yPos, { align: 'center' });

  // Save the PDF
  doc.save(`Invoice-${transactionId}.pdf`);
};

export const generateReceipt = (auction, transactionId, paymentDetails) => {
  const doc = new jsPDF();
  
  const primaryColor = [102, 126, 234];
  const darkColor = [51, 51, 51];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 50, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont(undefined, 'bold');
  doc.text('RECEIPT', 105, 25, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'normal');
  doc.text('Payment Successful', 105, 38, { align: 'center' });

  // Checkmark
  doc.setTextColor(34, 197, 94);
  doc.setFontSize(48);
  doc.text('✓', 105, 75, { align: 'center' });

  doc.setTextColor(...darkColor);

  // Transaction Details
  let yPos = 95;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Transaction ID:', 105, yPos, { align: 'center' });
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(transactionId, 105, yPos, { align: 'center' });

  yPos += 15;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Payment Date:', 105, yPos, { align: 'center' });
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(new Date(paymentDetails.paidAt).toLocaleString(), 105, yPos, { align: 'center' });

  // Item Details Box
  yPos += 20;
  doc.setFillColor(245, 245, 245);
  doc.rect(30, yPos, 150, 50, 'F');
  
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(auction.title, 105, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(auction.description.substring(0, 80) + '...', 105, yPos, { align: 'center' });

  yPos += 15;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Amount Paid:', 105, yPos, { align: 'center' });
  yPos += 10;
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.text(`$${auction.currentBid.toLocaleString()}`, 105, yPos, { align: 'center' });

  doc.setTextColor(...darkColor);

  // Payment Method
  yPos += 20;
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Payment Method: ${paymentDetails.method}`, 105, yPos, { align: 'center' });

  // Footer
  yPos = 270;
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text('This is a computer-generated receipt', 105, yPos, { align: 'center' });
  yPos += 5;
  doc.text('No signature required', 105, yPos, { align: 'center' });

  // Save the PDF
  doc.save(`Receipt-${transactionId}.pdf`);
};
