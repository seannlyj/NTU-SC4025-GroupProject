import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { App, routes } from './app/App';
import { installNavigationKinds } from './app/navigation';
import './index.css';

const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL });
// Subscribe before <RouterProvider> so each transition knows which animation to play.
installNavigationKinds(router);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App router={router} />
  </StrictMode>,
);
