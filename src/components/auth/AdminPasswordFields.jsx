import React from 'react';
import { MIN_ADMIN_PASSWORD_LENGTH } from '../../lib/adminLogin';

/**
 * New-password + confirm inputs for the shared admin login. Leaving both
 * empty lets the server fall back to its ADMIN_PASSWORD env var.
 */
const AdminPasswordFields = ({ password, confirm, onPasswordChange, onConfirmChange, disabled = false, dark = false }) => {
  const inputClass = dark
    ? 'w-full px-3 py-2.5 bg-gray-900/70 border border-gray-700/60 rounded-xl outline-none focus:border-saffron/70 text-gray-200 text-xs placeholder:text-gray-600'
    : 'w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-saffron text-gray-700 text-xs placeholder:text-gray-400';
  const hintClass = dark ? 'text-[10px] text-gray-500' : 'text-[11px] text-gray-400';

  return (
    <div className="space-y-2">
      <input
        type="password"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        placeholder={`New admin password (${MIN_ADMIN_PASSWORD_LENGTH}+ characters)`}
        autoComplete="new-password"
        disabled={disabled}
        className={inputClass}
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => onConfirmChange(e.target.value)}
        placeholder="Repeat the password"
        autoComplete="new-password"
        disabled={disabled}
        className={inputClass}
      />
      <p className={`${hintClass} leading-relaxed`}>
        Share it only with the people who run the site. Leave both empty to use the
        password configured on the server (ADMIN_PASSWORD).
      </p>
    </div>
  );
};

export default AdminPasswordFields;
