import { useState } from 'react';
import { handlePayment } from '../../../lib/razorpay';
import { useAuth } from '../../../hooks/useAuth';
import { CAUSES, presetsFor, formatINR } from '../lib/causes';

// Payments are never optimistic: the result is only shown once the gateway confirms.
export const useDonation = () => {
  const { user } = useAuth();
  const [selected, setSelected] = useState(CAUSES[0].id);
  const [amount, setAmount] = useState(String(CAUSES[0].preset));
  const [paying, setPaying] = useState(false);
  const [result, setResult] = useState(null); // { tone: 'ok' | 'err', text }

  const cause = CAUSES.find((c) => c.id === selected);
  const canDonate = !paying && Number(amount) >= 1;

  const selectCause = (c) => { setSelected(c.id); setAmount(String(c.preset)); };

  const donate = async () => {
    setPaying(true);
    setResult(null);
    try {
      const outcome = await handlePayment(user, amount, `${cause.title} donation`);
      if (outcome === 'paid') setResult({ tone: 'ok', text: `Thank you! Your donation of ${formatINR(amount)} is received. Hare Krishna.` });
    } catch (error) {
      setResult({ tone: 'err', text: error.message || 'The payment could not be completed. Please try again.' });
    } finally {
      setPaying(false);
    }
  };

  return { cause, selected, selectCause, amount, setAmount, presets: presetsFor(selected), paying, canDonate, donate, result };
};
