import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bot, Check } from 'lucide-react';

const ListWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
`;

const BubbleContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  max-width: 80%;
  align-self: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
`;

const MessageWrapper = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-direction: ${props => props.$isUser ? 'row-reverse' : 'row'};
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.$isUser ? props.theme.userBubble : props.theme.agentBubble};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$isUser ? props.theme.userText : props.theme.agentText};
  flex-shrink: 0;
  box-shadow: ${props => props.theme.shadow};
`;

const Bubble = styled.div`
  padding: 0.875rem 1.125rem;
  border-radius: 1.25rem;
  background: ${props => props.$isUser ? props.theme.userBubble : props.theme.surface};
  color: ${props => props.$isUser ? props.theme.userText : props.theme.text};
  font-size: 0.9375rem;
  line-height: 1.5;
  box-shadow: ${props => props.theme.shadow};
  border: 1px solid ${props => props.$isUser ? 'transparent' : props.theme.border};
  border-top-${props => props.$isUser ? 'right' : 'left'}-radius: 0.25rem;
  position: relative;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }
`;

const ContextMenu = styled.div`
  position: absolute;
  top: ${props => props.top}px;
  left: ${props => props.left}px;
  background: ${props => props.theme.surface};
  border: 1px solid ${props => props.theme.border};
  border-radius: 0.75rem;
  box-shadow: ${props => props.theme.shadow};
  padding: 0.5rem;
  display: flex;
  gap: 0.25rem;
  z-index: 100;
  backdrop-filter: blur(12px);
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
`;

const ReactionBadge = styled(motion.div)`
  position: absolute;
  bottom: -10px;
  right: 0;
  background: ${props => props.theme.surface};
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  padding: 2px 6px;
  font-size: 0.75rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  cursor: pointer;
  
  &:hover {
      transform: scale(1.1);
  }
`;

const ReactionButton = styled.button`
  font-size: 1rem;
  padding: 0.25rem;
  border-radius: 0.5rem;
  background: ${props => props.theme.background};
  border: 1px solid ${props => props.theme.border};
  
  &:hover {
    background: ${props => props.theme.surface};
    transform: scale(1.1);
  }
`;

const Timestamp = styled.span`
  font-size: 0.75rem;
  color: ${props => props.theme.textSecondary};
  margin-top: 0.25rem;
  padding: 0 0.5rem;
`;

const StatusBadge = styled.span`
  font-size: 0.7rem;
  color: ${props => props.theme.textSecondary};
  margin-left: 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
`;

const TypingIndicatorWrapper = styled.div`
display: flex;
gap: 4px;
padding: 8px 0;
`;

const Dot = styled(motion.div)`
  width: 6px;
  height: 6px;
  background: ${props => props.theme.textSecondary};
  border-radius: 50%;
`;

const TypingIndicator = () => (
  <TypingIndicatorWrapper>
    {[0, 1, 2].map(i => (
      <Dot
        key={i}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
      />
    ))}
  </TypingIndicatorWrapper>
);

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: ${props => props.theme.textSecondary};
  min-height: 100%; /* Ensure full height for centering */
`;

const EmptyCard = styled.div`
  max-width: 360px; /* Reduced from 420px */
  padding: 1.75rem 1.5rem;
  border-radius: 1.25rem;
  background: ${props => props.theme.surface};
  box-shadow: ${props => props.theme.shadow};
  border: 1px solid ${props => props.theme.border};
  margin: auto; /* Extra check for centering */
`;

const EmptyTitle = styled.h2`
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
`;

const EmptySubtitle = styled.p`
  font-size: 0.9rem;
  margin-bottom: 0.9rem;
`;

const EmptyChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.4rem;
`;

const EmptyChip = styled.span`
  font-size: 0.8rem;
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  background: ${props => props.theme.background};
  border: 1px dashed ${props => props.theme.border};
`;

export const MessageList = ({ messages, loading, onReact, searchQuery }) => {
  const scrollRef = useRef();
  const [contextMenu, setContextMenu] = useState(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e, msgId) => {
    e.preventDefault();
    setContextMenu({
      x: e.pageX,
      y: e.pageY,
      messageId: msgId
    });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const hasMessages = messages.length > 0;

  return (
    <ListWrapper ref={scrollRef}>
      {!hasMessages && !loading && !searchQuery && (
        <EmptyState>
          <EmptyCard>
            <EmptyTitle>Ask anything about the weather</EmptyTitle>
            <EmptySubtitle>
              Start a conversation and the weather agent will respond with live, conversational updates.
            </EmptySubtitle>
            <EmptyChips>
              <EmptyChip>“Will it rain today in Mumbai?”</EmptyChip>
              <EmptyChip>“Weekend forecast for Delhi”</EmptyChip>
              <EmptyChip>“What should I wear in London?”</EmptyChip>
            </EmptyChips>
          </EmptyCard>
        </EmptyState>
      )}
      {!hasMessages && searchQuery && (
        <EmptyState>
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
            <p>No messages found matching "<strong>{searchQuery}</strong>"</p>
          </div>
        </EmptyState>
      )}
      <AnimatePresence>
        {messages.map((msg) => (
          <BubbleContainer
            key={msg.id ?? msg.timestamp ?? Math.random()}
            $isUser={msg.role === 'user'}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <MessageWrapper $isUser={msg.role === 'user'}>
              <Avatar $isUser={msg.role === 'user'}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </Avatar>
              <Bubble
                $isUser={msg.role === 'user'}
                onContextMenu={(e) => msg.role !== 'user' && handleContextMenu(e, msg.id)}
                style={{ cursor: msg.role !== 'user' ? 'context-menu' : 'default' }}
              >
                {msg.content || <TypingIndicator />}
                {msg.reaction && (
                  <ReactionBadge
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReact(msg.id, msg.reaction); // toggle off
                    }}
                  >
                    {msg.reaction}
                  </ReactionBadge>
                )}
              </Bubble>
            </MessageWrapper>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Timestamp>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Timestamp>
              {msg.role === 'user' && msg.status && (
                <StatusBadge>
                  {msg.status === 'sending' && 'Sending…'}
                  {msg.status === 'delivered' && (
                    <>
                      <motion.span
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.28 }}
                        aria-hidden
                      >
                        <Check size={12} />
                      </motion.span>
                      <span>✓ Sent</span>
                      {msg.deliveredAt && (
                        <motion.span
                          initial={{ opacity: 0, x: 6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.28 }}
                          style={{ fontSize: '0.65rem', marginLeft: 6, color: 'inherit' }}
                        >
                          {new Date(msg.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </motion.span>
                      )}
                    </>
                  )}
                  {msg.status === 'failed' && '⚠️ Failed'}
                </StatusBadge>
              )}
            </div>
          </BubbleContainer>
        ))}
      </AnimatePresence>
      {contextMenu && (
        <ContextMenu top={contextMenu.y} left={contextMenu.x}>
          {['👍', '❤️', '😊', '❄️', '☀️'].map(emoji => (
            <ReactionButton
              key={emoji}
              onClick={(e) => {
                e.stopPropagation();
                onReact(contextMenu.messageId, emoji);
                setContextMenu(null);
              }}
            >
              {emoji}
            </ReactionButton>
          ))}
        </ContextMenu>
      )}
      {loading && messages[messages.length - 1]?.role === 'user' && (
        <BubbleContainer
          $isUser={false}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <MessageWrapper>
            <Avatar>
              <Bot size={18} />
            </Avatar>
            <Bubble>
              <TypingIndicator />
            </Bubble>
          </MessageWrapper>
        </BubbleContainer>
      )}
    </ListWrapper>
  );
};
