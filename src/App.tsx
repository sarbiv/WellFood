import { useEffect } from 'react';
import { HashRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { Builder } from './pages/Builder';
import { Fridge } from './pages/Fridge';
import { Grocery } from './pages/Grocery';
import { Onboarding } from './pages/Onboarding';
import { Plan } from './pages/Plan';
import { Profile } from './pages/Profile';
import { RecipeDetail } from './pages/RecipeDetail';
import { Recipes } from './pages/Recipes';
import { Science } from './pages/Science';
import { Today } from './pages/Today';
import { AppStoreProvider, useStore } from './store/AppStore';
import { ToastHost } from './ui/components';
import { Icon, type IconName } from './ui/Icon';

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Today', icon: 'home' },
  { to: '/recipes', label: 'Recipes', icon: 'book' },
  { to: '/plan', label: 'Plan', icon: 'calendar' },
  { to: '/grocery', label: 'Grocery', icon: 'cart' },
  { to: '/profile', label: 'Profile', icon: 'user' },
];

function Shell() {
  const { state } = useStore();
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (!state.onboarded && pathname !== '/welcome') return <Navigate to="/welcome" replace />;
  const showTabs = pathname !== '/welcome';

  return (
    <>
      <main className="app">
        <Routes>
          <Route path="/welcome" element={<Onboarding />} />
          <Route path="/" element={<Today />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/recipes/:id" element={<RecipeDetail />} />
          <Route path="/builder" element={<Builder />} />
          <Route path="/builder/:id" element={<Builder />} />
          <Route path="/fridge" element={<Fridge />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/grocery" element={<Grocery />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/science" element={<Science />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {showTabs && (
        <div className="tabbar">
          <nav aria-label="Main">
            {TABS.map((t) => (
              <NavLink key={t.to} to={t.to} end={t.to === '/'}>
                <Icon name={t.icon} size={22} />{t.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
      <ToastHost />
    </>
  );
}

export function App() {
  return (
    <AppStoreProvider>
      {/* Hash routing: deploys to any static host (GitHub Pages, S3, Netlify) with zero server config. */}
      <HashRouter>
        <Shell />
      </HashRouter>
    </AppStoreProvider>
  );
}
