import { render } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { App, routes } from '../app/App';
import { createQueryClient } from '../app/queries';

/** Renders the whole app at `path` with a fresh cache and an in-memory router. */
export function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const result = render(<App router={router} queryClient={createQueryClient()} />);
  const location = () => router.state.location.pathname + router.state.location.search;
  return { ...result, router, location };
}
