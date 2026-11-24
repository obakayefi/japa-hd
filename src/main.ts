import {
    AppBase,
    AppOptions,
    CameraComponentSystem,
    Color,
    Entity,
    FILLMODE_FILL_WINDOW,
    LightComponentSystem,
    RenderComponentSystem,
    RESOLUTION_AUTO,
    StandardMaterial,
    createGraphicsDevice
} from 'playcanvas';
import './starter.css';

const canvas = document.getElementById('application-canvas') as HTMLCanvasElement;
const device = await createGraphicsDevice(canvas);
device.maxPixelRatio = Math.min(window.devicePixelRatio, 2);
const options = new AppOptions();
options.graphicsDevice = device;
options.componentSystems = [RenderComponentSystem, CameraComponentSystem, LightComponentSystem];
const app = new AppBase(canvas);
app.init(options);
app.start();
app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
app.setCanvasResolution(RESOLUTION_AUTO);
const resize = () => app.resizeCanvas();
window.addEventListener('resize', resize);
app.on('destroy', () => window.removeEventListener('resize', resize));
app.scene.ambientLight = new Color(0.45, 0.48, 0.5);

const mat = (hex: string) => {
    const value = Number.parseInt(hex.slice(1), 16);
    const c = new Color(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
    const m = new StandardMaterial();
    m.diffuse = c;
    m.update();
    return m;
};
const materials = {
    asphalt: mat('#35383a'), lane: mat('#f2d779'), curb: mat('#b9b1a0'),
    concrete: mat('#b9a88f'), wall: mat('#d6b78d'), rust: mat('#a95d3b'),
    blue: mat('#276c83'), teal: mat('#277a68'), cream: mat('#eadbbd'),
    dark: mat('#2c3030'), yellow: mat('#e4ad35'), keke: mat('#dfb62f'),
    red: mat('#bd4939'), white: mat('#e5e0d3'), green: mat('#46704a'),
    foliage: mat('#315840'), skin: mat('#8b5639'), shirt: mat('#cb5937'),
    pants: mat('#303b4a'), crate: mat('#96633c'), fruit: mat('#cc683e'), coin: mat('#30bd70')
};
const makeBox = (name: string, parent: Entity, position: [number, number, number], scale: [number, number, number], material: StandardMaterial) => {
    const e = new Entity(name);
    e.setLocalPosition(...position);
    e.setLocalScale(...scale);
    e.addComponent('render', { type: 'box', material });
    parent.addChild(e);
    return e;
};
const root = app.root;
const laneDashes: Entity[] = [];
const medianMarks: Entity[] = [];

// Ogui Road inspired street: broad asphalt, painted median, sidewalks and compact shop fronts.
makeBox('road', root, [0, -0.14, -80], [13, 0.28, 180], materials.asphalt);
makeBox('left-shoulder', root, [-7, -0.05, -80], [1, 0.35, 180], materials.curb);
makeBox('right-shoulder', root, [7, -0.05, -80], [1, 0.35, 180], materials.curb);
for (const x of [-2.2, 2.2]) {
    for (let i = 0; i < 22; i++) laneDashes.push(makeBox('lane-dash', root, [x, 0.015, 5 - i * 8], [0.12, 0.025, 3.8], materials.lane));
}
// Central low divider and alternating painted sections.
makeBox('median', root, [0, 0.16, -80], [0.48, 0.32, 180], materials.concrete);
for (let i = 0; i < 20; i++) medianMarks.push(makeBox('median-mark', root, [0, 0.34, 4 - i * 9], [0.36, 0.04, 4.2], i % 2 ? materials.white : materials.yellow));

// Repeating shop blocks, awnings, signboards, compound walls and a few trees create a recognizable Enugu corridor.
const scenery: { entity: Entity; baseZ: number; side: number; span: number }[] = [];
for (let i = 0; i < 12; i++) {
    const z = -i * 17 - 9;
    for (const side of [-1, 1]) {
        const group = new Entity(`ogui-road-block-${i}-${side}`);
        group.setPosition(0, 0, z);
        root.addChild(group);
        const x = side * 9.2;
        const height = 4.4 + (i % 3) * 0.7;
        makeBox('shop', group, [x, height / 2, 0], [3.8, height, 11], i % 2 ? materials.wall : materials.cream);
        makeBox('shop-front', group, [x - side * 1.94, 1.3, 0], [0.08, 1.7, 3], materials.dark);
        makeBox('awning', group, [x - side * 2.35, 2.45, 0], [0.9, 0.18, 4.6], i % 2 ? materials.blue : materials.rust);
        makeBox('signboard', group, [x - side * 2.02, 3.65, -1.1], [0.14, 0.7, 4.5], i % 3 ? materials.teal : materials.red);
        if (i % 2 === 0) {
            makeBox('tree-trunk', group, [side * 7.2, 1.1, -5], [0.36, 2.2, 0.36], materials.crate);
            const crown = new Entity('street-tree-crown');
            crown.setPosition(side * 7.2, 3, -5);
            crown.setLocalScale(2.4, 2.4, 2.4);
            crown.addComponent('render', { type: 'sphere', material: materials.foliage });
            group.addChild(crown);
        }
        scenery.push({ entity: group, baseZ: z, side, span: 12 * 17 });
    }
}

// Roadside advertising boards sit beyond the curb, above pedestrian height and clear of every lane.
for (const z of [-25, -84, -143]) {
    for (const side of [-1, 1]) {
        const board = new Entity('roadside-advertising-board');
        board.setPosition(side * 8.1, 4.4, z);
        root.addChild(board);
        makeBox('billboard-post', board, [0, -1.5, 0], [0.18, 3, 0.18], materials.dark);
        makeBox('billboard-panel', board, [0, 0, 0], [3.6, 1.8, 0.2], side > 0 ? materials.teal : materials.rust);
        makeBox('billboard-copy-line', board, [0, 0.25, 0.12], [2.55, 0.12, 0.05], materials.white);
        makeBox('billboard-copy-mark', board, [-0.7, -0.15, 0.13], [0.75, 0.32, 0.05], materials.yellow);
        scenery.push({ entity: board, baseZ: z, side, span: 177 });
    }
}

// Player is a compact stylized commuter; lanes are at -4, 0, and 4 metres.
const player = new Entity('runner');
root.addChild(player);
makeBox('runner-body', player, [0, 1.1, 0], [0.75, 1.05, 0.48], materials.shirt);
makeBox('runner-head', player, [0, 1.92, 0], [0.55, 0.58, 0.54], materials.skin);
makeBox('runner-hair', player, [0, 2.2, -0.02], [0.58, 0.18, 0.56], materials.dark);
const limbs = {
    leftLeg: makeBox('runner-left-leg', player, [-0.2, 0.42, 0], [0.22, 0.82, 0.28], materials.pants),
    rightLeg: makeBox('runner-right-leg', player, [0.2, 0.42, 0], [0.22, 0.82, 0.28], materials.pants),
    leftArm: makeBox('runner-left-arm', player, [-0.48, 1.12, 0], [0.2, 0.85, 0.24], materials.shirt),
    rightArm: makeBox('runner-right-arm', player, [0.48, 1.12, 0], [0.2, 0.85, 0.24], materials.shirt)
};
// The runner faces down the road; the camera sees their back as the street rushes toward them.
player.setEulerAngles(0, 180, 0);

const camera = new Entity('camera');
camera.addComponent('camera', { clearColor: new Color(0.58, 0.77, 0.86), fov: 58 });
camera.setPosition(0, 7.3, 12.5);
camera.lookAt(0, 1.4, -11);
root.addChild(camera);
const sun = new Entity('sun');
sun.addComponent('light', { type: 'directional', intensity: 1.8, castShadows: true, shadowResolution: 1024 });
sun.setEulerAngles(40, 25, 0);
root.addChild(sun);

type Obstacle = { entity: Entity; z: number; lane: number; kind: 'car' | 'keke' | 'crate' | 'barrier' | 'overhead'; nearMissChecked: boolean };
const obstacles: Obstacle[] = [];
type Collectible = { entity: Entity; z: number; lane: number };
const collectibles: Collectible[] = [];
const obstacleRoot = new Entity('traffic-and-hazards');
root.addChild(obstacleRoot);
let obstacleIndex = 0;
const spawnObstacle = () => {
    const lane = Math.floor(Math.random() * 3);
    const kinds: Obstacle['kind'][] = ['car', 'keke', 'crate', 'barrier', 'overhead'];
    const kind = kinds[obstacleIndex % kinds.length];
    obstacleIndex++;
    const e = new Entity(`${kind}-obstacle`);
    const x = (lane - 1) * 4;
    if (kind === 'car') {
        makeBox('car-body', e, [0, 0.72, 0], [2.7, 1.2, 4], materials.blue);
        makeBox('car-roof', e, [0, 1.48, -0.25], [2.05, 0.65, 2], materials.dark);
    } else if (kind === 'keke') {
        makeBox('keke-body', e, [0, 0.78, 0], [2, 1.45, 2.8], materials.keke);
        makeBox('keke-canopy', e, [0, 1.6, -0.05], [2.05, 0.18, 2.15], materials.dark);
    } else if (kind === 'crate') {
        makeBox('market-crate', e, [0, 0.5, 0], [1.5, 1, 1.3], materials.crate);
        makeBox('produce', e, [0, 1.08, 0], [0.8, 0.22, 0.8], materials.fruit);
    } else if (kind === 'barrier') {
        makeBox('road-barrier', e, [0, 0.58, 0], [3.3, 1.16, 0.7], materials.red);
        makeBox('barrier-stripe', e, [0, 0.58, -0.38], [2.9, 0.22, 0.04], materials.white);
    } else {
        // A low gantry spans every lane; ducking is the only safe response.
        makeBox('overhead-beam', e, [0, 2.12, 0], [12.5, 0.55, 0.75], materials.yellow);
        for (const x of [-5.8, 5.8]) makeBox('gantry-post', e, [x, 1.05, 0], [0.35, 2.1, 0.45], materials.red);
    }
    e.setPosition(x, 0, -70);
    obstacleRoot.addChild(e);
    obstacles.push({ entity: e, z: -42, lane: kind === 'overhead' ? -1 : lane, kind, nearMissChecked: false });
};
const spawnCoin = (z: number) => {
    const lane = Math.floor(Math.random() * 3);
    const coin = new Entity('K-currency');
    const disc = new Entity('green-K-coin');
    disc.setLocalScale(0.82, 0.82, 0.16);
    disc.addComponent('render', { type: 'cylinder', material: materials.coin });
    coin.addChild(disc);
    makeBox('K-stem', coin, [0, 0, 0.1], [0.1, 0.42, 0.04], materials.white);
    makeBox('K-arm-top', coin, [0.1, 0.09, 0.1], [0.1, 0.25, 0.04], materials.white).setEulerAngles(0, 0, -38);
    makeBox('K-arm-bottom', coin, [0.1, -0.09, 0.1], [0.1, 0.25, 0.04], materials.white).setEulerAngles(0, 0, 38);
    coin.setPosition((lane - 1) * 4, 1.25, z);
    obstacleRoot.addChild(coin);
    collectibles.push({ entity: coin, z, lane });
};

const startPanel = document.getElementById('start-panel')!;
const lobbyPanel = document.getElementById('lobby-panel')!;
const settingsPanel = document.getElementById('settings-panel')!;
const gameOverPanel = document.getElementById('game-over-panel')!;
const scoreLabel = document.getElementById('score')!;
const nearMissLabel = document.getElementById('near-misses')!;
const distanceLabel = document.getElementById('distance')!;
const finalScoreLabel = document.getElementById('final-score')!;
const startButton = document.getElementById('start-button')!;
const restartButton = document.getElementById('restart-button')!;
const lobbyButton = document.getElementById('lobby-button')!;
const locationLabel = document.getElementById('location-label')!;
const runEyebrow = document.getElementById('run-eyebrow')!;
const activeRunsList = document.getElementById('active-runs-list')!;
const activeCount = document.getElementById('active-count')!;
const audioContext = new AudioContext();
const musicGain = audioContext.createGain();
musicGain.gain.value = 0;
musicGain.connect(audioContext.destination);
const sfxGain = audioContext.createGain(); sfxGain.gain.value = 0.18; sfxGain.connect(audioContext.destination);
let musicEnabled = true;
let sfxEnabled = true;
let musicTimer = 0;
const ping = (frequency: number, duration: number, gain: GainNode, waveform: OscillatorType = 'sine') => {
    if (audioContext.state === 'suspended') void audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    oscillator.type = waveform; oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0.0001, audioContext.currentTime);
    envelope.gain.exponentialRampToValueAtTime(0.22, audioContext.currentTime + 0.015);
    envelope.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    oscillator.connect(envelope); envelope.connect(gain);
    oscillator.start(); oscillator.stop(audioContext.currentTime + duration + 0.02);
};
const buttonSound = () => { if (sfxEnabled) { ping(620, 0.09, sfxGain, 'triangle'); ping(880, 0.12, sfxGain, 'sine'); } };
const cardSound = () => { if (sfxEnabled) { ping(392, 0.16, sfxGain, 'sine'); ping(587, 0.2, sfxGain, 'triangle'); } };
const melody = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];
let melodyIndex = 0;
const musicStep = () => { if (musicEnabled) ping(melody[melodyIndex++ % melody.length], 1.1, musicGain, 'sine'); };
musicGain.gain.value = 0.055;
musicTimer = window.setInterval(musicStep, 620);
app.on('destroy', () => window.clearInterval(musicTimer));
const activeRuns = new Map<string, number>(JSON.parse(localStorage.getItem('ogui-active-runs') ?? '[]') as [string, number][]);
const renderActiveRuns = () => {
    activeRunsList.replaceChildren();
    activeCount.textContent = activeRuns.size.toString();
    if (!activeRuns.size) { const empty = document.createElement('p'); empty.className = 'empty-runs'; empty.textContent = 'Your started routes will appear here.'; activeRunsList.append(empty); return; }
    for (const [area, best] of activeRuns) {
        const button = document.createElement('button'); button.className = 'active-run-card';
        button.innerHTML = `<span><strong>${area}</strong><small>ENUGU · BEST ${best} M</small></span><b>CONTINUE ↗</b>`;
        button.addEventListener('click', () => { selectedArea = area; cardSound(); resetGame(); });
        activeRunsList.append(button);
    }
};
renderActiveRuns();
let running = false;
let distance = 0;
let lane = 1;
let lanePosition = 0;
let speed = 18;
let jump = 0;
let jumpVelocity = 0;
let slideTime = 0;
let spawnTimer = 1.7;
let score = 0;
let coins = 0;
let dashTime = 0;
let shakeTime = 0;
let shakeStrength = 0;
let selectedArea = 'Ogui';
let nearMisses = 0;
let runClock = 0;
const setPanel = (el: HTMLElement, visible: boolean) => el.classList.toggle('hidden', !visible);
const resetGame = () => {
    running = true;
    distance = 0; lane = 1; lanePosition = 0; speed = 18; jump = 0; jumpVelocity = 0;
    slideTime = 0; dashTime = 0; spawnTimer = 1.4; score = 0; coins = 0; nearMisses = 0; runClock = 0;
    nearMissLabel.textContent = '0';
    for (const obstacle of obstacles) obstacle.entity.destroy();
    obstacles.length = 0;
    for (const coin of collectibles) coin.entity.destroy();
    collectibles.length = 0;
    setPanel(startPanel, false); setPanel(gameOverPanel, false); setPanel(lobbyPanel, false); setPanel(settingsPanel, false);
    player.enabled = true;
};
const endGame = () => {
    running = false;
    finalScoreLabel.textContent = `${Math.floor(score).toLocaleString()} m`;
    activeRuns.set(selectedArea, Math.max(activeRuns.get(selectedArea) ?? 0, Math.floor(score)));
    localStorage.setItem('ogui-active-runs', JSON.stringify([...activeRuns]));
    renderActiveRuns();
    setPanel(gameOverPanel, true);
};
startButton.addEventListener('click', () => { buttonSound(); setPanel(startPanel, false); setPanel(lobbyPanel, true); });
restartButton.addEventListener('click', () => { buttonSound(); resetGame(); });
const showLobby = () => { running = false; setPanel(startPanel, false); setPanel(gameOverPanel, false); setPanel(lobbyPanel, true); };
lobbyButton.addEventListener('click', () => { buttonSound(); showLobby(); });
document.getElementById('settings-open')!.addEventListener('click', () => { buttonSound(); setPanel(lobbyPanel, false); setPanel(settingsPanel, true); });
document.getElementById('settings-close')!.addEventListener('click', () => { buttonSound(); setPanel(settingsPanel, false); setPanel(lobbyPanel, true); });
document.getElementById('music-toggle')!.addEventListener('change', (event) => { musicEnabled = (event.target as HTMLInputElement).checked; musicGain.gain.value = musicEnabled ? Number((document.getElementById('music-volume') as HTMLInputElement).value) / 1800 : 0; buttonSound(); });
document.getElementById('music-volume')!.addEventListener('input', (event) => { musicGain.gain.value = musicEnabled ? Number((event.target as HTMLInputElement).value) / 1800 : 0; });
document.getElementById('sfx-toggle')!.addEventListener('change', (event) => { sfxEnabled = (event.target as HTMLInputElement).checked; buttonSound(); });
document.querySelectorAll<HTMLButtonElement>('.area-card').forEach((button) => button.addEventListener('click', () => {
    selectedArea = button.dataset.area ?? 'Ogui';
    cardSound();
    locationLabel.textContent = `${selectedArea.toUpperCase()}, ENUGU`;
    runEyebrow.textContent = `${selectedArea.toUpperCase()} · ENUGU`;
    activeRuns.set(selectedArea, activeRuns.get(selectedArea) ?? 0);
    localStorage.setItem('ogui-active-runs', JSON.stringify([...activeRuns]));
    renderActiveRuns();
    resetGame();
}));

const moveLane = (delta: number) => { if (running) lane = Math.max(0, Math.min(2, lane + delta)); };
const jumpAction = () => { if (running && jump <= 0.02) jumpVelocity = 8.2; };
const slideAction = () => { if (running && jump < 0.1) slideTime = 0.65; };
const dashAction = () => { if (running) dashTime = 0.42; };
const onKey = (event: KeyboardEvent) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) event.preventDefault();
    if (event.repeat) return;
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') moveLane(-1);
    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') moveLane(1);
    if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w' || event.key === ' ') jumpAction();
    if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') slideAction();
    if (event.key === 'Shift') dashAction();
};
window.addEventListener('keydown', onKey);
app.on('destroy', () => window.removeEventListener('keydown', onKey));
let touchX = 0; let touchY = 0;
canvas.addEventListener('pointerdown', (event) => { touchX = event.clientX; touchY = event.clientY; });
canvas.addEventListener('pointerup', (event) => {
    const dx = event.clientX - touchX; const dy = event.clientY - touchY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) moveLane(dx > 0 ? 1 : -1);
    else if (dy < 0) jumpAction(); else slideAction();
});

app.on('update', (dt: number) => {
    if (!running) return;
    runClock += dt;
    distance += speed * dt;
    score = distance;
    speed = Math.min(30, 18 + distance * 0.018) * (dashTime > 0 ? 1.8 : 1);
    lanePosition += ((lane - 1) * 4 - lanePosition) * Math.min(1, dt * 12);
    jumpVelocity -= 21 * dt;
    jump = Math.max(0, jump + jumpVelocity * dt);
    if (jump === 0) jumpVelocity = 0;
    slideTime = Math.max(0, slideTime - dt);
    dashTime = Math.max(0, dashTime - dt);
    player.setPosition(lanePosition, jump + (slideTime > 0 ? -0.25 : Math.abs(Math.sin(runClock * 13)) * 0.045), 3);
    player.setLocalScale(1, slideTime > 0 ? 0.58 : 1, 1);
    const stride = slideTime > 0 ? 0 : Math.sin(runClock * 13) * 32;
    limbs.leftLeg.setLocalEulerAngles(stride, 0, 0);
    limbs.rightLeg.setLocalEulerAngles(-stride, 0, 0);
    limbs.leftArm.setLocalEulerAngles(-stride * 0.8, 0, 0);
    limbs.rightArm.setLocalEulerAngles(stride * 0.8, 0, 0);
    player.setEulerAngles(0, 180 + (lanePosition - (lane - 1) * 4) * 3, 0);
    distanceLabel.textContent = `${Math.floor(distance).toString().padStart(4, '0')} m`;
    scoreLabel.textContent = Math.floor(score).toString();
    camera.setPosition((Math.random() - 0.5) * shakeStrength, 7.3 + (Math.random() - 0.5) * shakeStrength, 12.5);
    shakeTime = Math.max(0, shakeTime - dt);
    shakeStrength = shakeTime > 0 ? shakeStrength * 0.9 : 0;

    for (const item of scenery) {
        const p = item.entity.getPosition();
        let z = p.z + speed * dt;
        if (z > 18) z -= item.span;
        item.entity.setPosition(p.x, p.y, z);
    }
    for (const dash of laneDashes) {
        const p = dash.getPosition(); let z = p.z + speed * dt;
        if (z > 12) z -= 176;
        dash.setPosition(p.x, p.y, z);
    }
    for (const mark of medianMarks) {
        const p = mark.getPosition(); let z = p.z + speed * dt;
        if (z > 12) z -= 180;
        mark.setPosition(p.x, p.y, z);
    }
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
        spawnObstacle();
        if (Math.random() > 0.32) spawnCoin(-42 - Math.random() * 10);
        spawnTimer = Math.max(0.82, 1.55 - distance * 0.0005) + Math.random() * 0.4;
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.z += speed * dt;
        obstacle.entity.setPosition(obstacle.kind === 'overhead' ? 0 : (obstacle.lane - 1) * 4, 0, obstacle.z);
        const halfWidth = obstacle.kind === 'car' ? 1.35 : obstacle.kind === 'keke' ? 1 : obstacle.kind === 'barrier' ? 1.65 : obstacle.kind === 'overhead' ? 6.25 : 0.75;
        const halfDepth = obstacle.kind === 'car' ? 2 : obstacle.kind === 'keke' ? 1.4 : obstacle.kind === 'barrier' ? 0.35 : obstacle.kind === 'overhead' ? 0.38 : 0.65;
        const centerX = obstacle.kind === 'overhead' ? 0 : (obstacle.lane - 1) * 4;
        const overlapsX = Math.abs(lanePosition - centerX) < halfWidth + 0.45;
        const overlapsZ = Math.abs(obstacle.z - 3) < halfDepth + 0.45;
        const canClear = obstacle.kind === 'overhead' ? slideTime > 0.05 : obstacle.kind === 'barrier' || obstacle.kind === 'crate' ? jump > 1 : slideTime > 0.05;
        if (overlapsX && overlapsZ && !canClear) { shakeTime = 0.3; shakeStrength = 0.2; endGame(); return; }
        if (!obstacle.nearMissChecked && obstacle.z > 3 + halfDepth + 0.45) {
            obstacle.nearMissChecked = true;
            const gap = Math.abs(lanePosition - centerX) - (halfWidth + 0.45);
            if (gap >= 0 && gap < 1.25) { nearMisses++; nearMissLabel.textContent = nearMisses.toString(); }
        }
        if (obstacle.z > 15) { obstacle.entity.destroy(); obstacles.splice(i, 1); }
    }
    for (let i = collectibles.length - 1; i >= 0; i--) {
        const coin = collectibles[i];
        coin.z += speed * dt;
        coin.entity.setPosition((coin.lane - 1) * 4, 1.25, coin.z);
        coin.entity.rotateLocal(0, 140 * dt, 0);
        if (coin.lane === lane && coin.z > 1 && coin.z < 4) {
            coins++;
            scoreLabel.textContent = `${coins} K`;
            coin.entity.destroy();
            collectibles.splice(i, 1);
        } else if (coin.z > 15) { coin.entity.destroy(); collectibles.splice(i, 1); }
    }
});

