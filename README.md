# Force Analysis Lab

Force Analysis Lab 是一个面向高中生的物理力学交互学习网站，重点帮助学生建立完整的受力分析思维框架。项目通过可调参数、动态受力图、公式推导和分步骤讲解，把抽象的力学模型转化为可以观察、操作和验证的网页实验。

本项目适合用于高中物理力学入门、课堂演示、课后自学和模型化训练，当前覆盖水平面、斜面、粗糙面、连接体、滑轮、阿特伍德机、动滑轮等典型模型。

## 项目目标

本项目不是单纯给出物理题答案，而是引导学生理解“如何分析”。每个力学模型都尽量按照从场景识别、研究对象选择、受力图绘制、坐标轴建立、公式列写、结果解释到易错点提醒的路径展开。

项目重点强调以下能力：

- 建立受力分析的整体框架。
- 按照从易到难的顺序训练典型模型。
- 使用可视化受力图理解力的大小、方向和作用对象。
- 通过参数滑块观察质量、角度、摩擦因数、外力等变量变化对结果的影响。
- 展示清晰的解题步骤和公式推导过程。
- 支持在 Windows 11 本地开发和运行。

## 技术栈

项目采用现代前端技术构建：

- **React**：构建交互式学习页面。
- **TypeScript**：保证物理计算、组件参数和数据结构的类型清晰。
- **Vite**：提供快速本地开发和构建能力。
- **SVG**：绘制受力箭头、坐标轴、物体和滑轮等示意图。
- **Tailwind CSS**：用于页面样式和响应式布局。
- **KaTeX / react-katex**：渲染物理公式。
- **Vitest**：为核心物理计算函数编写单元测试。

## 安装与运行

### 环境要求
- Node.js (建议 v20+)
- npm 或 pnpm

### 本地开发
1. **安装依赖**:
   ```bash
   npm install
   ```
2. **启动开发服务器**:
   ```bash
   npm run dev
   ```
   服务器启动后，通常会在控制台显示本地访问地址（如 `http://localhost:5173`）。

### 构建与预览
- **生产环境构建**:
  ```bash
  npm run build
  ```
  该命令会执行 TypeScript 类型检查并进行代码打包，输出至 `dist` 文件夹。
- **本地预览构建成果**:
  ```bash
  npm run preview
  ```

### 运行测试
项目使用 Vitest 进行物理逻辑测试：
```bash
npx vitest run
```

## 当前课程模块

项目当前已有多个高中力学模型页面，每个页面围绕一个典型受力分析场景展开。

| 模块 | 文件 | 学习重点 |
| --- | --- | --- |
| 首页 | `src/lessons/Home.tsx` | 项目入口与课程导航 |
| 受力分析步骤 | `src/lessons/SevenSteps.tsx` | 建立受力分析基本流程 |
| 水平面静止模型 | `src/lessons/HorizontalStatic.tsx` | 重力、支持力、平衡状态 |
| 光滑斜面模型 | `src/lessons/InclineFrictionless.tsx` | 重力分解、沿斜面加速度 |
| 粗糙水平面模型 | `src/lessons/RoughHorizontal.tsx` | 静摩擦、滑动摩擦、临界状态 |
| 粗糙斜面模型 | `src/lessons/RoughIncline.tsx` | 斜面分解、摩擦方向、是否下滑 |
| 水平连接体模型 | `src/lessons/ConnectedHorizontal.tsx` | 整体法、隔离法、绳子张力 |
| 桌面悬挂滑轮模型 | `src/lessons/ConnectedPulley.tsx` | 连接体、张力、摩擦与加速度 |
| 三物体连接模型 | `src/lessons/ConnectedTriple.tsx` | 多物体整体法与隔离法 |
| 水平圆周运动 | `src/lessons/CircularHorizontal.tsx` | 向心力来源、圆周运动基础 |
| 拱桥模型 | `src/lessons/ArchBridge.tsx` | 竖直方向圆周运动、失重 |
| 凹桥模型 | `src/lessons/ConcaveBridge.tsx` | 竖直方向圆周运动、超重 |
| 竖直平面圆周运动 | `src/lessons/VerticalCircular.tsx` | 临界条件、最高点受力 |
| 圆锥摆模型 | `src/lessons/ConicalPendulum.tsx` | 受力分解、圆周运动动力学 |
| 阿特伍德机模型 | `src/lessons/Atwood.tsx` | 轻绳、定滑轮、加速度与张力 |
| 动滑轮模型 | `src/lessons/MovingPulley.tsx` | 理想动滑轮、机械效益、绳端拉力 |

## 项目结构

```text
force-analysis-lab/
├── public/
├── src/
│   ├── assets/
│   │   ├── hero.png
│   │   ├── typescript.svg
│   │   └── vite.svg
│   ├── components/
│   │   ├── Control/
│   │   │   └── ParameterSlider.tsx
│   │   └── Scene/
│   │       ├── ForceArrow.tsx
│   │       ├── FreeBodyDiagram.tsx
│   │       └── PulleySymbol.tsx
│   ├── lessons/
│   │   ├── ArchBridge.tsx
│   │   ├── Atwood.tsx
│   │   ├── CircularHorizontal.tsx
│   │   ├── ConcaveBridge.tsx
│   │   ├── ConicalPendulum.tsx
│   │   ├── ConnectedHorizontal.tsx
│   │   ├── ConnectedPulley.tsx
│   │   ├── ConnectedTriple.tsx
│   │   ├── Home.tsx
│   │   ├── HorizontalStatic.tsx
│   │   ├── InclineFrictionless.tsx
│   │   ├── MovingPulley.tsx
│   │   ├── RoughHorizontal.tsx
│   │   ├── RoughIncline.tsx
│   │   ├── SevenSteps.tsx
│   │   └── VerticalCircular.tsx
│   ├── physics/
│   │   ├── __tests__/
│   │   │   ├── circular.test.ts
│   │   │   ├── connected.test.ts
│   │   │   └── mechanics.test.ts
│   │   ├── circular.ts
│   │   ├── connected.ts
│   │   ├── mechanics.ts
│   │   └── pulley.ts
│   ├── App.css
│   ├── App.jsx
│   ├── App.tsx
│   ├── counter.ts
│   ├── index.css
│   ├── main.ts
│   ├── main.tsx
│   └── style.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── tailwind.config.js
```

---
*由 Gemini CLI 根据项目规范更新。*
