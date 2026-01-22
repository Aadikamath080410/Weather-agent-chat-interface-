import styled from 'styled-components';

export const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: ${props => props.theme.background};
  overflow: hidden;

  /* 
   * User requested "fit the screen" and "takes the whole space". 
   * Removing the "floating card" look to make it a full-screen web app.
   */
`;

export const MainContent = styled.main`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
`;
