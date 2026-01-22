import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Search, Download, Trash2, CloudSun, Plus, ChevronDown } from 'lucide-react';

const HeaderWrapper = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: ${props => props.theme.surface};
  backdrop-filter: ${props => props.theme.backdropFilter || 'blur(12px)'}; /* Glass effect */
  border-bottom: 1px solid ${props => props.theme.border};
  z-index: 10;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  h1 {
    font-size: 1.25rem;
    font-weight: 700;
    color: ${props => props.theme.text};
  }

  svg {
    color: ${props => props.theme.primary};
  }
`;

const ThreadPicker = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 0.75rem;

  @media (max-width: 640px) {
    margin-left: 0.5rem;
  }
`;

const ThreadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.6rem;
  border-radius: 0.75rem;
  background: ${props => props.theme.glass};
  backdrop-filter: blur(8px);
  border: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.text};
  max-width: 220px;

  span {
    max-width: 170px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.875rem;
    font-weight: 600;
  }

  &:hover {
    border-color: ${props => props.theme.primary};
  }
`;

const ThreadMenu = styled(motion.div)`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 260px;
  background: ${props => props.theme.surface};
  backdrop-filter: blur(16px);
  border: 1px solid ${props => props.theme.border};
  border-radius: 0.75rem;
  box-shadow: ${props => props.theme.shadow};
  overflow: hidden;
  z-index: 50;
`;

const ThreadMenuItem = styled.button`
  width: 100%;
  padding: 0.6rem 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  color: ${props => props.theme.text};
  background: transparent;
  border: none;
  text-align: left;

  &:hover {
    background: ${props => props.theme.background};
  }

  small {
    color: ${props => props.theme.textSecondary};
    font-weight: 600;
  }
`;

const ThreadTitleInput = styled.input`
  width: 100%;
  background: ${props => props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: 0.5rem;
  padding: 0.4rem 0.6rem;
  color: ${props => props.theme.text};
  font-size: 0.875rem;
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const IconButton = styled(motion.button)`
  padding: 0.5rem;
  border-radius: 0.5rem;
  color: ${props => props.theme.textSecondary};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${props => props.theme.background};
    color: ${props => props.theme.primary};
  }
`;

const SearchWrapper = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

const SearchInput = styled(motion.input)`
  background: ${props => props.theme.glass};
  backdrop-filter: blur(8px);
  border: 1px solid ${props => props.theme.border};
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  padding-right: 3rem; /* Make room for the button */
  color: ${props => props.theme.text};
  font-size: 0.875rem;
  width: ${props => props.$expanded ? '240px' : '0px'};
  opacity: ${props => props.$expanded ? 1 : 0};
  pointer-events: ${props => props.$expanded ? 'auto' : 'none'};
  transition: all 0.3s ease;
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%) translateX(0); /* Align properly */
  z-index: 10;
`;

const SearchButton = styled(motion.button)`
    background: ${props => props.theme.glass};
    backdrop-filter: blur(8px);
    border: 1px solid ${props => props.theme.border};
    width: 40px;
    height: 40px;
    border-radius: 0.5rem; // Square with rounded corners
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => props.theme.textSecondary};
    cursor: pointer;
    z-index: 20;
    transition: all 0.2s ease;
    position: relative; /* Ensure it stays above input */

    &:hover {
        background: ${props => props.theme.surface};
        color: ${props => props.theme.primary};
        border-color: ${props => props.theme.primary};
    }
`;

export const Header = ({
  theme,
  toggleTheme,
  onClear,
  onExport,
  onSearch,
  threads = [],
  currentThreadId,
  onCreateThread,
  onDeleteThread,
  onRenameThread,
  onSwitchThread,
}) => {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [threadMenuOpen, setThreadMenuOpen] = useState(false);
  const [editingThreadId, setEditingThreadId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const threadMenuRef = useRef(null);

  const currentThread = useMemo(() => {
    return threads.find(t => t.id === currentThreadId) ?? threads[0];
  }, [threads, currentThreadId]);

  const startRename = (thread) => {
    setEditingThreadId(thread.id);
    setEditingTitle(thread.title || 'New chat');
  };

  const commitRename = () => {
    if (!editingThreadId) return;
    const next = (editingTitle || '').trim();
    if (next) onRenameThread?.(editingThreadId, next);
    setEditingThreadId(null);
    setEditingTitle('');
  };

  useEffect(() => {
    if (!threadMenuOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setThreadMenuOpen(false);
        setEditingThreadId(null);
        setEditingTitle('');
      }
    };
    const onMouseDown = (e) => {
      if (!threadMenuRef.current) return;
      if (!threadMenuRef.current.contains(e.target)) {
        setThreadMenuOpen(false);
        setEditingThreadId(null);
        setEditingTitle('');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onMouseDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onMouseDown);
    };
  }, [threadMenuOpen]);

  return (
    <HeaderWrapper>
      <LogoSection>
        <CloudSun size={28} />
        <h1>Weather Agent</h1>
        <ThreadPicker ref={threadMenuRef}>
          <ThreadButton onClick={() => setThreadMenuOpen(v => !v)} aria-label="Select chat thread" title="Select chat thread">
            <span>{currentThread?.title ?? 'Chat'}</span>
            <ChevronDown size={16} />
          </ThreadButton>
          <IconButton
            onClick={onCreateThread}
            title="New chat"
            aria-label="New chat"
            whileHover={{ scale: 1.08, rotate: 90 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Plus size={20} />
          </IconButton>
          <AnimatePresence>
            {threadMenuOpen && (
              <ThreadMenu
                role="menu"
                aria-label="Thread menu"
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                {threads.map((t) => (
                  <ThreadMenuItem
                    key={t.id}
                    onClick={() => {
                      onSwitchThread?.(t.id);
                      setThreadMenuOpen(false);
                    }}
                    title={t.title}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                      {editingThreadId === t.id ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <ThreadTitleInput
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitRename();
                              if (e.key === 'Escape') {
                                setEditingThreadId(null);
                                setEditingTitle('');
                              }
                            }}
                            onBlur={commitRename}
                            autoFocus
                            aria-label="Rename thread"
                          />
                        </div>
                      ) : (
                        <strong style={{ fontSize: '0.875rem' }}>{t.title || 'New chat'}</strong>
                      )}
                      <small>{(t.messages?.length ?? 0)} msgs</small>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        onClick={() => startRename(t)}
                        title="Rename"
                        aria-label="Rename thread"
                      >
                        <span style={{ fontSize: 12, fontWeight: 800 }}>Aa</span>
                      </IconButton>
                      <IconButton
                        onClick={() => onDeleteThread?.(t.id)}
                        title="Delete"
                        aria-label="Delete thread"
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </div>
                  </ThreadMenuItem>
                ))}
              </ThreadMenu>
            )}
          </AnimatePresence>
        </ThreadPicker>
      </LogoSection>

      <ActionButtons>
        <SearchWrapper>
          <AnimatePresence>
            {searchExpanded && (
              <SearchInput
                $expanded={searchExpanded}
                placeholder="Search..."
                onChange={(e) => onSearch(e.target.value)}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 240, opacity: 1, x: 0 }}
                exit={{ width: 0, opacity: 0, x: 0 }}
                autoFocus
              />
            )}
          </AnimatePresence>
          <SearchButton
            onClick={() => {
              setSearchExpanded(!searchExpanded);
              if (searchExpanded) onSearch(''); // clear on close
            }}
            aria-label="Toggle search"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Search size={20} />
          </SearchButton>
        </SearchWrapper>

        <IconButton
          onClick={onExport}
          title="Export Chat"
          aria-label="Export chat"
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Download size={20} />
        </IconButton>

        <IconButton
          onClick={onClear}
          title="Clear Chat"
          aria-label="Clear chat"
          whileHover={{ scale: 1.08, rotate: 5 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Trash2 size={20} />
        </IconButton>

        <IconButton
          onClick={toggleTheme}
          title="Toggle Theme"
          aria-label="Toggle theme"
          whileHover={{ scale: 1.1, rotate: theme === 'light' ? 15 : -15 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
          <motion.div
            key={theme}
            initial={{ rotate: theme === 'light' ? -180 : 180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: theme === 'light' ? 180 : -180, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </motion.div>
        </IconButton>
      </ActionButtons>
    </HeaderWrapper>
  );
};
