import React, { useState } from 'react';
import Home from './lessons/Home';
import SevenSteps from './lessons/SevenSteps';
import HorizontalStatic from './lessons/HorizontalStatic';
import InclineFrictionless from './lessons/InclineFrictionless';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={setCurrentPage} />;
      case 'seven-steps':
        return <SevenSteps onBack={() => setCurrentPage('home')} />;
      case 'horizontal-static':
        return <HorizontalStatic onBack={() => setCurrentPage('home')} />;
      case 'incline-frictionless':
        return <InclineFrictionless onBack={() => setCurrentPage('home')} />;
      default:
        return <Home onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderPage()}
    </div>
  );
}

export default App;
