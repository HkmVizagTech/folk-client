import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { visibleGroups, roleLabel } from './navConfig';

const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || 'F';

/** Desktop (lg+) navigation: fixed dark rail, grouped by purpose. */
const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const groups = visibleGroups(user?.role);
  const name = user?.name || user?.displayName || 'Member';

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-white text-ink border-r border-line z-40">
      <button
        type="button"
        onClick={() => setActiveTab('dashboard')}
        className="h-[72px] px-5 flex items-center gap-3 border-b border-line shrink-0 text-left"
        aria-label="FOLK Vizag home"
      >
        <img src="/folk_logo_blue.png" alt="" className="h-11 w-auto" />
        <span className="leading-tight">
          <span className="block font-display text-[16px] font-semibold text-navy">FOLK Vizag</span>
          <span className="block text-[12px] text-ink-muted">Youth Empowerment Club</span>
        </span>
      </button>

      <nav className="flex-1 overflow-y-auto scrollbar-hide py-5 px-3 space-y-6" aria-label="App">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="px-3 mb-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted/80">{g.title}</p>
            <ul className="space-y-0.5">
              {g.items.map(({ id, label, icon: Icon }) => {
                const active = activeTab === id || (id === 'trips' && activeTab === 'trip-detail');
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => setActiveTab(id)}
                      aria-current={active ? 'page' : undefined}
                      className={`w-full flex items-center gap-3 px-3 h-10 rounded-lg text-[15px] transition-colors ${
                        active ? 'bg-saffron-50 text-saffron-dark font-semibold shadow-[inset_3px_0_0_#E8731C]' : 'text-ink hover:bg-paper'
                      }`}
                    >
                      <Icon size={18} aria-hidden="true" />
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className="flex-1 min-w-0 flex items-center gap-3 p-2 rounded-lg hover:bg-paper text-left"
        >
          <span className="w-9 h-9 shrink-0 rounded-full bg-navy text-white font-display text-sm font-bold inline-flex items-center justify-center overflow-hidden">
            {user?.photo && !String(user.photo).includes('dicebear')
              ? <img src={user.photo} alt="" className="w-full h-full object-cover" />
              : initials(name)}
          </span>
          <span className="min-w-0">
            <span className="block text-[14px] font-semibold truncate">{name}</span>
            <span className="block text-[12px] text-ink-muted">{roleLabel(user?.role)}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={logout}
          className="w-10 h-10 shrink-0 inline-flex items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-paper"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
