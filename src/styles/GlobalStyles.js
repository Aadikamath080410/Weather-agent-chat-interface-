import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }

  body {
    background: ${props => props.theme.background}; /* Fallback */
    background: ${props => props.theme.gradientBg};
    color: ${props => props.theme.text};
    transition: background-color 0.3s ease, color 0.3s ease;
    overflow: hidden;
    height: 100vh;
    width: 100vw;
  }

  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 10px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.textSecondary};
  }

  button {
    cursor: pointer;
    border: none;
    outline: none;
    background: none;
  }

  input, textarea {
    outline: none;
    border: none;
  }
`;
