import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Send } from 'lucide-react';

const InputWrapper = styled.div`
  padding: 1.5rem;
  background: ${props => props.theme.surface};
  backdrop-filter: ${props => props.theme.backdropFilter || 'blur(12px)'}; /* Glass effect */
  border-top: 1px solid ${props => props.theme.border};
  display: flex;
  gap: 1rem;
  align-items: flex-end;
`;

const TextArea = styled.textarea`
  flex: 1;
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
  border-radius: 1rem;
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
  resize: none;
  max-height: 150px;
  line-height: 1.5;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: ${props => props.theme.primary};
  }

  &::placeholder {
    color: ${props => props.theme.textSecondary};
  }
`;

const SendButton = styled.button`
  background: ${props => props.theme.primary};
  color: white;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
  color: white;
  box-shadow: 0 4px 12px ${props => props.theme.primary}4D;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px ${props => props.theme.primary}66;
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: ${props => props.theme.textSecondary};
  }
`;

const QuickActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0 0.5rem;
`;

const QuickActionButton = styled.button`
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  background: ${props => props.theme.background};
  border: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.textSecondary};
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme.primary};
    color: ${props => props.theme.primary};
  }
`;

export const ChatInput = ({ onSend, disabled }) => {
  const [input, setInput] = useState('');
  const textAreaRef = useRef(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = [
    "What's the weather in London?",
    "Weather forecast for tomorrow",
    "Is it raining in Tokyo?"
  ];

  return (
    <div>
      <QuickActions>
        {quickPrompts.map(prompt => (
          <QuickActionButton key={prompt} onClick={() => setInput(prompt)}>
            {prompt}
          </QuickActionButton>
        ))}
      </QuickActions>
      <InputWrapper>
        <TextArea
          ref={textAreaRef}
          placeholder="Ask about the weather..."
          aria-label="Message input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled}
        />
        <SendButton onClick={handleSend} disabled={disabled || !input.trim()} aria-label="Send message" title="Send message">
          <Send size={20} />
        </SendButton>
      </InputWrapper>
    </div>
  );
};
