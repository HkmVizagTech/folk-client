import { callApi } from './api';
import { CONFIG } from '../config';

// Loads Razorpay's checkout.js once (every caller shares the same promise).
let scriptPromise = null;
export const initializeRazorpay = () => {
  if (typeof window !== 'undefined' && window.Razorpay) return Promise.resolve(true);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => { scriptPromise = null; resolve(false); };
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
};

const envKey = () => {
  const k = CONFIG.RAZORPAY_KEY || '';
  return k && !k.includes('your_key_here') ? k : '';
};

// Whether online payment is on, and the PUBLIC key for checkout. Asked from
// the server (which holds the real Razorpay keys), so the website doesn't
// need its own VITE_RAZORPAY_KEY setting. Cached for the session.
let configPromise = null;
export const getPaymentConfig = () => {
  if (!configPromise) {
    configPromise = callApi('paymentConfig')
      .then((c) => ({ enabled: !!c?.enabled, keyId: c?.keyId || envKey(), mode: c?.mode || 'off' }))
      .catch(() => {
        configPromise = null; // retry next time
        const k = envKey();
        return { enabled: !!k, keyId: k, mode: k.startsWith('rzp_live_') ? 'live' : k ? 'test' : 'off' };
      });
  }
  return configPromise;
};

/** Server-side confirmation right after checkout (doesn't wait for the webhook). */
export const verifyPayment = (response) => callApi('verifyPayment', {
  orderId: response.razorpay_order_id,
  paymentId: response.razorpay_payment_id,
  signature: response.razorpay_signature,
});

/**
 * Open Razorpay checkout for an order created by the server.
 * Resolves with 'paid' | 'dismissed'; rejects on errors.
 */
export const openCheckout = async ({ order, description, prefill = {}, onVerifying }) => {
  const loaded = await initializeRazorpay();
  if (!loaded || !window.Razorpay) throw new Error('Razorpay checkout could not load. Check your connection and try again.');
  const cfg = await getPaymentConfig();
  const key = order.keyId || cfg.keyId;
  if (!key) throw new Error('Online payment is not set up yet.');

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key,
      amount: order.amount,
      currency: order.currency || 'INR',
      name: 'FOLK Vizag',
      description,
      order_id: order.id,
      image: '/folk_logo_blue.png',
      prefill,
      theme: { color: '#E8731C' },
      handler: async (response) => {
        try {
          onVerifying?.();
          await verifyPayment(response);
          resolve('paid');
        } catch (e) {
          reject(e);
        }
      },
      modal: { ondismiss: () => resolve('dismissed') },
    });
    rzp.on('payment.failed', (r) => {
      // Razorpay keeps the checkout open so the person can retry; nothing to do here.
      console.warn('Razorpay payment failed:', r?.error?.description);
    });
    rzp.open();
  });
};

/** Donations (free amount). Returns 'paid' | 'dismissed'. */
export const handlePayment = async (user, amount, sevaType, eventId = null) => {
  const order = await callApi('createOrder', { amount: Number(amount), eventId });
  if (!order?.id) throw new Error('Could not create the payment order. Please try again.');
  return openCheckout({
    order,
    description: sevaType,
    prefill: { name: user?.name || user?.displayName || '', email: user?.email || '', contact: user?.phone || '' },
  });
};
