import React, { useState, useMemo } from 'react';
import { ThemeProvider } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { lightTheme, darkTheme } from './styles/theme';
import { GlobalStyle } from './styles/GlobalStyles';
import { AppContainer, MainContent } from './components/Layout';
import { Header } from './components/Header';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { useChat } from './hooks/useChat';

function App() {
  const [themeMode, setThemeMode] = useState('light');
  const [searchQuery, setSearchQuery] = useState('');
  const {
    threads,
    currentThreadId,
    messages,
    sendMessage,
    loading,
    error,
    clearChat,
    createThread,
    deleteThread,
    renameThread,
    switchThread,
    addReaction,
  } = useChat();

  const toggleTheme = () => setThemeMode(prev => prev === 'light' ? 'dark' : 'light');

  const filteredMessages = useMemo(() => {
    if (!searchQuery) return messages;
    return messages.filter(msg =>
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [messages, searchQuery]);

  const handleExport = () => {
    const text = messages.map(m => `[${m.role.toUpperCase()}] ${m.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weather-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ThemeProvider theme={themeMode === 'light' ? lightTheme : darkTheme}>
      <GlobalStyle />
      <AppContainer
        as={motion.div}
        key={themeMode}
        initial={{ opacity: 0.95 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        <Header
          theme={themeMode}
          toggleTheme={toggleTheme}
          onClear={clearChat}
          onExport={handleExport}
          onSearch={setSearchQuery}
          threads={threads}
          currentThreadId={currentThreadId}
          onCreateThread={createThread}
          onDeleteThread={deleteThread}
          onRenameThread={renameThread}
          onSwitchThread={switchThread}
        />
        <MainContent>
          <MessageList messages={filteredMessages} loading={loading} onReact={addReaction} />
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{ color: '#ef4444', padding: '0.5rem 1.5rem', fontSize: '0.875rem' }}
              >
                Error: {error}. Please try again.
              </motion.div>
            )}
          </AnimatePresence>
          <ChatInput onSend={sendMessage} disabled={loading} />
        </MainContent>
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;
