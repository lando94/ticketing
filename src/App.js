import React from 'react';

function App() {
  const handleClick = async (site) => {
    try {
      const response = await fetch('/reserve/' + site);
      const result = await response.json();
      console.log(result.message);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="App">
      <h1>Puppeteer와 React 연동</h1>
      <button onClick={() => handleClick('interpark')}>인터파크 티켓 예매 시작</button>
      <button onClick={() => handleClick('seoul')}>서울시 캠핑 예매 시작</button>
    </div>
  );
}

export default App;