import React, { useState, useEffect } from 'react';
import { Settings, Play, Pause, RefreshCw, BarChart2, Info } from 'lucide-react';
import './App.css';

function App() {
  const [activeModel, setActiveModel] = useState('inclined-plane');
  const [isRunning, setIsRunning] = useState(false);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <div className="logo">ForceLab</div>
        </div>
        <nav className="nav-menu">
          <button 
            className={`nav-item ${activeModel === 'inclined-plane' ? 'active' : ''}`}
            onClick={() => setActiveModel('inclined-plane')}
          >
            斜面模型
          </button>
          <button 
            className={`nav-item ${activeModel === 'connected' ? 'active' : ''}`}
            onClick={() => setActiveModel('connected')}
          >
            连接体模型
          </button>
          <button 
            className={`nav-item ${activeModel === 'pulley' ? 'active' : ''}`}
            onClick={() => setActiveModel('pulley')}
          >
            滑轮模型
          </button>
          <button 
            className={`nav-item ${activeModel === 'circular' ? 'active' : ''}`}
            onClick={() => setActiveModel('circular')}
          >
            圆周运动
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="content-header">
          <h1>{activeModel === 'inclined-plane' ? '斜面摩擦力模型' : '物理模型'}</h1>
          <div className="header-actions">
            <button className="win11-button" onClick={() => setIsRunning(!isRunning)}>
              {isRunning ? <Pause size={18} /> : <Play size={18} />}
              <span>{isRunning ? '暂停' : '开始'}</span>
            </button>
            <button className="icon-button"><RefreshCw size={18} /></button>
          </div>
        </header>

        <div className="simulation-area">
          <div className="canvas-container glass-panel">
            {/* Physics Canvas will go here */}
            <div className="canvas-placeholder">物理仿真加载中...</div>
          </div>
          
          <div className="info-overlay glass-panel">
            <h3>受力分析说明</h3>
            <p>通过调整右侧参数，观察物体在斜面上的受力情况。注意重力的分解以及静摩擦力向滑动摩擦力的转化。</p>
          </div>
        </div>
      </main>

      {/* Control Panel */}
      <section className="control-panel glass-panel">
        <div className="panel-section">
          <h3><Settings size={18} /> 参数设置</h3>
          <div className="slider-group">
            <label>质量 $m$ (kg)</label>
            <input type="range" min="1" max="50" defaultValue="10" />
            <span className="value-display">10 kg</span>
          </div>
          <div className="slider-group">
            <label>倾角 $\theta$ (°)</label>
            <input type="range" min="0" max="90" defaultValue="30" />
            <span className="value-display">30°</span>
          </div>
          <div className="slider-group">
            <label>摩擦因数 $\mu$</label>
            <input type="range" min="0" max="1" step="0.01" defaultValue="0.3" />
            <span className="value-display">0.3</span>
          </div>
        </div>

        <div className="panel-section">
          <h3><BarChart2 size={18} /> 实时数据</h3>
          <div className="data-row">
            <span>加速度 $a$</span>
            <span className="value">0.00 m/s²</span>
          </div>
          <div className="data-row">
            <span>速度 $v$</span>
            <span className="value">0.00 m/s</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
