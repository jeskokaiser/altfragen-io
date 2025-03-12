
import { lazy, Suspense } from 'react';
import { Navigate, RouteObject } from 'react-router-dom';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import LoadingFallback from '@/components/common/LoadingFallback';

// Lazy load pages for better performance
const Index = lazy(() => import('@/pages/Index'));
const Auth = lazy(() => import('@/pages/Auth'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Settings = lazy(() => import('@/pages/Settings'));
const Training = lazy(() => import('@/pages/Training'));
const TrainingResults = lazy(() => import('@/pages/TrainingResults'));
const ArchivedDatasets = lazy(() => import('@/pages/ArchivedDatasets'));
const UnclearQuestions = lazy(() => import('@/pages/UnclearQuestions'));
const Tutorial = lazy(() => import('@/pages/Tutorial'));
const Changelog = lazy(() => import('@/pages/Changelog'));
const Terms = lazy(() => import('@/pages/Terms'));
const Impressum = lazy(() => import('@/pages/Impressum'));

// Wrap lazy-loaded components with Suspense
const LazyLoad = (Component: React.ComponentType<any>) => (props: any) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component {...props} />
  </Suspense>
);

// Public routes - accessible by anyone
const publicRoutes: RouteObject[] = [
  {
    path: '/',
    element: LazyLoad(Index)({})
  },
  {
    path: '/auth',
    element: LazyLoad(Auth)({})
  },
  {
    path: '/terms',
    element: LazyLoad(Terms)({})
  },
  {
    path: '/impressum',
    element: LazyLoad(Impressum)({})
  },
  {
    path: '/tutorial',
    element: LazyLoad(Tutorial)({})
  },
  {
    path: '/changelog',
    element: LazyLoad(Changelog)({})
  }
];

// Protected routes - require authentication
const protectedRoutes: RouteObject[] = [
  {
    path: '/dashboard',
    element: <ProtectedRoute>{LazyLoad(Dashboard)({})}</ProtectedRoute>
  },
  {
    path: '/settings',
    element: <ProtectedRoute>{LazyLoad(Settings)({})}</ProtectedRoute>
  },
  {
    path: '/archived',
    element: <ProtectedRoute>{LazyLoad(ArchivedDatasets)({})}</ProtectedRoute>
  },
  {
    path: '/unclear-questions/:filename',
    element: <ProtectedRoute>{LazyLoad(UnclearQuestions)({})}</ProtectedRoute>
  },
  // Training routes group
  {
    path: '/training',
    element: <ProtectedRoute>{LazyLoad(Training)({})}</ProtectedRoute>
  },
  {
    path: '/training/results',
    element: <ProtectedRoute>{LazyLoad(TrainingResults)({})}</ProtectedRoute>
  }
];

// Combine all routes
const routes: RouteObject[] = [
  ...publicRoutes,
  ...protectedRoutes,
  // Catch-all route - redirect to index
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
];

export default routes;
