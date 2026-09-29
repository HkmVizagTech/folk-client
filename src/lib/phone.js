// Same normalisation as the server's otpService.normalizePhone: any Indian
// number format → '91XXXXXXXXXX'. Stored as users/{uid}.phoneNormalized so
// phone login can find an account with one indexed query.
export const normalizePhone = (phone) => {
  let p = String(phone || '').replace(/\D/g, '');
  if (p.startsWith('0')) p = p.slice(1);
  if (p.length === 10) p = `91${p}`;
  return p;
};

export const isValidIndianPhone = (phone) => /^91[6-9]\d{9}$/.test(normalizePhone(phone));

/** Pretty form for display: +91 98765 43210 */
export const formatPhone = (phone) => {
  const p = normalizePhone(phone);
  return /^91\d{10}$/.test(p) ? `+91 ${p.slice(2, 7)} ${p.slice(7)}` : String(phone || '');
};

export const whatsappUrl = (phone, text = '') => {
  const p = normalizePhone(phone);
  if (!p) return '';
  return `https://wa.me/${p}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};

export const telUrl = (phone) => {
  const p = normalizePhone(phone);
  return p ? `tel:+${p}` : '';
};
