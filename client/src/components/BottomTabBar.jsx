import { NavLink } from 'react-router';
import { LayoutGrid } from 'lucide-react';

// App-style navigation for phones and tablets (below lg): 4 main pages + "More", fixed to the bottom
// where the thumb reaches. `tabs` are menu items from AppLayout; the one with `featured` (the member's
// QR code) is a big round button in the middle. "More" opens the sheet with all other pages.
function BottomTabBar({ tabs, isMoreActive, isMoreOpen, onMore }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(0,0,0,0.05)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {tabs.map((tab) => (
          <li key={tab.to} className="flex">
            {tab.featured ? <FeaturedTab tab={tab} /> : <Tab tab={tab} />}
          </li>
        ))}
        <li className="flex">
          <button
            type="button"
            onClick={onMore}
            aria-expanded={isMoreOpen}
            aria-controls="more-sheet"
            className={`group flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${isMoreActive ? 'text-brand-700 dark:text-brand-300' : 'text-muted'}`}
          >
            <TabIcon icon={LayoutGrid} isActive={isMoreActive} />
            More
          </button>
        </li>
      </ul>
    </nav>
  );
}

// The icon with a soft pill behind it when the tab is the current page (like native apps).
function TabIcon({ icon: Icon, isActive }) {
  return (
    <span
      className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
        isActive ? 'bg-brand-100 dark:bg-brand-500/15' : 'group-active:bg-surface-3'
      }`}
    >
      <Icon className="size-5" strokeWidth={isActive ? 2.4 : 2} aria-hidden="true" />
    </span>
  );
}

function Tab({ tab }) {
  return (
    <NavLink
      to={tab.to}
      end={tab.to === '/'}
      className={({ isActive }) =>
        `group flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${isActive ? 'text-brand-700 dark:text-brand-300' : 'text-muted'}`
      }
    >
      {({ isActive }) => (
        <>
          <TabIcon icon={tab.icon} isActive={isActive} />
          {tab.label}
        </>
      )}
    </NavLink>
  );
}

// The member's most used action: a raised green button in the middle of the bar.
function FeaturedTab({ tab }) {
  return (
    <NavLink to={tab.to} className="group flex flex-1 flex-col items-center justify-end gap-0.5 pb-1.5 text-[11px] font-medium text-ink-2">
      {({ isActive }) => (
        <>
          <span
            className={`-mt-5 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-700/30 ring-4 ring-surface transition-transform group-active:scale-95 ${
              isActive ? 'scale-105' : ''
            }`}
          >
            <tab.icon className="size-6" aria-hidden="true" />
          </span>
          <span className={isActive ? 'text-brand-700 dark:text-brand-300' : ''}>{tab.label}</span>
        </>
      )}
    </NavLink>
  );
}

export default BottomTabBar;
