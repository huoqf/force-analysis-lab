import React, { useState } from 'react';
import Home from './lessons/Home';
import SevenSteps from './lessons/SevenSteps';
import HorizontalStatic from './lessons/HorizontalStatic';
import InclineFrictionless from './lessons/InclineFrictionless';
import RoughHorizontal from './lessons/RoughHorizontal';
import RoughIncline from './lessons/RoughIncline';
import ConnectedHorizontal from './lessons/ConnectedHorizontal';
import ConnectedPulley from './lessons/ConnectedPulley';
import ConnectedTriple from './lessons/ConnectedTriple';

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
      case 'rough-horizontal':
        return <RoughHorizontal onBack={() => setCurrentPage('home')} />;
      case 'rough-incline':
        return <RoughIncline onBack={() => setCurrentPage('home')} />;
      case 'connected-horizontal':
        return <ConnectedHorizontal onBack={() => setCurrentPage('home')} />;
      case 'connected-pulley':
        return <ConnectedPulley onBack={() => setCurrentPage('home')} />;
      case 'connected-triple':
        return <ConnectedTriple onBack={() => setCurrentPage('home')} />;
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
