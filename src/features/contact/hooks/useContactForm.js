import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from '../../../lib/pgstore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../hooks/useAuth';
import { TOPICS, MIN_LENGTH, MAX_LENGTH } from '../lib/topics';

/** Messages are stored for the FOLK team to read in the Command Center. */
export const useContactForm = () => {
  const { user } = useAuth();
  const [topic, setTopic] = useState(TOPICS[0]);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  const canSend = status !== 'sending' && text.trim().length >= MIN_LENGTH;

  const submit = async (e) => {
    e.preventDefault();
    const message = text.trim();
    if (message.length < MIN_LENGTH) return;
    setStatus('sending');
    try {
      await addDoc(collection(db, 'contact_messages'), {
        userId: user.uid,
        name: user.name || user.displayName || 'Member',
        phone: user.phone || user.phoneNumber || '',
        email: user.email || '',
        topic,
        message: message.slice(0, MAX_LENGTH),
        status: 'new',
        createdAt: serverTimestamp(),
      });
      setText('');
      setStatus('sent');
    } catch (err) {
      console.error('Contact message failed:', err);
      setStatus('error');
    }
  };

  return { topic, setTopic, text, setText, status, canSend, submit, reset: () => setStatus('idle') };
};
