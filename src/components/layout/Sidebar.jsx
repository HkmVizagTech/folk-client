import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../ui/Avatar';
import { cn } from '../../lib/utils';
import { visibleGroups, roleLabel } from './navConfig';

/** Desktop (lg+) navigation: fixed maroon rail, grouped by purpose. */
const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const groups = visibleGroups(user?.role);
  const name = user?.name || user?.displayName || 'Member';

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-gradient-to-b from-navy-800 via-navy-700 to-navy-900 text-white z-40">
      <button
        type="button"
        onClick={() => setActiveTab('dashboard')}
        className="h-[72px] px-5 flex items-center gap-3 border-b border-white/10 shrink-0 text-left"
        aria-label="FOLK Vizag home"
      >
        <img src="/folk_logo_white.png" alt="" className="h-10 w-auto" />
        <span className="leading-tight">
          <span className="block font-display text-[16px] font-semibold">FOLK Vizag</span>
          <span className="block text-[12px] text-white/60">Youth Empowerment Club</span>
        </span>
      </button>

      <nav className="flex-1 overflow-y-auto scrollbar-hide py-5 px-3 space-y-6" aria-label="App">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-marigold-light/70">{g.title}</p>
            <ul className="space-y-0.5">
              {g.items.map(({ id, label, icon: Icon }) => {
                const active = activeTab === id || (id === 'trips' && activeTab === 'trip-detail');
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => setActiveTab(id)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group relative w-full flex items-center gap-3 px-3 h-10 rounded-xl text-[15px] transition-colors',
                        active ? 'bg-white/12 text-white font-semibold' : 'text-white/75 hover:bg-white/8 hover:text-white',
                      )}
                    >
                      {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-marigold" aria-hidden="true" />}
                      <Icon size={18} aria-hidden="true" className={active ? 'text-marigold-light' : 'text-white/60 group-hover:text-white'} />
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className="flex-1 min-w-0 flex items-center gap-3 p-2 rounded-xl hover:bg-white/8 text-left"
        >
          <Avatar name={name} src={user?.photo} size="md" className="ring-white/30" />
          <span className="min-w-0">
            <span className="block text-[14px] font-semibold truncate">{name}</span>
            <span className="block text-[12px] text-white/60">{roleLabel(user?.role)}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={logout}
          className="w-10 h-10 shrink-0 inline-flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10"
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
