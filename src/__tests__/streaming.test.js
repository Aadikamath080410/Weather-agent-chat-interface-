import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import App from '../App';
import { CONFIG } from '../config';


if (typeof TextDecoder === 'undefined') {
  // eslint-disable-next-line global-require
  const { TextDecoder } = require('util');
  global.TextDecoder = TextDecoder;
}
if (typeof TextEncoder === 'undefined') {
  // eslint-disable-next-line global-require
  const { TextEncoder } = require('util');
  global.TextEncoder = TextEncoder;
}


function makeMockReader(chunks, delay = 10) {
  let i = 0;
  return {
    read: jest.fn().mockImplementation(() => {
      if (i >= chunks.length) return Promise.resolve({ done: true, value: undefined });
      const chunk = new TextEncoder().encode(chunks[i++]);
      return new Promise(resolve => setTimeout(() => resolve({ done: false, value: chunk }), delay));
    })
  };
}

test('streams response from the agent and displays content', async () => {
  
  CONFIG.USE_MOCK = false;

 
  const chunks = [
    'data: {"message":{"content":"Hello"}}\n',
    'data: {"message":{"content":" from"}}\n',
    'data: {"message":{"content":" stream"}}\n'
  ];
  const reader = makeMockReader(chunks, 5);

  const realFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    body: {
      getReader: () => reader
    }
  });

  render(<App />);

  
  const textarea = screen.getByLabelText('Message input');
  fireEvent.change(textarea, { target: { value: 'Test streaming' } });
  fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', charCode: 13 });

  
  await waitFor(() => expect(screen.getByText(/Hello/)).toBeInTheDocument(), { timeout: 2000 });
  await waitFor(() => expect(screen.getByText(/from/)).toBeInTheDocument(), { timeout: 2000 });

  
  global.fetch = realFetch;
});
