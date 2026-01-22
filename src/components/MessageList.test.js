import React from 'react';
import { render } from '@testing-library/react';
import { MessageList } from './MessageList';

const baseTime = new Date().toISOString();

test('MessageList renders message statuses for user messages', () => {
  const messages = [
    { id: 'u1', role: 'user', content: 'Hi', timestamp: baseTime, status: 'sending' },
    { id: 'a1', role: 'agent', content: 'Hello', timestamp: baseTime }
  ];

  const { getByText } = render(<MessageList messages={messages} loading={false} />);

  expect(getByText('Hi')).toBeTruthy();
  expect(getByText('Sending…')).toBeTruthy();
  expect(getByText('Hello')).toBeTruthy();
});
