/**
 * Mobile Money Payment Integration
 * Supports: Paystack, Flutterwave, Bank Transfer
 */

import {
  generateWhatsAppPaymentRequest as generateWhatsAppPaymentRequestFromWhatsApp,
  getWhatsAppLink as getWhatsAppLinkFromWhatsApp,
} from './whatsappIntegration';

export const getWhatsAppLink = (phoneNumber, message) =>
  getWhatsAppLinkFromWhatsApp(phoneNumber, message);

export const generateWhatsAppPaymentRequest = (order, paymentDetails = {}) =>
  generateWhatsAppPaymentRequestFromWhatsApp(order, paymentDetails);

/**
 * Initialize Paystack Payment
 * @param {Object} config - Configuration with publicKey, businessName
 */
export const initializePaystackPayment = (config) => {
  const { publicKey, businessName } = config;

  // Load Paystack script dynamically
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => {
      if (window.PaystackPop) {
        resolve({
          provider: 'paystack',
          ready: true,
          publicKey,
        });
      } else {
        reject(new Error('Paystack failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Paystack'));
    document.body.appendChild(script);
  });
};

/**
 * Initiate Paystack payment
 */
export const initiatePaystackPayment = (order, config) => {
  return new Promise((resolve, reject) => {
    if (!window.PaystackPop) {
      reject(new Error('Paystack not loaded'));
      return;
    }

    const handler = window.PaystackPop.setup({
      key: config.publicKey,
      email: order.customerInfo?.email || 'customer@openmart.com',
      amount: order.total * 100, // Paystack uses kobo
      ref: order.id,
      currency: 'NGN',
      onClose: () => {
        reject(new Error('Payment window closed'));
      },
      onSuccess: (response) => {
        resolve({
          provider: 'paystack',
          status: 'success',
          reference: response.reference,
          transactionId: response.transaction,
          message: 'Payment successful',
        });
      },
    });

    handler.openIframe();
  });
};

/**
 * Payment Verification
 * Verification is handled manually via WhatsApp proof of payment or securely server-to-server.
 */

/**
 * Flutterwave Payment Integration
 */
export const initializeFlutterwavePayment = (config) => {
  const { publicKey } = config;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.onload = () => {
      if (window.FlutterwaveCheckout) {
        resolve({
          provider: 'flutterwave',
          ready: true,
          publicKey,
        });
      } else {
        reject(new Error('Flutterwave failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Flutterwave'));
    document.body.appendChild(script);
  });
};

/**
 * Initiate Flutterwave payment
 */
export const initiateFlutterwavePayment = (order, config) => {
  return new Promise((resolve, reject) => {
    if (!window.FlutterwaveCheckout) {
      reject(new Error('Flutterwave not loaded'));
      return;
    }

    window.FlutterwaveCheckout({
      public_key: config.publicKey,
      tx_ref: order.id,
      amount: order.total,
      currency: 'NGN',
      payment_options: 'card,banktransfer,ussd,mobilemoneyghana,mobilemoneyrwanda,mobilemoneytz,mobilemoneyuganda',
      customer: {
        email: order.customerInfo?.email || 'customer@openmart.com',
        phone_number: order.customerInfo?.phone || '',
        name: order.customerInfo?.name || 'Customer',
      },
      customizations: {
        title: 'OpenMart Supermarket',
        description: `Order #${order.id}`,
        logo: 'https://assets.flutterwave.com/img/hero/hero_two.svg',
      },
      callback: (data) => {
        if (data.status === 'successful') {
          resolve({
            provider: 'flutterwave',
            status: 'success',
            reference: data.transaction_id,
            flwRef: data.flw_ref,
          });
        } else {
          reject(new Error('Payment failed'));
        }
      },
      onclose: () => {
        reject(new Error('Payment window closed'));
      },
    });
  });
};

/**
 * Generate Bank Transfer Details
 */
export const generateBankTransferDetails = (order, businessAccount) => {
  return {
    orderId: order.id,
    amount: order.total,
    bankName: businessAccount.bankName || 'Moniepoint',
    accountNumber: businessAccount.accountNumber || '8091994873',
    accountName: businessAccount.accountName || 'Shawn Neto-Umeano',
    narration: `Order ${order.id} - ${order.customerInfo?.name || 'Customer'}`,
    reference: `OM-${order.id}`,
    instructions: [
      'Transfer the exact amount shown',
      'Use the Order ID as reference/description',
      'Share the transaction receipt via WhatsApp',
      'Keep the receipt for records',
    ],
  };
};

/**
 * Payment Status Tracker
 */
export const checkPaymentStatus = async (orderId, provider) => {
  // This would connect to your backend API
  try {
    const response = await fetch(`/api/payments/status/${orderId}`, {
      method: 'GET',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      status: 'unknown',
      error: error.message,
    };
  }
};

export const paymentConfig = {
  paystack: {
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
    enabled: !!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
  },
  flutterwave: {
    publicKey: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || '',
    enabled: !!import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY,
  },
  bank: {
    bankName: import.meta.env.VITE_BANK_NAME || 'Moniepoint',
    accountNumber: import.meta.env.VITE_BANK_ACCOUNT || '8091994873',
    accountName: import.meta.env.VITE_BANK_ACCOUNT_NAME || 'Shawn Neto-Umeano',
    enabled: true,
  },
  opay: {
    accountNumber: import.meta.env.VITE_OPAY_ACCOUNT || '8091994873',
    accountName: import.meta.env.VITE_OPAY_ACCOUNT_NAME || 'Shawn Neto-Umeano',
    enabled: true,
  },
  palmpay: {
    accountNumber: import.meta.env.VITE_PALMPAY_ACCOUNT || '9031234567',
    accountName: import.meta.env.VITE_PALMPAY_ACCOUNT_NAME || 'OpenMart Supermarket (PalmPay)',
    enabled: true,
  },
  whatsapp: {
    businessPhoneNumber:
      import.meta.env.VITE_WHATSAPP_BUSINESS_NUMBER ||
      import.meta.env.VITE_WHATSAPP_PHONE ||
      import.meta.env.VITE_BUSINESS_PHONE ||
      '07077760403',
    enabled: true,
  },
};

/**
 * Get available payment methods
 */
export const getAvailablePaymentMethods = () => {
  const methods = [];

  if (paymentConfig.paystack.enabled) {
    methods.push({
      id: 'paystack',
      name: 'Card / Bank Transfer / USSD',
      description: 'Pay securely online using Paystack',
      icon: '💳',
    });
  }

  if (paymentConfig.flutterwave.enabled) {
    methods.push({
      id: 'flutterwave',
      name: 'Flutterwave',
      description: 'Multiple payment options',
      icon: '💰',
    });
  }

  if (paymentConfig.bank.enabled) {
    methods.push({
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Direct bank transfer',
      icon: '🏦',
    });
  }

  if (paymentConfig.opay.enabled) {
    methods.push({
      id: 'opay',
      name: 'OPay Transfer',
      description: 'Transfer directly to our OPay wallet',
      icon: '🟢',
    });
  }

  if (paymentConfig.palmpay.enabled) {
    methods.push({
      id: 'palmpay',
      name: 'PalmPay Transfer',
      description: 'Transfer directly to our PalmPay wallet',
      icon: '🔴',
    });
  }

  if (paymentConfig.whatsapp.enabled) {
    methods.push({
      id: 'whatsapp',
      name: 'WhatsApp Payment',
      description: 'Get payment details via WhatsApp',
      icon: '📱',
    });
  }

  return methods;
};

export default {
  initializePaystackPayment,
  initiatePaystackPayment,
  initializeFlutterwavePayment,
  initiateFlutterwavePayment,
  generateBankTransferDetails,
  checkPaymentStatus,
  getAvailablePaymentMethods,
  paymentConfig,
  getWhatsAppLink,
  generateWhatsAppPaymentRequest,
};
