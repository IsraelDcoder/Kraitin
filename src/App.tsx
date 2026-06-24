import React, { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NotFound from '@/pages/NotFound';
import IntersectObserver from '@/components/common/IntersectObserver';
import { PageTransition } from '@/components/common/PageTransition';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { GuideProvider } from '@/contexts/GuideContext';
import { buildRoutes, type RouteConfig } from './routes';
import { useReferralCapture } from '@/hooks/useReferralCapture';
import { useThemeApplier } from '@/hooks/useThemeApplier';

/** Captures ?ref= from any URL into cookie + localStorage */
function ReferralCapturer() {
  useReferralCapture();
  return null;
}

/** Applies the user's saved workspace theme to <html> */
function ThemeApplier() {
  useThemeApplier();
  return null;
}

function renderRoute(route: RouteConfig, index: number) {
  if (route.children?.length) {
    return (
      <Route key={index} path={route.path} element={route.element}>
        {route.children.map((child, i) => (
          <Route key={i} path={child.path} element={child.element} />
        ))}
      </Route>
    );
  }
  return <Route key={index} path={route.path} element={route.element} />;
}

const App: React.FC = () => {
  // Build routes inside the component so JSX is created within React's render
  // cycle — prevents "Cannot read properties of null (reading 'useRef')" during
  // Vite HMR / React Refresh when module-level JSX fires before React reinitialises.
  const routes = useMemo(() => buildRoutes(), []);

  return (
    <Router>
      <AuthProvider>
        <ReferralCapturer />
        <ThemeApplier />
        <IntersectObserver />
        <GuideProvider>
          <PageTransition>
            <Routes>
              {routes.map((route, index) => renderRoute(route, index))}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageTransition>
        </GuideProvider>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </Router>
  );
};

export default App;
