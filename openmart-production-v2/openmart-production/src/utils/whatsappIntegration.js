/**
 * WhatsApp Integration Module
 * Enables order notifications and payment requests via WhatsApp
 */

export const DEFAULT_BUSINESS_PHONE_NUMBER = '07077760403';

export const generateWhatsAppMessage = (order) => {
  const { id, items, total, customerInfo, subtotal, tax, shippingCost } = order;

  const itemsList = items
    .map((item) => `• ${item.name} x${item.quantity} - ₦${(item.price * item.quantity).toFixed(2)}`)
    .join('\n');

  const message = `
🛍️ *OPENMART SUPERMARKET - ORDER CONFIRMATION*

Order ID: ${id}
Date: ${new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}

👤 *Customer Name:* ${customerInfo?.name || 'Valued Customer'}
📱 *Phone:* ${customerInfo?.phone || 'N/A'}
📍 *Delivery Address:* ${customerInfo?.address || 'N/A'}

📦 *Items Ordered:*
${itemsList}

💰 *Price Breakdown:*
Subtotal: ₦${subtotal?.toFixed(2) || '0.00'}
Tax (VAT): ₦${tax?.toFixed(2) || '0.00'}
Shipping: ₦${shippingCost?.toFixed(2) || '0.00'}
─────────────────
*TOTAL: ₦${total.toFixed(2)}*

✅ Status: Pending Payment
⏱️ Estimated Delivery: 24-48 hours

📞 *Contact Us:*
WhatsApp: 07077760403
Email: support@openmart.com

Thank you for shopping with OpenMart! 🙏
  `.trim();

  return message;
};

export const generateWhatsAppPaymentRequest = (order, paymentDetails = {}) => {
  const bankName = paymentDetails.bankName || 'Moniepoint';
  const accountNumber = paymentDetails.accountNumber || '8091994873';
  const accountName = paymentDetails.accountName || 'Shawn Neto-Umeano';

  const message = `
💳 *PAYMENT REQUEST - ${order.id}*

Amount Due: ₦${order.total.toFixed(2)}

*Bank Transfer:*
Bank: ${bankName}
Account: ${accountNumber}
Name: ${accountName}

*USSD (Instant):*
Dial: *929*01#
or
*737*01#

After payment, please reply with:
✅ Proof of payment/receipt
✅ Order ID: ${order.id}
✅ Payment reference

Thank you! 🙏
  `.trim();

  return message;
};

/**
 * Build WhatsApp message link
 * Usage: Open in browser or mobile
 */
export const getWhatsAppLink = (phoneNumber, message) => {
  const encoded = encodeURIComponent(message);
  let rawPhone = phoneNumber || '07077760403';
  let cleanPhone = rawPhone.replace(/\D/g, '');
  
  if (cleanPhone.endsWith('7077760403')) {
    cleanPhone = '2347077760403';
  } else {
    if (cleanPhone.startsWith('234')) {
      // already has country code
    } else if (cleanPhone.startsWith('0')) {
      cleanPhone = `234${cleanPhone.slice(1)}`;
    } else {
      cleanPhone = `234${cleanPhone}`;
    }
  }

  return `https://wa.me/${cleanPhone}?text=${encoded}`;
};

/**
 * Send order confirmation via WhatsApp
 * (In production, use Twilio, MessageBird, or similar service)
 */
export const sendOrderConfirmation = async (order, businessPhoneNumber) => {
  const message = generateWhatsAppMessage(order);
  const whatsappLink = getWhatsAppLink(businessPhoneNumber || DEFAULT_BUSINESS_PHONE_NUMBER, message);

  // For now, return the link for manual sharing
  // In production, use WhatsApp Business API with Twilio/MessageBird
  return {
    success: true,
    link: whatsappLink,
    message,
    method: 'manual', // 'manual' or 'api' when integrated
  };
};

/**
 * Create WhatsApp group invite link for customer support
 */
export const getWhatsAppGroupLink = (groupCode) => {
  return `https://chat.whatsapp.com/${groupCode}`;
};

/**
 * Format order for WhatsApp display
 */
export const formatOrderForWhatsApp = (order) => {
  return {
    orderId: order.id,
    status: order.status,
    message: generateWhatsAppMessage(order),
    paymentMessage: generateWhatsAppPaymentRequest(order),
    timestamp: new Date().toISOString(),
  };
};

export default {
  generateWhatsAppMessage,
  generateWhatsAppPaymentRequest,
  getWhatsAppLink,
  sendOrderConfirmation,
  getWhatsAppGroupLink,
  formatOrderForWhatsApp,
};
