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
import P04VerticalLift from './lessons/P04VerticalLift';
import P07InclineSlideUp from './lessons/P07InclineSlideUp';
import P06ElectricDeflection from './lessons/P06ElectricDeflection';
import P03VerticalCircleTop from './lessons/P03VerticalCircleTop';
import P01SpacecraftDocking from './lessons/P01SpacecraftDocking';
import P05TripleBlocks from './lessons/P05TripleBlocks';
import P02ConveyorBelt from './lessons/P02ConveyorBelt';
import P08InclinePulley from './lessons/P08InclinePulley';

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
      case 'p04-vertical-lift':
        return <P04VerticalLift onBack={() => setCurrentPage('home')} />;
      case 'p07-incline-slide-up':
        return <P07InclineSlideUp onBack={() => setCurrentPage('home')} />;
      case 'p06-electric-deflection':
        return <P06ElectricDeflection onBack={() => setCurrentPage('home')} />;
      case 'p03-vertical-circle-top':
        return <P03VerticalCircleTop onBack={() => setCurrentPage('home')} />;
      case 'p01-spacecraft-docking':
        return <P01SpacecraftDocking onBack={() => setCurrentPage('home')} />;
      case 'p05-triple-blocks':
        return <P05TripleBlocks onBack={() => setCurrentPage('home')} />;
      case 'p02-conveyor-belt':
        return <P02ConveyorBelt onBack={() => setCurrentPage('home')} />;
      case 'p08-incline-pulley':
        return <P08InclinePulley onBack={() => setCurrentPage('home')} />;
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
