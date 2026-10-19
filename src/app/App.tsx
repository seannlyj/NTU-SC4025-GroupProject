import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { useState } from 'react';
import { Navigate, Outlet, ScrollRestoration, type RouteObject } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { DashboardScreen } from '../screens/Dashboard';
import { EligibilityScreen } from '../screens/Eligibility';
import { FilterSheet } from '../screens/FilterSheet';
import { HomeScreen } from '../screens/Home';
import { HistoryScreen } from '../screens/History';
import { ReportScreen } from '../screens/Report';
import { ReportPdfScreen } from '../screens/ReportPdf';
import { TransactionsScreen } from '../screens/Transactions';
import { DemoPanel } from './DemoPanel';
import { TabLayout } from './Layout';
import { createQueryClient } from './queries';
import { ScenarioBoundary } from './scenario';

/** Demo state, scroll restoration and the Demo panel wrap every screen. */
function RootLayout() {
  return (
    <ScenarioBoundary>
      <Outlet />
      <DemoPanel />
      <ScrollRestoration />
    </ScenarioBoundary>
  );
}

/** Screen-to-route map (also in README.md). */
export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      {
        element: <TabLayout />,
        children: [
          { index: true, element: <HomeScreen /> },
          { path: 'rewards', element: <DashboardScreen /> },
          { path: 'no-card', element: <DashboardScreen /> },
          { path: 'unavailable', element: <DashboardScreen /> },
          {
            path: 'transactions',
            element: <TransactionsScreen />,
            children: [{ path: 'filter', element: <FilterSheet /> }],
          },
          { path: 'transactions/empty', element: <TransactionsScreen emptyRoute /> },
          { path: 'eligibility', element: <EligibilityScreen /> },
          { path: 'history', element: <HistoryScreen tab="six-months" /> },
          { path: 'history/month', element: <HistoryScreen tab="month" /> },
          { path: 'history/empty', element: <HistoryScreen tab="six-months" /> },
          { path: 'report', element: <ReportScreen /> },
          { path: 'report/error', element: <ReportScreen preset="error" /> },
        ],
      },
      { path: 'report/pdf', element: <ReportPdfScreen /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
];

type AppRouter = Parameters<typeof RouterProvider>[0]['router'];

/** The data cache, then the router. Pass a memory router in tests. */
export function App({ router, queryClient }: { router: AppRouter; queryClient?: QueryClient }) {
  const [client] = useState(() => queryClient ?? createQueryClient());
  return (
    <QueryClientProvider client={client}>
      {/* Honour the OS "reduce motion" setting: movement is dropped, fades stay. */}
      <MotionConfig reducedMotion="user">
        <RouterProvider router={router} />
      </MotionConfig>
    </QueryClientProvider>
  );
}
