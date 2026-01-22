import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { ChatInput } from './ChatInput';

test('ChatInput calls onSend when Enter is pressed', () => {
  const onSend = jest.fn();
  const { getByLabelText } = render(<ChatInput onSend={onSend} disabled={false} />);
  const textarea = getByLabelText('Message input');

  fireEvent.change(textarea, { target: { value: 'Hello world' } });
  fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', charCode: 13 });

  expect(onSend).toHaveBeenCalledWith('Hello world');
});
