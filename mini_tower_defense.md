# 微型塔防 Web Component 实施文档

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans`，严格按任务顺序实施，并用复选框跟踪进度。

**名字：** Mini Tower Defense

**目标：** 实现一个只有一关、单局约 3–5 分钟、卡通城堡与骑士主题的微型塔防游戏，并以零运行时依赖的原生 Web Component 形式发布。组件必须使用 Shadow DOM 隔离宿主页面 CSS，主游戏使用 Canvas 渲染，同时支持鼠标与触屏操作，最终构建为一个可直接通过 `<script>` 引入的单文件 JavaScript。

**架构：** 使用原生 Custom Elements 定义 `<mini-tower-defense>`。Shadow DOM 内包含 Canvas、HUD、建塔菜单、控制按钮和结果弹窗；Canvas 负责地图、敌人、防御塔、投射物和特效。核心逻辑拆分为纯 JavaScript 模块，构建阶段将模块、CSS、SVG/PNG 图片和音效编码后打包进一个 IIFE/ESM 单文件产物。

**技术栈：** 原生 JavaScript（ES2022+）、Web Components、Shadow DOM、HTML Canvas 2D、Web Audio API、Pointer Events、Vitest、Playwright、Rollup 或 esbuild（仅开发和构建依赖）。

## 全局约束

- 第一版只有一关，目标局长为 3–5 分钟。
- 固定路线地图；敌人沿预设路径移动。
- 固定塔位；玩家只能在预设建造点建塔。
- 仅两种防御塔：弓箭塔、法师塔。
- 仅三种敌人：普通步兵、快速斥候、重甲兵。
- 共 5 波敌人。
- 防御塔不支持升级。
- 支持建造与出售。
- 支持鼠标与触屏；统一使用 Pointer Events。
- 仅提供音效，不提供背景音乐。
- 运行时零第三方依赖。
- 图片与音效内嵌到最终 JavaScript 文件。
- 最终交付单文件版本，可直接通过 `<script>` 引入。
- 组件必须使用 Shadow DOM，宿主页面 CSS 不得影响组件内部样式。
- 组件内部样式不得泄漏到宿主页面。
- 游戏逻辑应尽量与 Canvas 和 DOM 解耦，以便单元测试。
- 所有随机行为必须支持注入种子或随机函数，以保证测试可复现。
- 使用测试驱动开发；每个功能任务先写失败测试，再实现最小代码。
- 不允许引入 React、Vue、Lit、Phaser、PixiJS 等运行时框架。

---

## 1. 产品范围

### 1.1 核心体验

玩家守卫一座卡通城堡。敌人从地图入口沿道路前往城堡，玩家在固定塔位建造弓箭塔或法师塔。敌人抵达终点会扣除城堡生命。玩家通过击败敌人获得金币，并在 5 波敌人结束前保护城堡。

### 1.2 胜负条件

- 胜利：第 5 波所有敌人生成完毕，且地图上没有存活敌人，同时城堡生命大于 0。
- 失败：城堡生命降至 0。
- 暂停时：敌人、投射物、特效、波次计时器均停止；UI 仍可响应“继续”和“重新开始”。

### 1.3 明确不做

- 多关卡和关卡选择。
- 塔升级树。
- 英雄角色或可操控单位。
- 自由放置、网格放置或动态寻路。
- 用户账号、排行榜、云存档。
- 背景音乐。
- 联机功能。
- 复杂粒子引擎。
- 国际化框架；第一版只内置简体中文和英文两套短文本映射。

---

## 2. 推荐游戏数值

这些数值作为第一版默认值。实现时全部集中放入配置对象，不得散落为魔法数字。

### 2.1 玩家初始状态

| 项目 | 默认值 |
|---|---:|
| 初始金币 | 140 |
| 城堡生命 | 10 |
| 固定塔位 | 7 个 |
| 击杀金币结算 | 立即结算 |
| 出售返还 | 建造价格的 60%，向下取整 |

### 2.2 防御塔

| 属性 | 弓箭塔 | 法师塔 |
|---|---:|---:|
| 建造价格 | 60 | 90 |
| 攻击伤害 | 18 | 28 |
| 攻击间隔 | 0.70 秒 | 1.10 秒 |
| 攻击范围 | 145 px（基于 960×540 设计坐标） | 130 px |
| 投射物速度 | 420 px/s | 300 px/s |
| 伤害类型 | 物理 | 魔法 |
| 特性 | 单体、高频 | 单体、无视部分护甲 |

### 2.3 敌人

| 属性 | 普通步兵 | 快速斥候 | 重甲兵 |
|---|---:|---:|---:|
| 生命值 | 70 | 48 | 170 |
| 移动速度 | 58 px/s | 92 px/s | 38 px/s |
| 护甲 | 2 | 0 | 9 |
| 魔法抗性 | 0 | 0 | 2 |
| 击杀奖励 | 14 | 12 | 25 |
| 抵达城堡伤害 | 1 | 1 | 2 |

伤害公式：

```text
物理最终伤害 = max(1, 基础伤害 - 护甲)
魔法最终伤害 = max(1, 基础伤害 - 魔法抗性)
```

### 2.4 波次设计

| 波次 | 敌人组成 | 生成间隔 | 波前准备时间 |
|---|---|---:|---:|
| 1 | 8 × 普通步兵 | 0.85 秒 | 4 秒 |
| 2 | 5 × 普通步兵，5 × 快速斥候 | 0.75 秒 | 4 秒 |
| 3 | 8 × 普通步兵，3 × 重甲兵 | 0.90 秒 | 5 秒 |
| 4 | 8 × 快速斥候，4 × 重甲兵 | 0.70 秒 | 5 秒 |
| 5 | 8 × 普通步兵，8 × 快速斥候，5 × 重甲兵 | 0.62 秒 | 5 秒 |

生成顺序由波次配置显式定义，避免运行时随机打乱。目标总时长约 3–5 分钟。

---

## 3. 组件公共 API

### 3.1 基本用法

```html
<script src="./mini-tower-defense.js"></script>

<mini-tower-defense
  width="960"
  height="540"
  locale="zh-CN"
  auto-start="false"
></mini-tower-defense>
```

### 3.2 自定义元素名称

```text
mini-tower-defense
```

不得注册多个别名。注册前必须检查：

```js
if (!customElements.get('mini-tower-defense')) {
  customElements.define('mini-tower-defense', MiniTowerDefenseElement);
}
```

### 3.3 Attributes / Properties

| 名称 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `width` | number | `960` | Canvas 设计宽度；最小 640，最大 1920 |
| `height` | number | `540` | Canvas 设计高度；最小 360，最大 1080 |
| `locale` | string | `zh-CN` | 支持 `zh-CN`、`en` |
| `auto-start` | boolean attribute | false | 连接 DOM 后自动进入第一波准备阶段 |
| `muted` | boolean attribute | false | 禁止播放音效 |
| `paused` | boolean property | false | 读取或设置暂停状态 |
| `state` | readonly string | — | `idle`、`running`、`paused`、`won`、`lost`、`destroyed` |

属性变更规则：

- `locale` 和 `muted` 可在运行中动态更新。
- `width`、`height` 在运行中变更时，仅调整显示比例和 Canvas backing store，不重置游戏。
- `auto-start` 仅在首次连接时生效。

### 3.4 公共方法

```ts
start(): void
pause(): void
resume(): void
restart(): void
destroy(): void
getSnapshot(): Readonly<GameSnapshot>
```

`destroy()` 必须停止 animation frame、释放音频节点、移除 ResizeObserver 和事件监听器，但不强制从 DOM 中移除元素。

### 3.5 自定义事件

全部使用 `CustomEvent`，设置 `bubbles: true`、`composed: true`。

| 事件名 | detail |
|---|---|
| `game-start` | `{ wave: 1 }` |
| `game-pause` | `{ elapsedMs }` |
| `game-resume` | `{ elapsedMs }` |
| `wave-start` | `{ wave, totalWaves }` |
| `wave-complete` | `{ wave, remainingLives, gold }` |
| `tower-built` | `{ slotId, towerType, cost, gold }` |
| `tower-sold` | `{ slotId, towerType, refund, gold }` |
| `enemy-leaked` | `{ enemyType, damage, remainingLives }` |
| `game-win` | `{ elapsedMs, remainingLives, gold, score }` |
| `game-lose` | `{ elapsedMs, completedWave, score }` |
| `game-error` | `{ code, message }` |

---

## 4. Shadow DOM 与宿主隔离

### 4.1 Shadow Root

使用：

```js
this.attachShadow({ mode: 'open' });
```

使用开放模式以方便宿主自动化测试和调试，但不得要求宿主访问内部节点才能正常使用。

### 4.2 CSS 隔离原则

Shadow CSS 顶部必须包含：

```css
:host {
  display: block;
  contain: content;
  box-sizing: border-box;
  width: min(100%, 960px);
  aspect-ratio: 16 / 9;
  font-family: ui-rounded, "Arial Rounded MT Bold", system-ui, sans-serif;
  color: #2b2118;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

*, *::before, *::after {
  box-sizing: border-box;
}

button, canvas {
  font: inherit;
}
```

不得使用影响宿主的全局选择器、`document.body` 样式或在 document head 中注入 `<style>`。

### 4.3 可定制 CSS Variables

宿主只能通过 CSS 自定义属性做有限主题定制：

```css
mini-tower-defense {
  --mtd-frame-radius: 18px;
  --mtd-accent: #4d77d8;
  --mtd-panel-bg: rgba(255, 248, 225, 0.94);
  --mtd-text: #2b2118;
}
```

除这些公开变量外，内部变量命名统一加 `--mtd-` 前缀。

---

## 5. UI 与交互设计

### 5.1 视觉主题

- 卡通中世纪城堡与骑士主题。
- 色彩明亮、饱和度适中；避免写实暴力。
- 敌人被击败时使用烟尘、星星或闪光效果，不显示血液。
- 圆角面板、粗轮廓、柔和阴影。
- 图标使用内嵌 SVG/PNG，不使用外部 icon font。

### 5.2 布局

Shadow DOM 内部结构：

```html
<div class="game-shell" part="shell">
  <div class="hud" part="hud">
    <div class="hud-item lives"></div>
    <div class="hud-item gold"></div>
    <div class="hud-item wave"></div>
    <button class="sound-button"></button>
    <button class="pause-button"></button>
  </div>

  <div class="stage" part="stage">
    <canvas part="canvas"></canvas>
    <div class="build-menu" hidden></div>
    <div class="announcement" aria-live="polite"></div>
    <div class="modal" hidden></div>
  </div>
</div>
```

### 5.3 固定塔位交互

1. 空塔位显示木质圆台和“+”符号。
2. 点击或触摸空塔位，弹出包含两张塔卡片的小菜单。
3. 金币不足的塔卡片禁用，并显示价格。
4. 选择塔后立即扣金币并建造。
5. 点击已建塔位，显示塔信息和出售按钮。
6. 点击菜单外部或按 Escape 关闭菜单。
7. 菜单位置优先显示在塔位上方；空间不足时显示在下方，并限制在组件范围内。

### 5.4 响应式行为

- Canvas 内部固定使用 960×540 逻辑坐标。
- CSS 按宿主容器宽度等比缩放。
- 使用 `ResizeObserver` 计算可视尺寸和 DPR。
- Canvas backing store 尺寸：`cssSize × devicePixelRatio`，DPR 上限为 2，避免高分屏资源过度消耗。
- 指针坐标必须从 CSS 像素转换到 960×540 逻辑坐标。
- 最低推荐显示宽度 320px；小于 480px 时 HUD 使用紧凑模式。

### 5.5 触屏要求

- 可点击目标最小视觉尺寸 40×40 CSS px。
- 禁止依赖 hover 才能发现功能。
- Pointer down 不立即建塔；点击释放时仍位于同一目标内才触发。
- 防止双击缩放和长按文本选择，但不得阻止页面正常纵向滚动；仅在用户指针位于 Canvas 并执行游戏点击时调用 `preventDefault()`。

---

## 6. Canvas 游戏世界

### 6.1 坐标系统

固定逻辑坐标：

```text
宽：960
高：540
```

建议地图元素：

- 入口：左侧偏下。
- 道路：S 形或折线曲线，经过地图中央。
- 城堡：右上或右侧。
- 7 个塔位分布在道路两侧。

路径使用点数组定义：

```js
const PATH_POINTS = [
  { x: -30, y: 400 },
  { x: 145, y: 400 },
  { x: 245, y: 315 },
  { x: 410, y: 315 },
  { x: 505, y: 420 },
  { x: 665, y: 420 },
  { x: 735, y: 245 },
  { x: 900, y: 245 },
  { x: 990, y: 245 }
];
```

实施前可微调，但最终点位必须写入配置文件并由测试验证路径总长度大于 1000 逻辑像素。

### 6.2 游戏循环

使用固定时间步长逻辑更新和插值渲染：

```text
simulation step: 1/60 秒
max accumulated frame: 0.25 秒
render: requestAnimationFrame
```

目的：

- 浏览器帧率波动时保持速度和攻击间隔稳定。
- 页面从后台恢复时避免一次性推进数秒。

### 6.3 实体生命周期

每种实体必须有稳定 ID：

```text
enemy-1
tower-slot-3
projectile-18
effect-7
```

每帧更新阶段：

1. 更新波次调度。
2. 更新敌人位置与漏怪判定。
3. 更新塔冷却与目标选择。
4. 更新投射物与命中判定。
5. 应用伤害、死亡和金币结算。
6. 更新视觉特效。
7. 清理标记为销毁的实体。
8. 检查波次完成和胜负条件。

不得在遍历实体数组时直接 splice；统一使用 `alive` 标记和帧末过滤。

### 6.4 目标选择

两种塔均使用“最接近终点优先”：

```text
在攻击范围内，选择 pathProgress 最大的存活敌人。
若 pathProgress 相同，选择 ID 更小的敌人。
```

该规则必须确定性可测。

### 6.5 投射物

- 弓箭：直线追踪目标当前位置；目标死亡后继续飞向最后已知位置，抵达后消失，不重新选目标。
- 魔法球：轻微发光和拖尾；目标死亡后规则同上。
- 命中半径统一 10 px。
- 投射物创建时保存伤害、伤害类型和目标 ID。

---

## 7. 资源策略

### 7.1 图片资源

开发源码目录中允许分文件保存：

```text
src/assets/images/
  map-background.svg
  castle.svg
  tower-slot.svg
  tower-archer.svg
  tower-mage.svg
  enemy-soldier.svg
  enemy-scout.svg
  enemy-armored.svg
  projectile-arrow.svg
  projectile-orb.svg
  ui-heart.svg
  ui-coin.svg
```

构建时转换为字符串或 Data URL 并内嵌。

### 7.2 美术要求

- 原创或明确可商用的自有素材。
- 不得从网络抓取来源不明的游戏素材。
- SVG 应清理 metadata、script、外部链接和事件属性。
- SVG 尺寸建议使用一致 viewBox。
- 角色朝向默认向右；Canvas 根据路径切线决定是否水平翻转。

### 7.3 音效资源

```text
src/assets/audio/
  build.wav
  sell.wav
  arrow-shot.wav
  magic-shot.wav
  hit.wav
  enemy-leak.wav
  wave-start.wav
  victory.wav
  defeat.wav
  ui-click.wav
```

要求：

- 单个音效建议小于 80 KB。
- 总音频解码后不应导致明显首屏卡顿。
- 第一次用户手势后再初始化或恢复 AudioContext。
- 若音频解码失败，游戏继续运行，并派发一次 `game-error`，code 为 `AUDIO_DECODE_FAILED`。

---

## 8. 状态模型

```ts
interface GameSnapshot {
  state: 'idle' | 'running' | 'paused' | 'won' | 'lost' | 'destroyed';
  elapsedMs: number;
  wave: number;
  totalWaves: 5;
  gold: number;
  lives: number;
  score: number;
  enemiesAlive: number;
  towers: ReadonlyArray<{
    slotId: string;
    type: 'archer' | 'mage';
  }>;
}
```

内部状态禁止直接暴露可变引用。`getSnapshot()` 返回新对象或深冻结对象。

### 8.1 分数公式

```text
基础击杀分 = 累计击杀奖励金币 × 10
剩余生命奖励 = lives × 100
通关时间奖励 = max(0, 30000 - floor(elapsedMs / 10))
胜利总分 = 基础击杀分 + 剩余生命奖励 + 通关时间奖励
失败总分 = 基础击杀分 + 已完成波次 × 100
```

---

## 9. 项目文件结构

```text
mini-tower-defense/
├─ package.json
├─ README.md
├─ LICENSE
├─ example.html
├─ vite.config.js
├─ vitest.config.js
├─ playwright.config.js
├─ scripts/
│  ├─ build-single-file.mjs
│  └─ validate-assets.mjs
├─ src/
│  ├─ index.js
│  ├─ mini-tower-defense-element.js
│  ├─ template.js
│  ├─ styles.js
│  ├─ config/
│  │  ├─ game-config.js
│  │  ├─ map-config.js
│  │  ├─ waves.js
│  │  └─ i18n.js
│  ├─ engine/
│  │  ├─ game-engine.js
│  │  ├─ game-loop.js
│  │  ├─ state-machine.js
│  │  ├─ wave-controller.js
│  │  ├─ path.js
│  │  ├─ targeting.js
│  │  ├─ collision.js
│  │  ├─ score.js
│  │  └─ ids.js
│  ├─ entities/
│  │  ├─ enemy.js
│  │  ├─ tower.js
│  │  ├─ projectile.js
│  │  └─ effect.js
│  ├─ render/
│  │  ├─ canvas-renderer.js
│  │  ├─ asset-store.js
│  │  ├─ sprite-utils.js
│  │  └─ coordinates.js
│  ├─ input/
│  │  └─ pointer-controller.js
│  ├─ audio/
│  │  └─ audio-manager.js
│  ├─ ui/
│  │  ├─ hud-controller.js
│  │  ├─ build-menu-controller.js
│  │  └─ modal-controller.js
│  └─ assets/
│     ├─ images/
│     └─ audio/
├─ tests/
│  ├─ unit/
│  │  ├─ path.test.js
│  │  ├─ targeting.test.js
│  │  ├─ collision.test.js
│  │  ├─ wave-controller.test.js
│  │  ├─ game-engine.test.js
│  │  ├─ score.test.js
│  │  └─ coordinates.test.js
│  ├─ component/
│  │  ├─ lifecycle.test.js
│  │  ├─ attributes.test.js
│  │  ├─ events.test.js
│  │  └─ css-isolation.test.js
│  └─ e2e/
│     ├─ gameplay.spec.js
│     ├─ touch.spec.js
│     ├─ resize.spec.js
│     └─ host-isolation.spec.js
└─ dist/
   └─ mini-tower-defense.js
```

每个文件只承担一个清晰职责。禁止把全部逻辑写入单个组件类。

---

## 10. 实施任务计划

### Task 1：初始化工程、测试和构建骨架

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `vitest.config.js`
- Create: `playwright.config.js`
- Create: `src/index.js`
- Create: `example.html`
- Create: `tests/component/lifecycle.test.js`

**Produces:**
- 可运行的开发服务器。
- 可执行的 Vitest 和 Playwright 配置。
- 尚无完整功能但可注册的 `<mini-tower-defense>`。

- [ ] 编写生命周期失败测试：创建元素后存在 open Shadow Root，移除并重新插入不会重复注册。
- [ ] 运行 `npm test -- lifecycle.test.js`，确认测试失败。
- [ ] 创建最小组件类并注册自定义元素。
- [ ] 再次运行测试并确认通过。
- [ ] 创建 `example.html`，包含正常容器、窄容器、宿主强干扰 CSS 三个示例区块。
- [ ] 运行 `npm run dev`，确认示例页面无控制台错误。
- [ ] 提交：`chore: initialize tower defense component project`。

### Task 2：定义配置、类型约定和纯状态机

**Files:**
- Create: `src/config/game-config.js`
- Create: `src/config/map-config.js`
- Create: `src/config/waves.js`
- Create: `src/engine/state-machine.js`
- Create: `tests/unit/game-engine.test.js`

**Interfaces:**

```ts
createInitialState(): GameState
transitionGameState(state, event): GameState
```

- [ ] 为 `idle -> running -> paused -> running -> won/lost` 编写失败测试。
- [ ] 添加非法转换测试，例如 `lost -> resume` 必须保持 `lost`。
- [ ] 实现纯函数状态机，不依赖 DOM。
- [ ] 集中定义所有默认数值并执行 `Object.freeze()`。
- [ ] 运行单元测试确认通过。
- [ ] 提交：`feat: add deterministic game state and configuration`。

### Task 3：实现路径数学和敌人移动

**Files:**
- Create: `src/engine/path.js`
- Create: `src/entities/enemy.js`
- Test: `tests/unit/path.test.js`

**Interfaces:**

```ts
createPath(points): PathModel
samplePath(path, distance): { x: number, y: number, angle: number, progress: number }
createEnemy(spec): Enemy
advanceEnemy(enemy, deltaSeconds, path): EnemyUpdateResult
```

- [ ] 测试路径总长度、起点、终点和中间插值。
- [ ] 测试负距离被钳制到起点，超长距离被钳制到终点。
- [ ] 测试三种敌人在 1 秒后的移动距离与配置一致。
- [ ] 测试敌人到达终点只触发一次 leak。
- [ ] 实现路径预计算和线段采样。
- [ ] 实现不可变或受控可变的敌人更新。
- [ ] 运行测试并提交：`feat: add path sampling and enemy movement`。

### Task 4：实现塔位、建造、出售和经济系统

**Files:**
- Create: `src/entities/tower.js`
- Create: `src/engine/game-engine.js`
- Test: `tests/unit/game-engine.test.js`

**Interfaces:**

```ts
engine.buildTower(slotId, towerType): CommandResult
engine.sellTower(slotId): CommandResult
```

`CommandResult`：

```ts
{ ok: true, snapshot } |
{ ok: false, code: 'SLOT_OCCUPIED' | 'SLOT_EMPTY' | 'INSUFFICIENT_GOLD' | 'INVALID_TOWER' }
```

- [ ] 测试初始金币可建造两座弓箭塔但不能额外建法师塔。
- [ ] 测试同一塔位不能重复建造。
- [ ] 测试出售返还 60% 且塔位恢复为空。
- [ ] 测试失败命令不改变金币和状态。
- [ ] 实现塔位表、建造和出售命令。
- [ ] 运行测试并提交：`feat: add tower slots and economy commands`。

### Task 5：实现目标选择、攻击冷却和伤害

**Files:**
- Create: `src/engine/targeting.js`
- Create: `src/engine/collision.js`
- Create: `src/entities/projectile.js`
- Modify: `src/engine/game-engine.js`
- Test: `tests/unit/targeting.test.js`
- Test: `tests/unit/collision.test.js`

**Interfaces:**

```ts
selectTarget(tower, enemies): Enemy | null
calculateDamage(baseDamage, damageType, enemy): number
advanceProjectile(projectile, deltaSeconds, targetLookup): ProjectileUpdate
```

- [ ] 测试范围内 pathProgress 最大的敌人被优先选择。
- [ ] 测试同 progress 时 ID 更小者优先。
- [ ] 测试范围边界值包含在攻击范围内。
- [ ] 测试护甲和魔抗伤害公式，最低伤害为 1。
- [ ] 测试目标死亡后投射物不切换目标。
- [ ] 实现塔冷却和投射物生成。
- [ ] 实现命中、死亡和金币奖励。
- [ ] 运行测试并提交：`feat: add deterministic combat system`。

### Task 6：实现波次控制器和胜负判断

**Files:**
- Create: `src/engine/wave-controller.js`
- Modify: `src/engine/game-engine.js`
- Test: `tests/unit/wave-controller.test.js`

**Interfaces:**

```ts
createWaveController(waves): WaveController
updateWaveController(controller, deltaSeconds): WaveEvents
```

- [ ] 测试每波准备时间。
- [ ] 测试敌人按声明顺序和间隔生成。
- [ ] 测试一波必须在“生成完成且无存活敌人”后结束。
- [ ] 测试第 5 波完成后胜利。
- [ ] 测试生命降至 0 后立即失败，后续生成停止。
- [ ] 实现波次控制和胜负事件。
- [ ] 提交：`feat: add five-wave level progression`。

### Task 7：实现固定时间步长游戏循环

**Files:**
- Create: `src/engine/game-loop.js`
- Modify: `src/engine/game-engine.js`
- Test: `tests/unit/game-engine.test.js`

**Interfaces:**

```ts
createGameLoop({ update, render, now, requestFrame, cancelFrame })
```

- [ ] 使用伪时钟测试 30fps、60fps、120fps 下 10 秒模拟结果一致。
- [ ] 测试单帧累计时间最多 0.25 秒。
- [ ] 测试 pause 后不调用逻辑更新。
- [ ] 测试 destroy 后取消 animation frame。
- [ ] 实现 accumulator 固定步长循环。
- [ ] 提交：`feat: add fixed timestep game loop`。

### Task 8：实现资源存储和 Canvas 渲染器

**Files:**
- Create: `src/render/asset-store.js`
- Create: `src/render/canvas-renderer.js`
- Create: `src/render/sprite-utils.js`
- Create: `src/entities/effect.js`
- Create: `src/assets/images/*`

**Interfaces:**

```ts
assetStore.loadAll(): Promise<void>
renderer.resize(cssWidth, cssHeight, dpr): void
renderer.render(snapshot, interpolation): void
```

- [ ] 为资源加载成功、单个资源失败和重复加载编写测试。
- [ ] 创建地图、城堡、两种塔、三种敌人和 UI 图标的原创 SVG。
- [ ] 实现分层绘制顺序：背景、道路装饰、塔位、塔、敌人、投射物、特效、范围提示。
- [ ] 实现敌人血条，仅在受伤后 1.5 秒内或当前被选中时显示。
- [ ] 资源失败时绘制几何占位图，不让游戏崩溃。
- [ ] 提交：`feat: add cartoon canvas renderer and embedded assets`。

### Task 9：实现 Shadow DOM 模板和 HUD

**Files:**
- Create: `src/template.js`
- Create: `src/styles.js`
- Create: `src/ui/hud-controller.js`
- Modify: `src/mini-tower-defense-element.js`
- Test: `tests/component/attributes.test.js`
- Test: `tests/component/css-isolation.test.js`

- [ ] 测试 Shadow DOM 结构、part 名称和公开 CSS variables。
- [ ] 在宿主页面设置 `button { all: unset }`、`canvas { width: 10px }`、`* { color: red }`，验证组件内部仍正常。
- [ ] 测试组件内部样式不会改变宿主按钮。
- [ ] 实现 HUD：生命、金币、波次、暂停、声音。
- [ ] 实现 locale 和 muted 动态属性更新。
- [ ] 提交：`feat: add isolated shadow UI and HUD`。

### Task 10：实现坐标转换与鼠标/触屏输入

**Files:**
- Create: `src/render/coordinates.js`
- Create: `src/input/pointer-controller.js`
- Test: `tests/unit/coordinates.test.js`
- Test: `tests/e2e/touch.spec.js`

**Interfaces:**

```ts
clientToWorld(clientX, clientY, canvasRect, worldSize): { x, y }
hitTestTowerSlot(point, slots): TowerSlot | null
```

- [ ] 测试不同宽高、缩放和 DPR 下的坐标映射。
- [ ] 测试 pointer cancel 不触发建造菜单。
- [ ] 测试触摸点击塔位、选择塔、关闭菜单。
- [ ] 实现单一 Pointer Events 控制器。
- [ ] 添加 Escape 关闭菜单和暂停弹窗的基础键盘支持。
- [ ] 提交：`feat: add mouse and touch controls`。

### Task 11：实现建塔菜单和结果弹窗

**Files:**
- Create: `src/ui/build-menu-controller.js`
- Create: `src/ui/modal-controller.js`
- Modify: `src/mini-tower-defense-element.js`
- Test: `tests/component/events.test.js`
- Test: `tests/e2e/gameplay.spec.js`

- [ ] 测试空塔位菜单显示两种塔和价格。
- [ ] 测试金币不足按钮禁用。
- [ ] 测试已建塔菜单只显示信息和出售。
- [ ] 测试胜利、失败、暂停弹窗。
- [ ] 测试重新开始恢复初始状态，且不重复绑定事件。
- [ ] 实现 ARIA label、aria-live 波次公告和焦点返回。
- [ ] 提交：`feat: add build menus and game result dialogs`。

### Task 12：实现音效管理

**Files:**
- Create: `src/audio/audio-manager.js`
- Create: `src/assets/audio/*`
- Modify: `src/mini-tower-defense-element.js`
- Test: `tests/component/events.test.js`

**Interfaces:**

```ts
audio.unlock(): Promise<void>
audio.play(name): void
audio.setMuted(value): void
audio.destroy(): void
```

- [ ] 测试 muted 时不创建播放节点。
- [ ] 测试 AudioContext 只在用户手势后恢复。
- [ ] 测试音频失败触发一次错误事件但不影响游戏。
- [ ] 添加建造、出售、射击、命中、漏怪、开波、胜利、失败、UI 点击音效。
- [ ] 提交：`feat: add embedded sound effects`。

### Task 13：完成组件生命周期和公共 API

**Files:**
- Modify: `src/mini-tower-defense-element.js`
- Modify: `src/index.js`
- Test: `tests/component/lifecycle.test.js`
- Test: `tests/component/events.test.js`

- [ ] 测试 `start/pause/resume/restart/destroy/getSnapshot`。
- [ ] 测试所有公共事件 `bubbles` 和 `composed` 为 true。
- [ ] 测试元素移除后循环停止、observer 断开、音频释放。
- [ ] 测试重新插入已 destroy 的元素保持 destroyed，除非调用 restart 创建新会话。
- [ ] 实现错误边界：渲染异常派发 `game-error` 并暂停游戏。
- [ ] 提交：`feat: finalize component lifecycle and public API`。

### Task 14：单文件构建与资源内嵌

**Files:**
- Create: `scripts/validate-assets.mjs`
- Create: `scripts/build-single-file.mjs`
- Modify: `package.json`
- Build: `dist/mini-tower-defense.js`

- [ ] 验证所有图片和音频总大小不超过预设预算。
- [ ] 验证 SVG 不包含 `<script>`、外部 URL、`on*` 事件属性。
- [ ] 配置构建工具输出单文件，不产生 chunk、source asset 或运行时网络请求。
- [ ] 构建后扫描产物，确保不包含 `fetch(`、外部 `http://` 或 `https://` 资源 URL。
- [ ] 在空白静态 HTML 中只引用 dist 文件，完成完整游戏测试。
- [ ] 提交：`build: produce standalone single-file component`。

### Task 15：端到端测试、性能和宿主兼容性

**Files:**
- Create: `tests/e2e/resize.spec.js`
- Create: `tests/e2e/host-isolation.spec.js`
- Modify: `tests/e2e/gameplay.spec.js`

- [ ] 测试 960px、600px、360px 三种容器宽度。
- [ ] 测试 DPR 1 和 DPR 2。
- [ ] 测试宿主页面使用 Bootstrap 风格 reset、极端 button/canvas CSS 和不同字体。
- [ ] 测试两个组件实例同时运行，金币、生命、音效和暂停互不干扰。
- [ ] 测试页面隐藏和恢复后无时间跳跃。
- [ ] 性能验收：中档桌面浏览器在最大同屏敌人数时保持平均 55fps 以上；移动设备模拟配置保持 30fps 以上。
- [ ] 内存验收：连续 restart 20 次后 listener、RAF 和 AudioNode 数量不持续增长。
- [ ] 提交：`test: verify responsive isolated gameplay`。

### Task 16：文档和交付样例

**Files:**
- Create: `README.md`
- Finalize: `example.html`
- Create: `LICENSE`

README 必须包含：

- 快速开始。
- 所有 attributes、properties、methods 和 events。
- CSS variables 与 Shadow Parts。
- 鼠标和触屏说明。
- 静音和浏览器自动播放限制说明。
- 多实例示例。
- 生命周期清理说明。
- 浏览器支持矩阵。
- 开发、测试、构建命令。

`example.html` 必须演示：

1. 默认中文组件。
2. 英文、静音、自动开始组件。
3. 宿主 CSS 强干扰下的隔离效果。
4. 窄屏容器。
5. 监听 `game-win`、`game-lose`、`tower-built` 事件并输出日志。
6. 外部按钮调用 `start()`、`pause()`、`resume()`、`restart()`。

- [ ] 在全新目录执行 `npm ci && npm test && npm run build && npm run test:e2e`。
- [ ] 验证 README 中所有示例可复制运行。
- [ ] 提交：`docs: add integration guide and examples`。

---

## 11. 测试策略

### 11.1 单元测试

必须覆盖：

- 路径长度与采样。
- 敌人移动和漏怪。
- 目标选择确定性。
- 伤害、护甲和魔抗。
- 塔冷却和投射物。
- 建造、出售和金币。
- 波次调度。
- 胜负条件。
- 固定时间步长。
- 坐标转换。
- 分数计算。

单元测试不得依赖真实 RAF、真实 AudioContext 或真实时间。

### 11.2 组件测试

使用 jsdom 或 happy-dom，重点验证：

- Shadow Root。
- attributes/property 同步。
- 公共方法。
- 自定义事件。
- 清理逻辑。
- DOM 菜单和 HUD。

Canvas 绘制细节不在 DOM 单元测试中做像素级断言。

### 11.3 E2E 测试

使用 Playwright Chromium，必要时追加 WebKit。

- 通过测试专用配置或公开调试钩子加速波次，但生产构建不得暴露任意状态修改接口。
- 可以在 `?testMode=1` 的示例页面中注入可控时钟和低生命敌人配置，仅供测试文件使用。
- 至少完成一次不作弊的真实节奏冒烟测试。

### 11.4 视觉回归

截取以下状态：

- 初始地图。
- 建塔菜单打开。
- 两种塔同时攻击。
- 手机窄屏 HUD。
- 胜利弹窗。
- 失败弹窗。

视觉差异阈值建议不超过 0.5%。

---

## 12. 无障碍要求

Canvas 游戏本身不要求完整屏幕阅读器可玩性，但必须达到以下最低标准：

- 所有 DOM 按钮有明确 `aria-label`。
- HUD 数值有文本内容，不只显示图标。
- 波次开始、胜利和失败通过 `aria-live="polite"` 公告。
- 弹窗使用 `role="dialog"` 和 `aria-modal="true"`。
- 焦点进入弹窗并在关闭后返回原控件。
- 暂停、静音和重新开始可用键盘操作。
- 颜色不是唯一的信息表达方式；金币不足同时使用禁用状态和文字。
- `prefers-reduced-motion: reduce` 时减少抖动、缩放和大量粒子效果，但不改变游戏速度。

---

## 13. 安全与稳定性

- 不使用 `eval`、`new Function` 或动态插入不可信 HTML。
- 文本统一使用 `textContent`。
- 内嵌 SVG 必须经过静态验证。
- 不发起网络请求。
- 不读写 cookie、localStorage 或 IndexedDB。
- 不采集遥测。
- 不访问宿主 DOM，除组件自身、`ownerDocument` 和尺寸观察所必需的 API 外。
- 捕获资源加载和音频错误，降级而非中断。
- 组件被隐藏或尺寸为 0 时停止渲染，但逻辑是否暂停必须遵循明确策略：默认自动暂停，并在重新可见时保持暂停，等待玩家手动继续。

---

## 14. 性能预算

| 项目 | 预算 |
|---|---:|
| 单文件 gzip 后体积 | ≤ 450 KB |
| 单文件未压缩体积 | ≤ 1.5 MB |
| 同屏敌人上限 | 40 |
| 同屏投射物上限 | 80 |
| 同屏特效上限 | 100 |
| Canvas DPR 上限 | 2 |
| 首次可交互 | 本地加载后 ≤ 500 ms |
| restart 后恢复 | ≤ 100 ms |

超过实体上限时不得崩溃：优先合并或跳过非关键特效，不得跳过敌人和伤害逻辑。

---

## 15. 浏览器支持

最低支持：

- Chrome / Edge 近两个主要版本。
- Firefox 近两个主要版本。
- Safari 17+。
- iOS Safari 17+。
- Android Chrome 近两个主要版本。

不支持 Internet Explorer。

---

## 16. 验收标准

只有全部满足才视为完成：

- [ ] 单个 `dist/mini-tower-defense.js` 可在无构建工具的静态网页中运行。
- [ ] 页面无需外部图片、音频、字体、CSS 或网络请求。
- [ ] 组件使用 open Shadow DOM。
- [ ] 宿主极端 CSS 不会破坏组件内部布局和按钮样式。
- [ ] 组件 CSS 不影响宿主页面。
- [ ] 固定路线、7 个塔位、2 种塔、3 种敌人、5 波全部实现。
- [ ] 防御塔不可升级，但可出售。
- [ ] 单局正常游玩时长约 3–5 分钟。
- [ ] 鼠标和主流触屏浏览器均可完成完整游戏。
- [ ] 暂停、继续、重新开始、静音均可用。
- [ ] 胜利与失败逻辑无重复触发。
- [ ] 所有公开 API 和事件与文档一致。
- [ ] 两个组件实例可同时运行且互不干扰。
- [ ] 移除组件后无持续 RAF、observer、事件或音频泄漏。
- [ ] 所有单元、组件和 E2E 测试通过。
- [ ] `example.html` 演示所有主要集成方式。
- [ ] README 提供可复制的完整使用示例。

---

## 17. Agent 执行规则

交给 AI coding agent 时附加以下要求：

1. 严格按 Task 1 到 Task 16 顺序执行，不跨任务提前实现大块功能。
2. 每个任务必须先写失败测试，再写最小实现，再重构。
3. 每个任务完成后运行相关测试，并做一次独立提交。
4. 不得擅自增加框架、关卡、塔种、敌人种类、升级系统或网络功能。
5. 数值和平衡只通过配置文件修改，不把数值散落在逻辑代码中。
6. 任何需求冲突优先遵守“全局约束”和“验收标准”。
7. 发现无法满足单文件体积预算时，先压缩或简化资源，不得改成外部资源请求。
8. 发现设计需要调整时，先在文档中记录原因和最小改动，再实施。
9. 不得用跳过测试、降低断言或删除测试的方式让 CI 通过。
10. 完成前必须执行：

```bash
npm ci
npm run lint
npm test
npm run build
npm run test:e2e
```

并确认 `dist/` 中只存在预期单文件产物和许可证/说明文件。

