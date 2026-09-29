import React, { useEffect, useState } from 'react';
import { LayoutGrid, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { MOBILE_PRIMARY, STAFF, findNavItem, visibleGroups } from './navConfig';

/**
 * Phones and tablets: four fixed tabs plus "More", which opens a sheet with
 * everything else. Replaces the old strip of 11 sideways-scrolling icons.
 */
const BottomNav = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const isStaff = STAFF.includes(user?.role);
  const primary = (isStaff ? MOBILE_PRIMARY.staff : MOBILE_PRIMARY.devotee).map(findNavItem).filter(Boolean);
  const inPrimary = primary.some((i) => i.id === activeTab || (i.id === 'trips' && activeTab === 'trip-detail'));

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e) => e.key === 'Escape' && setMoreOpen(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [moreOpen]);

  const go = (id) => { setMoreOpen(false); setActiveTab(id); };

  const Tab = ({ id, label, icon: Icon, active, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-1 h-full ${active ? 'text-saffron' : 'text-ink-muted'}`}
    >
      <Icon size={22} strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
      <span className={`text-[11px] leading-none truncate max-w-full ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
      <span className={`h-0.5 w-6 rounded-full ${active ? 'bg-saffron' : 'bg-transparent'}`} />
    </button>
  );

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-[90] bg-white border-t border-line"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="App"
      >
        <div className="h-16 flex items-stretch">
          {primary.map((i) => (
            <Tab
              key={i.id}
              {...i}
              active={activeTab === i.id || (i.id === 'trips' && activeTab === 'trip-detail')}
              onClick={() => go(i.id)}
            />
          ))}
          <Tab id="more" label="More" icon={LayoutGrid} active={moreOpen || !inPrimary} onClick={() => setMoreOpen(true)} />
        </div>
      </nav>

      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-[150]" role="dialog" aria-modal="true" aria-label="All sections">
          <div className="absolute inset-0 bg-ink/60" onClick={() => setMoreOpen(false)} />
          <div
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="sticky top-0 bg-white px-5 h-14 flex items-center justify-between border-b border-line">
              <h2 className="font-display font-bold">All sections</h2>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close" className="w-10 h-10 inline-flex items-center justify-center rounded-md hover:bg-paper">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-5">
              {visibleGroups(user?.role).map((g) => (
                <section key={g.title}>
                  <h3 className="px-1 mb-2 font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted">{g.title}</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {g.items.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => go(id)}
                        className={`flex flex-col items-center justify-center gap-2 h-20 rounded-lg border text-center px-1 ${
                          activeTab === id ? 'border-saffron bg-saffron-50 text-saffron-dark' : 'border-line text-ink hover:bg-paper'
                        }`}
                      >
                        <Icon size={22} aria-hidden="true" />
                        <span className="text-[12px] font-semibold leading-tight">{label}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNav;
