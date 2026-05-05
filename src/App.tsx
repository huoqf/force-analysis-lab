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
import Atwood from './lessons/Atwood';
import MovingPulley from './lessons/MovingPulley';
import CircularHorizontal from './lessons/CircularHorizontal';
import ConicalPendulum from './lessons/ConicalPendulum';
import VerticalCircular from './lessons/VerticalCircular';
import ArchBridge from './lessons/ArchBridge';
import ConcaveBridge from './lessons/ConcaveBridge';

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
      case 'atwood':
        return <Atwood onBack={() => setCurrentPage('home')} />;
      case 'moving-pulley':
        return <MovingPulley onBack={() => setCurrentPage('home')} />;
      case 'circular-horizontal':
        return <CircularHorizontal onBack={() => setCurrentPage('home')} />;
      case 'conical-pendulum':
        return <ConicalPendulum onBack={() => setCurrentPage('home')} />;
      case 'vertical-circular':
        return <VerticalCircular onBack={() => setCurrentPage('home')} />;
      case 'arch-bridge':
        return <ArchBridge onBack={() => setCurrentPage('home')} />;
      case 'concave-bridge':
        return <ConcaveBridge onBack={() => setCurrentPage('home')} />;
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
