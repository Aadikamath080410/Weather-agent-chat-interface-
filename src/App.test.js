import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Weather Agent header', () => {
  render(<App />);
  const linkElements = screen.getAllByText(/Weather Agent/i);
  expect(linkElements.length).toBeGreaterThan(0);
});
