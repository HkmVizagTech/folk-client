import { callApi } from './api';
import { CONFIG } from '../config';

export const initializeRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const handlePayment = async (user, amount, sevaType, eventId = null) => {
  try {
    if (!CONFIG.RAZORPAY_KEY || CONFIG.RAZORPAY_KEY.includes('your_key_here') || CONFIG.RAZORPAY_KEY === 'rzp_test_your_key_here') {
      throw new Error("Razorpay key is not configured. Set VITE_RAZORPAY_KEY in your .env.local");
    }

    console.log(`Initializing Razorpay payment for ${user.displayName}: ₹${amount} for ${sevaType}`);
    
    // 1. Create Order on Backend
    const order = await callApi('createOrder', { 
      amount: parseFloat(amount), 
      eventId 
    });

    if (!order || !order.id) {
      throw new Error("Failed to create Razorpay order on backend.");
    }

    // 2. Initialize Razorpay UI
    const options = {
      key: CONFIG.RAZORPAY_KEY,
      amount: order.amount, // Result from backend in paise
      currency: order.currency,
      name: 'Folk Vizag',
      description: `Donation for ${sevaType}`,
      order_id: order.id,
      image: 'https://cdn-icons-png.flaticon.com/512/3354/3354519.png',
      handler: async function (response) {
        // Source of truth is the backend webhook (/razorpayWebhook), which
        // marks the order-keyed payments doc "completed"/"verified". Nothing
        // extra is written here to avoid duplicate payment records.
        alert(`Payment Successful! ID: ${response.razorpay_payment_id}`);
      },
      prefill: {
        name: user.name || user.displayName,
        email: user.email,
        contact: user.mobile || ''
      },
      theme: {
        color: '#FF9933',
      },
      modal: {
        ondismiss: function() {
          console.log('Checkout modal closed');
        }
      }
    };

    const rzp1 = new window.Razorpay(options);
    rzp1.open();

  } catch (error) {
    console.error("Payment initialization error:", error);
    alert(`Could not start payment: ${error.message}`);
  }
};
