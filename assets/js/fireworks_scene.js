// ===================================================================
// 시간 조각 상점 - 5th Feature: 은하재 3D Metaverse Scene (Single-Player / Static Safe)
// ===================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { FireworksAudioEngine } from './fireworks_audio.js';
import {
  groundHeightAt,
  createGlowTexture,
  createTerrainAndBay,
  createHilltopPavilion,
  createChristmasTree,
  createSittingDog,
  createLanternPost,
  createParkBench,
  createCliffRailing,
  createBungeoppangStall,
  createVisitorAvatar,
  createWishLanternMesh,
  createLanternRack,
  createSnowEnvironment,
  createHillNpcs,
  createSkyCountdownSprite,
  createGoldenTicket,
  createGoldenSparkPool,
  createHillSteppingStones,
  createCozyFirepit,
  createAmbientSkyLanterns,
  createEveningFireflies,
  createGroundLightPools,
  createClickRippleRing
} from './fireworks_entities.js';

const HILL_BOUNDS = {
  minX: -15.0,
  maxX: 15.0,
  minZ: -10.8,
  maxZ: 13.8
};

// Strictly 3 distinct, non-overlapping color palettes + New Year festive palette
const PALETTES = {
  gold: [0xffdf7a, 0xffb703, 0xfff3c4, 0xf4a261],
  aurora: [0x64dfdf, 0x80ffdb, 0x72efdd, 0x90e0ef],
  rose: [0xff8fab, 0xffb3c6, 0xffe5ec, 0xc77dff],
  newyear: [0xffd166, 0xf4f7fb, 0xff4d6d, 0xffe9a8]
};

const PROFILE_STORAGE_KEY = 'time_shop_hill_profile_v1';
const MIDNIGHT_PLAYED_KEY = 'eunhajae_midnight_played_v1';
const TICKET_SPOT_KEY = 'eunhajae_ticket_spot_idx';

// 3 Distinct Time-of-Day Presets (낮 / 노을 / 밤)
const TIME_PRESETS = {
  day: {
    label: '낮 (맑은 하늘)',
    bg: 0x5c94d4,
    fog: 0x7db0e3,
    fogDensity: 0.0038,
    hemiSky: 0xebf4ff,
    hemiGround: 0x434a59,
    hemiInt: 1.45,
    keyColor: 0xfff8e8,
    keyInt: 2.05,
    keyPos: [-18, 62, -74],
    waterDeep: 0x165387,
    waterMid: 0x2d7ab8,
    sunColor: 0xffffff,
    sunStrength: 0.24,
    nightLights: 0.0,
    starOpacity: 0.0,
    moonOpacity: 0.0,
    moonHaloOpacity: 0.0,
    bldgEmissive: 0.02,
    lampScale: 0.0,
    windowScale: 0.08,
    exposure: 1.0,
    envIntensity: 0.42
  },
  sunset: {
    label: '노을 (16~19시)',
    bg: 0x533866,
    fog: 0x6c4362,
    fogDensity: 0.0056,
    hemiSky: 0xffb784,
    hemiGround: 0x36243d,
    hemiInt: 1.08,
    keyColor: 0xffb066,
    keyInt: 1.85,
    keyPos: [-62, 18, -96],
    waterDeep: 0x162b54,
    waterMid: 0x364978,
    sunColor: 0xffa858,
    sunStrength: 0.92,
    nightLights: 0.62,
    starOpacity: 0.18,
    moonOpacity: 0.22,
    moonHaloOpacity: 0.16,
    bldgEmissive: 0.48,
    lampScale: 0.65,
    windowScale: 0.65,
    exposure: 1.08,
    envIntensity: 0.32
  },
  night: {
    label: '밤 (별빛 야경)',
    bg: 0x070614,
    fog: 0x090818,
    fogDensity: 0.0080,
    hemiSky: 0x5264a8,
    hemiGround: 0x161224,
    hemiInt: 0.85,
    keyColor: 0xffe6ba,
    keyInt: 1.35,
    keyPos: [-38, 43, -104],
    waterDeep: 0x061b3c,
    waterMid: 0x0c2f59,
    sunColor: 0xf2e0a6,
    sunStrength: 0.78,
    nightLights: 1.0,
    starOpacity: 0.9,
    moonOpacity: 1.0,
    moonHaloOpacity: 0.5,
    bldgEmissive: 0.78,
    lampScale: 1.0,
    windowScale: 1.0,
    exposure: 1.12,
    envIntensity: 0.28
  }
};

// Local NPC click dialogue lines (non-repeating per NPC)
const NPC_DIALOGUES = {
  manbok: [
    '오늘은 붕어빵 모양이 참 예쁘게 나왔어요!',
    '어서 와요! 오늘은 팥을 아주 듬뿍 넣었답니다!',
    '붕어빵은 머리부터? 꼬리부터? 그게 늘 고민이에요!',
    '추운 날엔 역시 따끈한 붕어빵이 최고죠!',
    '오늘은 붕어빵도 신나게 구워지는 날이에요!',
    '제 붕어빵의 비밀은 넉넉한 팥 인심이랍니다!',
    '붕어빵이 진짜 물고기라면 어떨까요?',
    '또 만났네요! 오늘도 붕어빵 생각이 나셨나요?'
  ],
  momo: [
    '몽이랑 이렇게 나란히 앉아 있는 시간이 좋아요.',
    '몽이는 지금 무슨 생각을 하고 있을까요?',
    '이런 평화로운 순간은 오래 기억하고 싶어요.',
    '계절이 바뀌는 건 참 신기한 일이에요.',
    '오늘 하늘은 유난히 색이 예쁘네요.',
    '가끔은 이렇게 가만히 앉아 있는 것도 참 좋죠.',
    '우리 몽이는 세상에서 제일 귀여워요. 그쵸?'
  ],
  bit: [
    '가만히 있으면 몸이 근질근질해요!',
    '오늘은 그루브가 아주 잘 타지는데요!',
    '춤에는 정답이 없어요! 마음 가는 대로!',
    '혹시 같이 춤춰볼 생각 없어요?',
    '발끝까지 신나야 진짜 춤이죠!',
    '오늘은 왠지 좋은 일이 생길 것 같아요!',
    '춤추다 보면 안 좋은 일도 싹 잊혀져요!'
  ],
  tori: [
    '오늘 마을에 새로운 소식 없었나요?',
    '아까 정말 신기한 걸 봤는데 말이에요!',
    '이곳은 구경할수록 새로운 게 보여요.',
    '시간이 조금만 천천히 갔으면 좋겠어요.',
    '오늘 밤에는 별이 많이 보일까요?',
    '가끔은 별일 없는 하루가 제일 좋더라고요.',
    '혹시 이 근처에 재미있는 곳을 아세요?'
  ],
  naru: [
    '저는 구름 모양 구경하는 걸 좋아해요.',
    '별에도 저마다 이야기가 있을까요?',
    '오늘은 왠지 좋은 꿈을 꿀 것 같아요.',
    '바람 소리를 듣고 있으면 마음이 편안해져요.',
    '하루에 작은 즐거움 하나쯤은 꼭 있어야 해요.',
    '시간을 멈출 수 있다면 지금을 멈추고 싶어요.',
    '저 멀리 어딘가에도 이런 곳이 있을까요?',
    '오늘 하루도 나름 괜찮았죠?'
  ],
  chichi: [
    '언덕 너머로 반짝이는 풍경이 참 예쁘죠!',
    '멀리서도 불꽃놀이가 잘 보인답니다.',
    '오늘 밤하늘도 기분 좋은 일이 가득하길 바라요!'
  ],
  mongi: [
    '멍멍! 오늘 밤하늘 별이 반짝반짝해요 🐾',
    '왈왈! 간식이나 따뜻한 불꽃 구경 같이 볼래요?',
    '멍! 바람 냄새가 참 기분 좋아요!'
  ]
};

// NPC Firework Reaction profiles (restricted strictly to bit, tori, naru, momo)
const NPC_FIREWORK_PROFILE = {
  bit:  { delayMin: 80,  delayMax: 240, lookProb: 1.0,  burstJumpProb: 0.72, burstWaveProb: 0.65, cooldownMs: 2200 },
  tori: { delayMin: 140, delayMax: 380, lookProb: 0.9,  burstJumpProb: 0.15, burstWaveProb: 0.55, cooldownMs: 2800 },
  naru: { delayMin: 210, delayMax: 460, lookProb: 0.95, burstJumpProb: 0.05, burstWaveProb: 0.08, cooldownMs: 3200 },
  momo: { delayMin: 160, delayMax: 400, lookProb: 0.85, burstJumpProb: 0.0,  burstWaveProb: 0.25, cooldownMs: 3100 }
};

// Discoverable Golden Ticket candidate hiding spots near scenic corners
const TICKET_HIDING_SPOTS = [
  { x: 11.4, z: -2.1 },
  { x: 4.5, z: 10.6 },
  { x: -11.6, z: 3.9 },
  { x: -10.9, z: -9.8 },
  { x: 7.4, z: -9.0 },
  { x: -10.8, z: 9.6 }
];

// Pre-allocated math helpers (zero GC inside animation loop)
const _vFwd = new THREE.Vector3();
const _vRight = new THREE.Vector3();
const _vMove = new THREE.Vector3();
const _vProj = new THREE.Vector3();
const _vCamPosGoal = new THREE.Vector3();
const _vCamTargetGoal = new THREE.Vector3();
const _vKeyPosGoal = new THREE.Vector3();
const _colorTmp = new THREE.Color();
const _tmpSkyBg = new THREE.Color();
const _tmpFogCol = new THREE.Color();
const _tmpHemiSky = new THREE.Color();
const _tmpHemiGround = new THREE.Color();
const _tmpKeyCol = new THREE.Color();
const _tmpWaterDeep = new THREE.Color();
const _tmpWaterMid = new THREE.Color();
const _tmpSunCol = new THREE.Color();
const _raycaster = new THREE.Raycaster();
const _pointerNdc = new THREE.Vector2();
const _skyPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 40);
const _skyHit = new THREE.Vector3();

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerpAngle(current, target, alpha) {
  let diff = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * alpha;
}

function loadSavedProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (e) {
    return null;
  }
}

function saveProfileLocal(profile) {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {}
}

function formatDateKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function hasMidnightPlayedForKey(dateKey) {
  try {
    return localStorage.getItem(MIDNIGHT_PLAYED_KEY) === dateKey;
  } catch (e) {
    return false;
  }
}

function markMidnightPlayedForKey(dateKey) {
  try {
    localStorage.setItem(MIDNIGHT_PLAYED_KEY, dateKey);
  } catch (e) {}
}

function resolveAutoTimeMode(dateObj = new Date()) {
  const h = dateObj.getHours();
  if (h >= 16 && h < 19) return 'sunset'; // 16:00 ~ 19:00 노을
  if (h >= 6 && h < 16) return 'day';     // 06:00 ~ 16:00 낮
  return 'night';                         // 19:00 ~ 06:00 밤
}

function detectSoftwareWebGL() {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return { supported: false, isSoftwareGl: true };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    const isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    return { supported: true, isSoftwareGl };
  } catch (e) {
    return { supported: false, isSoftwareGl: true };
  }
}

function reportFailure(err, reason) {
  if (typeof window.__handleEunhajaeFailure === 'function') {
    window.__handleEunhajaeFailure(err, reason);
  } else {
    console.error('[은하재] 초기화 실패:', reason, err);
    const el = document.getElementById('webgl-fallback');
    if (el) el.classList.add('is-visible');
  }
}

export async function initEunhajaeScene() {
  const canvas = document.getElementById('fireworks-canvas');
  const labelsLayer = document.getElementById('world-labels-layer');
  const skyHintBanner = document.getElementById('sky-hint-banner');

  const soundToggleBtn = document.getElementById('btn-sound-toggle');
  const soundIcon = document.getElementById('sound-icon');
  const btnBackToHill = document.getElementById('btn-back-to-hill');

  const countdownLiveEl = document.getElementById('midnight-countdown');
  const nextMidnightTimerEl = document.getElementById('next-midnight-timer');
  const btnPreviewCountdown = document.getElementById('btn-preview-countdown');

  const mobileMovePad = document.getElementById('mobile-move-pad');
  const actionDock = document.getElementById('action-dock');
  const btnHideDock = document.getElementById('btn-hide-dock');
  const btnShowDock = document.getElementById('btn-show-dock');

  const btnLaunchFirework = document.getElementById('btn-launch-firework');
  const btnLaunchFinale = document.getElementById('btn-launch-finale');
  const btnToggleWish = document.getElementById('btn-toggle-wish');
  const btnToggleSit = document.getElementById('btn-toggle-sit');
  const sitBtnLabel = document.getElementById('sit-btn-label');
  const btnToggleDance = document.getElementById('btn-toggle-dance');
  const danceBtnLabel = document.getElementById('dance-btn-label');
  const btnToggleSettings = document.getElementById('btn-toggle-settings');
  const btnToggleGuide = document.getElementById('btn-toggle-guide');

  const wishSheet = document.getElementById('wish-sheet');
  const wishForm = document.getElementById('wish-form');
  const inputWish = document.getElementById('input-wish');
  const btnCloseWish = document.getElementById('btn-close-wish');

  const bungeoppangSheet = document.getElementById('bungeoppang-sheet');
  const btnCloseBungeoppang = document.getElementById('btn-close-bungeoppang');

  const settingsSheet = document.getElementById('settings-sheet');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const guideSheet = document.getElementById('guide-sheet');
  const btnCloseGuide = document.getElementById('btn-close-guide');
  const timeModeStatusEl = document.getElementById('time-mode-status');
  const inputNickname = document.getElementById('input-nickname');
  const btnSaveProfile = document.getElementById('btn-save-profile');
  const btnBgmToggle = document.getElementById('btn-bgm-toggle');
  const rangeBgmVolume = document.getElementById('range-bgm-volume');
  const btnSfxToggle = document.getElementById('btn-sfx-toggle');
  const btnAmbientToggle = document.getElementById('btn-ambient-toggle');

  const ticketModal = document.getElementById('golden-ticket-modal');
  const btnCloseTicketModal = document.getElementById('btn-close-ticket-modal');

  if (!canvas) {
    reportFailure(new Error('Missing canvas element'), 'no_canvas');
    return false;
  }

  const { supported, isSoftwareGl } = detectSoftwareWebGL();
  if (!supported) {
    reportFailure(new Error('WebGL unsupported'), 'webgl_unsupported');
    return false;
  }

  let viewportW = window.innerWidth;
  let viewportH = window.innerHeight;
  const isMobile =
    window.matchMedia('(hover: none) and (pointer: coarse)').matches ||
    Math.min(viewportW, viewportH) <= 768;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isSoftwareGl && !isMobile,
      powerPreference: isMobile ? 'default' : 'high-performance'
    });
  } catch (err) {
    reportFailure(err, 'webgl_context_creation_failed');
    return false;
  }

  function getTargetPixelRatio() {
    if (isSoftwareGl) return 1;
    const rawDpr = window.devicePixelRatio || 1;
    return isMobile ? Math.min(rawDpr, 1.25) : Math.min(rawDpr, 1.75);
  }

  renderer.setSize(viewportW, viewportH, false);
  renderer.setPixelRatio(getTargetPixelRatio());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = !isSoftwareGl && !isMobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070614);
  scene.fog = new THREE.FogExp2(0x090818, 0.0080);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
  scene.environment = envTarget.texture;
  scene.environmentIntensity = isMobile ? 0.22 : 0.28;
  roomEnv.dispose();
  pmremGenerator.dispose();

  const camera = new THREE.PerspectiveCamera(54, viewportW / viewportH, 0.2, 240);

  // Initial local player state
  const savedProfile = loadSavedProfile();
  const selfState = {
    name: savedProfile?.name || '나',
    coatColor: savedProfile?.coatColor || '#c94c4c',
    lanternColor: savedProfile?.lanternColor || '#ffd166',
    x: 0.2,
    z: -2.0,
    yaw: Math.PI,
    moving: false,
    sitting: false,
    dancing: false,
    eating: false
  };

  if (savedProfile?.name && inputNickname) {
    inputNickname.value = savedProfile.name;
  }

  const startGroundY = groundHeightAt(selfState.x, selfState.z);
  camera.position.set(selfState.x, startGroundY + 3.8, selfState.z + 9.6);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(selfState.x, startGroundY + 2.0, selfState.z - 6.5);
  controls.enableDamping = !isSoftwareGl;
  controls.dampingFactor = 0.08;
  controls.enablePan = true;
  controls.screenSpacePanning = false;
  controls.minDistance = 2.6;
  controls.maxDistance = 58;
  controls.minPolarAngle = 0.22;
  controls.maxPolarAngle = Math.PI * 0.62;
  controls.update();

  // Lighting Rig
  const hemiLight = new THREE.HemisphereLight(0x5264a8, 0x161224, 0.85);
  scene.add(hemiLight);

  const moonKeyLight = new THREE.DirectionalLight(0xffe6ba, 1.35);
  moonKeyLight.position.set(-38, 43, -104);
  if (!isSoftwareGl && !isMobile) {
    moonKeyLight.castShadow = true;
    moonKeyLight.shadow.mapSize.set(1024, 1024);
    moonKeyLight.shadow.camera.near = 10;
    moonKeyLight.shadow.camera.far = 165;
    moonKeyLight.shadow.camera.left = -24;
    moonKeyLight.shadow.camera.right = 24;
    moonKeyLight.shadow.camera.top = 24;
    moonKeyLight.shadow.camera.bottom = -24;
    moonKeyLight.shadow.bias = -0.0005;
    moonKeyLight.shadow.normalBias = 0.02;
  }
  scene.add(moonKeyLight);

  const glowTexture = createGlowTexture();
  glowTexture.anisotropy = isMobile ? 1 : Math.min(4, renderer.capabilities.getMaxAnisotropy());

  // Build World Terrain, Han River, Wide Namsan + N Seoul Tower, Library & Houses
  const {
    starField,
    waterUniforms,
    atmosphereRefs,
    beaconMat,
    beaconHaloMat,
    blueHouseInfo,
    snowRefs
  } = createTerrainAndBay(scene, glowTexture, { isMobile });

  // Spread 3 primary landmarks across distinct zones while preserving Cliffside Benches & 몽이
  const stallX = -10.2;
  const stallZ = 2.8;
  const treeX = 10.2;
  const treeZ = -0.8;
  const pavilionX = 7.4;
  const pavilionZ = 8.4;
  const firepitX = -4.8;
  const firepitZ = 4.4;

  const pavilionGroup = createHilltopPavilion(pavilionX, pavilionZ, glowTexture);
  scene.add(pavilionGroup);

  const christmasTree = createChristmasTree(treeX, treeZ, glowTexture);
  scene.add(christmasTree);

  const bungeoppangStall = createBungeoppangStall(stallX, stallZ, glowTexture, !isMobile);
  scene.add(bungeoppangStall);

  const cozyFirepit = createCozyFirepit(firepitX, firepitZ, glowTexture, !isMobile);
  scene.add(cozyFirepit.group);

  const steppingStones = createHillSteppingStones({
    stall: { x: stallX, z: stallZ },
    tree: { x: treeX, z: treeZ },
    pavilion: { x: pavilionX, z: pavilionZ },
    firepit: { x: firepitX, z: firepitZ }
  });
  scene.add(steppingStones);

  // Cliffside Dog (몽이) & Bench Specs (Fixed positions untouched!)
  const cliffDog = createSittingDog(1.65, -9.15, Math.PI);
  scene.add(cliffDog);

  scene.add(createCliffRailing());

  const lanternPosts = [
    createLanternPost(-10.5, -10.5, glowTexture, false),
    createLanternPost(-3.5, -11.0, glowTexture, !isMobile),
    createLanternPost(4.2, -11.0, glowTexture, false),
    createLanternPost(11.0, -10.2, glowTexture, false)
  ];
  lanternPosts.forEach((lp) => scene.add(lp));

  const hillLampLights = [];
  [pavilionGroup, christmasTree, bungeoppangStall, cozyFirepit.group, ...lanternPosts].forEach((grp) => {
    grp.traverse((node) => {
      if (node.isPointLight) {
        hillLampLights.push({ light: node, baseIntensity: node.intensity });
      }
    });
  });

  // Only the 3 cliffside benches remain interactive benches (Bosingak bench removed)
  const benchSpecs = [
    { id: 'cliff-left', x: -4.8, z: -8.8, yaw: 0.1, seatY: groundHeightAt(-4.8, -8.8), mesh: null },
    { id: 'cliff-center', x: 0.2, z: -9.2, yaw: 0, seatY: groundHeightAt(0.2, -9.2), mesh: null },
    { id: 'cliff-right', x: 5.6, z: -8.7, yaw: -0.12, seatY: groundHeightAt(5.6, -8.7), mesh: null }
  ];

  const interactiveBenchMeshes = [];
  benchSpecs.forEach((b) => {
    const mesh = createParkBench(b.x, b.z, b.yaw);
    mesh.userData.benchId = b.id;
    b.mesh = mesh;
    scene.add(mesh);
    interactiveBenchMeshes.push(mesh);
  });

  // Lantern Mode Rack, Expanded Ambient Floating Sky Lanterns, Ground Light Pools & Horizon Motion
  const lanternRack = createLanternRack(glowTexture);
  scene.add(lanternRack);

  const ambientSkyLanterns = createAmbientSkyLanterns(glowTexture, isMobile ? 16 : 28);
  scene.add(ambientSkyLanterns.group);

  const eveningFireflies = createEveningFireflies(glowTexture, isMobile ? 14 : 28);
  scene.add(eveningFireflies.points);

  const groundLightPools = createGroundLightPools(glowTexture, [
    { x: pavilionX, z: pavilionZ, radius: 7.2, color: 0xffc66e, opacity: 0.34 },
    { x: stallX, z: stallZ, radius: 5.6, color: 0xffb357, opacity: 0.36 },
    { x: treeX, z: treeZ, radius: 6.2, color: 0xffe08a, opacity: 0.34 },
    { x: firepitX, z: firepitZ, radius: 4.8, color: 0xff8c42, opacity: 0.44, flicker: true },
    { x: 0.0, z: 4.0, radius: 3.8, color: 0xffcf73, opacity: 0.24 },
    { x: -10.5, z: -10.5, radius: 3.6, color: 0xffd175, opacity: 0.28 },
    { x: -3.5, z: -11.0, radius: 3.8, color: 0xffd175, opacity: 0.3 },
    { x: 4.2, z: -11.0, radius: 3.6, color: 0xffd175, opacity: 0.28 },
    { x: 11.0, z: -10.2, radius: 3.6, color: 0xffd175, opacity: 0.28 }
  ]);
  scene.add(groundLightPools.group);

  const clickRipple = createClickRippleRing();
  scene.add(clickRipple.mesh);

  const snowEnv = createSnowEnvironment(
    scene,
    snowRefs,
    benchSpecs,
    { x: pavilionX, z: pavilionZ },
    { x: stallX, z: stallZ },
    { x: treeX, z: treeZ },
    { isMobile }
  );

  // Named NPCs: 모모, 비트, 토리, 나루
  const hillNpcs = createHillNpcs();
  const npcClickMeshes = [];
  hillNpcs.forEach((npc) => {
    scene.add(npc.group);
    npcClickMeshes.push(npc.group);
  });

  // Self Nameplate Only (NPC overhead name tags removed per feedback!)
  function createWorldLabelEl(text, extraClass = '') {
    const el = document.createElement('div');
    el.className = extraClass ? `world-label ${extraClass}` : 'world-label';
    el.textContent = text;
    labelsLayer?.appendChild(el);
    return el;
  }

  const waveLabelEl = blueHouseInfo ? document.createElement('div') : null;
  if (waveLabelEl && labelsLayer) {
    waveLabelEl.className = 'world-wave-label';
    waveLabelEl.textContent = '반가워요! 👋';
    waveLabelEl.style.opacity = '0';
    labelsLayer.appendChild(waveLabelEl);
  }

  const eatBubbleEl = document.createElement('div');
  eatBubbleEl.className = 'world-eat-bubble';
  eatBubbleEl.style.opacity = '0';
  labelsLayer?.appendChild(eatBubbleEl);

  const npcBubbleEl = document.createElement('div');
  npcBubbleEl.className = 'world-npc-bubble';
  npcBubbleEl.style.opacity = '0';
  const npcBubbleSpeakerEl = document.createElement('span');
  npcBubbleSpeakerEl.className = 'npc-bubble-speaker';
  const npcBubbleTextEl = document.createElement('span');
  npcBubbleEl.appendChild(npcBubbleSpeakerEl);
  npcBubbleEl.appendChild(npcBubbleTextEl);
  labelsLayer?.appendChild(npcBubbleEl);

  const NPC_SPEAKER_NAMES = {
    manbok: '만복',
    momo: '모모',
    bit: '비트',
    tori: '토리',
    naru: '나루',
    chichi: '치치',
    mongi: '몽이'
  };

  let activeBubbleNpc = null; // { getWorldPos: () => Vector3 }
  let npcBubbleUntilMs = 0;
  const lastNpcLineIdx = new Map();

  function showNpcDialogue(npcKey, worldPosGetter) {
    const lines = NPC_DIALOGUES[npcKey];
    if (!lines || !lines.length || !npcBubbleEl) return;
    const prevIdx = lastNpcLineIdx.has(npcKey) ? lastNpcLineIdx.get(npcKey) : -1;
    let nextIdx = Math.floor(Math.random() * lines.length);
    if (lines.length > 1 && nextIdx === prevIdx) {
      nextIdx = (nextIdx + 1 + Math.floor(Math.random() * (lines.length - 1))) % lines.length;
    }
    lastNpcLineIdx.set(npcKey, nextIdx);
    const speaker = NPC_SPEAKER_NAMES[npcKey] || '';
    npcBubbleSpeakerEl.textContent = speaker;
    npcBubbleSpeakerEl.style.display = speaker ? 'block' : 'none';
    npcBubbleTextEl.textContent = lines[nextIdx];
    activeBubbleNpc = { getWorldPos: worldPosGetter };
    npcBubbleUntilMs = performance.now() + 4200;
  }

  // 3D Sky Countdown & New Year Message Sprite
  const skyCountdown = createSkyCountdownSprite();
  scene.add(skyCountdown.sprite);

  // Hidden Golden Ticket (rerolls cleanly across entries from Main) + Pooled Player Gold Sparks
  let ticketSpotIdx = 0;
  try {
    const prevRaw = sessionStorage.getItem(TICKET_SPOT_KEY);
    const prevIdx = prevRaw !== null ? parseInt(prevRaw, 10) : -1;
    let pick = Math.floor(Math.random() * TICKET_HIDING_SPOTS.length);
    if (TICKET_HIDING_SPOTS.length > 1 && pick === prevIdx) {
      pick = (pick + 1 + Math.floor(Math.random() * (TICKET_HIDING_SPOTS.length - 1))) % TICKET_HIDING_SPOTS.length;
    }
    ticketSpotIdx = pick;
    sessionStorage.setItem(TICKET_SPOT_KEY, String(pick));
  } catch (e) {
    ticketSpotIdx = Math.floor(Math.random() * TICKET_HIDING_SPOTS.length);
  }
  const ticketSpot = TICKET_HIDING_SPOTS[ticketSpotIdx];
  const ticketY = groundHeightAt(ticketSpot.x, ticketSpot.z) + 0.28;
  const goldenTicket = createGoldenTicket(glowTexture);
  goldenTicket.position.set(ticketSpot.x, ticketY, ticketSpot.z);
  goldenTicket.rotation.set(0.45, 0.55, 0.14);
  scene.add(goldenTicket);

  let ticketFound = false;
  let ticketModalOpen = false;
  const goldenSparkPool = createGoldenSparkPool(glowTexture, isMobile ? 14 : 20);
  scene.add(goldenSparkPool.group);

  // Bosingak Bell Strike Animation State
  let bellStrikeStartMs = -10000;
  let bellSoundPending = false;
  let bellSwayAge = 10;

  // Audio Engine (BGM + SFX + Spatial Ambient)
  const audio = new FireworksAudioEngine();
  let isMuted = false;

  function triggerBosingakBell() {
    audio.ensureContext();
    const now = performance.now();
    if (now - bellStrikeStartMs < 750) return;
    bellStrikeStartMs = now;
    bellSoundPending = true;
  }

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  function tryUnlockAudio() {
    if (!isMuted) {
      audio.ensureContext();
    }
    if (audio.isRunning() || isMuted) {
      window.removeEventListener('pointerdown', tryUnlockAudio);
      window.removeEventListener('click', tryUnlockAudio);
      window.removeEventListener('touchend', tryUnlockAudio);
      window.removeEventListener('keydown', tryUnlockAudio);
    }
  }
  window.addEventListener('pointerdown', tryUnlockAudio, { passive: true });
  window.addEventListener('click', tryUnlockAudio, { passive: true });
  window.addEventListener('touchend', tryUnlockAudio, { passive: true });
  window.addEventListener('keydown', tryUnlockAudio, { passive: true });

  if (!isMuted) {
    audio.ensureContext();
  }

  // =================================================================
  // NPC Firework Reaction Helpers (Restricted to Bit, Tori, Naru, Momo)
  // =================================================================
  const FIREWORK_REACT_IDS = new Set(['bit', 'tori', 'naru', 'momo']);

  function notifyNpcsFireworkLaunch() {
    const now = performance.now();
    for (let i = 0; i < hillNpcs.length; i++) {
      const npc = hillNpcs[i];
      if (!FIREWORK_REACT_IDS.has(npc.id)) continue;
      const prof = NPC_FIREWORK_PROFILE[npc.id];
      const st = npc.fireworkReact;
      if (st.active || now < st.cooldownUntil) continue;
      if (Math.random() > prof.lookProb) continue;

      const delay = prof.delayMin + Math.random() * (prof.delayMax - prof.delayMin);
      st.active = true;
      st.phase = 'pending';
      st.delay = delay * 0.001;
      st.elapsed = 0;
      st.duration = 2.4 + Math.random() * 0.8;
      st.wantBurstJump = false;
      st.wantBurstWave = false;
      st.cooldownUntil = now + prof.cooldownMs;
    }
  }

  function notifyNpcsFireworkBurst() {
    const now = performance.now();
    for (let i = 0; i < hillNpcs.length; i++) {
      const npc = hillNpcs[i];
      if (!FIREWORK_REACT_IDS.has(npc.id)) continue;
      const prof = NPC_FIREWORK_PROFILE[npc.id];
      const st = npc.fireworkReact;
      if (!st.active && now < st.cooldownUntil) continue;
      if (!st.active) {
        st.active = true;
        st.phase = 'looking';
        st.delay = 0;
        st.elapsed = 0;
        st.duration = 2.1 + Math.random() * 0.7;
        st.cooldownUntil = now + prof.cooldownMs;
      }
      if (!st.wantBurstJump && !st.wantBurstWave) {
        st.wantBurstJump = Math.random() < prof.burstJumpProb;
        st.wantBurstWave = Math.random() < prof.burstWaveProb;
      }
    }
  }

  // =================================================================
  // Zero-GC Fireworks Particle Engine (Adaptive Quality Aware)
  // =================================================================
  const MAX_SPARKS = isMobile ? 2200 : 4200;
  const MAX_SHELLS = isMobile ? 18 : 26;

  const sparkGeo = new THREE.BufferGeometry();
  const sparkPositions = new Float32Array(MAX_SPARKS * 3);
  const sparkColors = new Float32Array(MAX_SPARKS * 3);
  const sparkVelX = new Float32Array(MAX_SPARKS);
  const sparkVelY = new Float32Array(MAX_SPARKS);
  const sparkVelZ = new Float32Array(MAX_SPARKS);
  const sparkBaseR = new Float32Array(MAX_SPARKS);
  const sparkBaseG = new Float32Array(MAX_SPARKS);
  const sparkBaseB = new Float32Array(MAX_SPARKS);
  const sparkAge = new Float32Array(MAX_SPARKS);
  const sparkLife = new Float32Array(MAX_SPARKS);
  const sparkDrag = new Float32Array(MAX_SPARKS);
  const sparkGravity = new Float32Array(MAX_SPARKS);
  const sparkTwinkle = new Uint8Array(MAX_SPARKS);

  for (let i = 0; i < MAX_SPARKS; i++) {
    sparkPositions[i * 3 + 1] = -500;
    sparkLife[i] = 0;
  }

  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
  sparkGeo.setAttribute('color', new THREE.BufferAttribute(sparkColors, 3));

  const sparkMat = new THREE.PointsMaterial({
    size: 1.08,
    sizeAttenuation: true,
    map: glowTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.96,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false
  });
  const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
  sparkPoints.frustumCulled = false;
  scene.add(sparkPoints);

  let sparkCursor = 0;
  let perfDegradeFactor = 1.0;

  function allocSpark(x, y, z, vx, vy, vz, hexColor, life, drag, gravity, twinkle = 0) {
    const idx = sparkCursor;
    sparkCursor = (sparkCursor + 1) % MAX_SPARKS;

    sparkPositions[idx * 3] = x;
    sparkPositions[idx * 3 + 1] = y;
    sparkPositions[idx * 3 + 2] = z;
    sparkVelX[idx] = vx;
    sparkVelY[idx] = vy;
    sparkVelZ[idx] = vz;

    _colorTmp.setHex(hexColor);
    sparkBaseR[idx] = _colorTmp.r;
    sparkBaseG[idx] = _colorTmp.g;
    sparkBaseB[idx] = _colorTmp.b;
    sparkColors[idx * 3] = _colorTmp.r;
    sparkColors[idx * 3 + 1] = _colorTmp.g;
    sparkColors[idx * 3 + 2] = _colorTmp.b;

    sparkAge[idx] = 0;
    sparkLife[idx] = life;
    sparkDrag[idx] = drag;
    sparkGravity[idx] = gravity;
    sparkTwinkle[idx] = twinkle;
  }

  const burstLights = (isMobile ? [0] : [0, 1]).map(() => {
    const pt = new THREE.PointLight(0xffdf7a, 0, 56, 1.45);
    pt.position.set(0, -100, 0);
    scene.add(pt);
    return { light: pt, age: 1, life: 1, peak: 0 };
  });
  let burstLightCursor = 0;

  function flashBurstLight(x, y, z, hexColor) {
    const slot = burstLights[burstLightCursor];
    burstLightCursor = (burstLightCursor + 1) % burstLights.length;
    slot.light.color.setHex(hexColor);
    slot.light.position.set(x, y, z);
    slot.age = 0;
    slot.life = 0.55;
    slot.peak = 5.0;
  }

  const shellPool = [];
  for (let i = 0; i < MAX_SHELLS; i++) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: 0xffe4a0,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false
      })
    );
    sprite.scale.set(1.3, 1.3, 1);
    sprite.visible = false;
    scene.add(sprite);
    shellPool.push({
      active: false,
      sprite,
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      targetY: 24,
      trailTimer: 0,
      burstType: 'chrysanthemum',
      palette: 'gold',
      burstScale: 1
    });
  }

  let selectedBurstType = 'chrysanthemum';
  let selectedPalette = 'gold';

  function explodeShell(shell) {
    const colors = PALETTES[shell.palette] || PALETTES.gold;
    const primaryHex = colors[Math.floor(Math.random() * colors.length)];
    const x = shell.x;
    const y = shell.y;
    const z = shell.z;
    const bScale = (shell.burstScale || 1) * perfDegradeFactor;

    flashBurstLight(x, y, z, primaryHex);
    const pan = clamp((x - camera.position.x) / 36, -0.85, 0.85);
    audio.playBurst(shell.burstType, pan);
    notifyNpcsFireworkBurst();

    if (shell.burstType === 'ring') {
      const count = Math.round(92 * bScale);
      const tiltX = (Math.random() - 0.5) * 0.9;
      const tiltZ = (Math.random() - 0.5) * 0.9;
      const speed = (13.5 + Math.random() * 2.5) * Math.sqrt(Math.max(0.65, bScale));
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const rx = Math.cos(a) * speed;
        let ry = Math.sin(a) * speed;
        let rz = 0;
        const cy = ry * Math.cos(tiltX) - rz * Math.sin(tiltX);
        const cz = ry * Math.sin(tiltX) + rz * Math.cos(tiltX);
        ry = cy;
        rz = cz;
        const fx = rx * Math.cos(tiltZ) - ry * Math.sin(tiltZ);
        const fy = rx * Math.sin(tiltZ) + ry * Math.cos(tiltZ);
        const hex = colors[i % colors.length];
        allocSpark(x, y, z, fx, fy, rz, hex, 1.55 + Math.random() * 0.35, 0.96, 4.4, 1);
      }
      for (let i = 0; i < 20; i++) {
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        const s = 4 + Math.random() * 3.5;
        allocSpark(
          x, y, z,
          s * Math.sin(ph) * Math.cos(th),
          s * Math.cos(ph),
          s * Math.sin(ph) * Math.sin(th),
          0xffffff, 0.85, 0.93, 3.2, 0
        );
      }
      return;
    }

    if (shell.burstType === 'willow') {
      const count = Math.round(126 * bScale);
      for (let i = 0; i < count; i++) {
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        const s = (8.5 + Math.random() * 5.0) * Math.sqrt(Math.max(0.65, bScale));
        const hex = i % 3 === 0 ? 0xffdf7a : colors[i % colors.length];
        allocSpark(
          x, y, z,
          s * Math.sin(ph) * Math.cos(th),
          s * Math.cos(ph) + 1.8,
          s * Math.sin(ph) * Math.sin(th),
          hex, 2.35 + Math.random() * 0.6, 0.945, 5.4, 1
        );
      }
      return;
    }

    const count = Math.round(130 * bScale);
    for (let i = 0; i < count; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const s = (11.5 + Math.random() * 4.5) * Math.sqrt(Math.max(0.65, bScale));
      const hex = colors[i % colors.length];
      allocSpark(
        x, y, z,
        s * Math.sin(ph) * Math.cos(th),
        s * Math.cos(ph),
        s * Math.sin(ph) * Math.sin(th),
        hex, 1.65 + Math.random() * 0.45, 0.955, 4.1, 0
      );
    }
  }

  function spawnFireworkShell({ x, z, targetY, burstType, palette, burstScale = 1 }) {
    const slot = shellPool.find((s) => !s.active);
    if (!slot) return;

    const paletteColors = PALETTES[palette] || PALETTES.gold;
    const shellHex = paletteColors[0];
    slot.active = true;
    slot.x = x;
    slot.y = 0.6;
    slot.z = z;
    slot.targetY = targetY;
    const riseHeight = Math.max(12, targetY - slot.y);
    const flightTime = 0.85 + Math.random() * 0.25;
    slot.vx = (Math.random() - 0.5) * 1.4;
    slot.vy = riseHeight / flightTime + 2.2;
    slot.vz = (Math.random() - 0.5) * 1.2;
    slot.trailTimer = 0;
    slot.burstType = burstType || 'chrysanthemum';
    slot.palette = palette || 'gold';
    slot.burstScale = burstScale;
    slot.sprite.material.color.setHex(shellHex);
    slot.sprite.position.set(slot.x, slot.y, slot.z);
    slot.sprite.visible = true;

    const pan = clamp((x - camera.position.x) / 36, -0.85, 0.85);
    audio.playLaunch(pan);
    notifyNpcsFireworkLaunch();
  }

  // =================================================================
  // Local Self Avatar & Wish Lanterns (Single-Player)
  // =================================================================
  const wishLanterns = [];

  const selfMesh = createVisitorAvatar({
    coatColor: selfState.coatColor,
    lanternColor: selfState.lanternColor,
    isSelf: true
  }, glowTexture);

  selfMesh.position.set(selfState.x, startGroundY, selfState.z);
  selfMesh.rotation.y = selfState.yaw;
  scene.add(selfMesh);

  const selfLabelEl = createWorldLabelEl(selfState.name, 'is-self');

  const selfEntry = {
    name: selfState.name,
    mesh: selfMesh,
    labelEl: selfLabelEl,
    curX: selfState.x,
    curZ: selfState.z,
    curY: startGroundY,
    curYaw: selfState.yaw,
    moving: false,
    sitting: false,
    dancing: false,
    eating: false
  };

  function updateSelfStyle() {
    if (selfLabelEl) {
      selfLabelEl.textContent = selfState.name;
    }
    const ud = selfMesh.userData;
    if (ud.coatMat && selfState.coatColor) {
      ud.coatMat.color.set(selfState.coatColor);
    }
    if (ud.lanternGlowMat && selfState.lanternColor) {
      ud.lanternGlowMat.color.set(selfState.lanternColor);
      ud.lanternGlowMat.emissive.set(selfState.lanternColor);
    }
    if (ud.lanternHaloMat && selfState.lanternColor) {
      ud.lanternHaloMat.color.set(selfState.lanternColor);
    }
  }

  function destroyWishLantern(item) {
    if (!item) return;
    scene.remove(item.mesh);
    item.mesh.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
    if (item.labelEl && item.labelEl.parentNode) {
      item.labelEl.parentNode.removeChild(item.labelEl);
    }
  }

  function clearAllWishLanterns() {
    while (wishLanterns.length > 0) {
      destroyWishLantern(wishLanterns.pop());
    }
  }

  function spawnWishLantern(wish) {
    if (wishLanterns.length >= 5) {
      const oldest = wishLanterns.shift();
      destroyWishLantern(oldest);
    }

    const mesh = createWishLanternMesh(wish.color || '#ffd166', glowTexture);
    const startX = Number.isFinite(wish.x) ? wish.x : selfEntry.curX;
    const startZ = Number.isFinite(wish.z) ? wish.z : selfEntry.curZ - 0.6;
    const startY = groundHeightAt(startX, startZ) + 1.45;
    mesh.position.set(startX, startY, startZ);
    scene.add(mesh);

    const el = document.createElement('div');
    el.className = 'world-wish-label';
    const textSpan = document.createElement('span');
    textSpan.textContent = wish.text;
    const authorSpan = document.createElement('span');
    authorSpan.className = 'world-wish-author';
    authorSpan.textContent = `— ${wish.ownerName || selfState.name}`;
    el.appendChild(textSpan);
    el.appendChild(authorSpan);
    labelsLayer?.appendChild(el);

    wishLanterns.push({
      id: wish.id,
      mesh,
      labelEl: el,
      baseX: startX,
      baseZ: startZ,
      age: 0,
      maxAge: 36,
      swaySeed: Math.random() * Math.PI * 2,
      riseSpeed: 0.78 + Math.random() * 0.2
    });
    audio.playWishLantern();
  }

  // =================================================================
  // Mutually Exclusive Environment Mode: 풍등 (lantern) vs 설경 (snow)
  // =================================================================
  let envMode = 'lantern';

  function setEnvMode(nextMode) {
    const mode = nextMode === 'snow' ? 'snow' : 'lantern';
    if (mode === envMode) return;
    envMode = mode;

    document.querySelectorAll('.option-chip[data-envmode]').forEach((chip) => {
      const active = chip.getAttribute('data-envmode') === envMode;
      chip.classList.toggle('is-selected', active);
      chip.setAttribute('aria-pressed', String(active));
    });

    if (envMode === 'snow') {
      clearAllWishLanterns();
      lanternRack.visible = false;
      ambientSkyLanterns.group.visible = false;
      snowEnv.setSnowEnabled(true);
    } else {
      snowEnv.setSnowEnabled(false);
      lanternRack.visible = true;
      ambientSkyLanterns.group.visible = true;
    }
  }

  document.querySelectorAll('.option-chip[data-envmode]').forEach((chip) => {
    chip.addEventListener('click', () => {
      setEnvMode(chip.getAttribute('data-envmode'));
    });
  });

  // =================================================================
  // Bench Sitting & Standing Logic (No auto-bark on sitting)
  // =================================================================
  let seatedBench = null;
  let selfDancingUntilMs = 0;
  let puppyExcitedUntilMs = 0;

  function findNearestBench(x, z) {
    let best = benchSpecs[0];
    let bestDistSq = Infinity;
    for (let i = 0; i < benchSpecs.length; i++) {
      const b = benchSpecs[i];
      const dx = b.x - x;
      const dz = b.z - z;
      const d2 = dx * dx + dz * dz;
      if (d2 < bestDistSq) {
        bestDistSq = d2;
        best = b;
      }
    }
    return best;
  }

  function updateSitButtonUi() {
    if (!btnToggleSit || !sitBtnLabel) return;
    btnToggleSit.classList.toggle('is-active', selfState.sitting);
    btnToggleSit.setAttribute('aria-pressed', String(selfState.sitting));
    sitBtnLabel.textContent = selfState.sitting ? '일어서기' : '앉기';
  }

  function updateDanceButtonUi() {
    if (!btnToggleDance || !danceBtnLabel) return;
    btnToggleDance.classList.toggle('is-active', selfState.dancing);
    btnToggleDance.setAttribute('aria-pressed', String(selfState.dancing));
    danceBtnLabel.textContent = selfState.dancing ? '춤 멈춤' : '춤';
  }

  function stopDancing() {
    if (!selfState.dancing) return;
    selfDancingUntilMs = 0;
    selfState.dancing = false;
    selfEntry.dancing = false;
    updateDanceButtonUi();
  }

  function sitOnBench(bench) {
    if (!bench) return;
    stopDancing();
    seatedBench = bench;
    selfState.sitting = true;
    selfState.moving = false;

    // On cliff-center bench, sit on left half so 모모 remains on right half cleanly
    const seatOffsetX = bench.id === 'cliff-center' ? -0.52 : 0;
    selfState.x = bench.x + seatOffsetX;
    selfState.z = bench.z;
    selfState.yaw = bench.yaw + Math.PI;

    selfEntry.curX = selfState.x;
    selfEntry.curZ = selfState.z;
    selfEntry.curYaw = selfState.yaw;
    selfEntry.sitting = true;
    selfEntry.moving = false;

    updateSitButtonUi();
  }

  function standUpFromBench() {
    if (!selfState.sitting) return;
    if (seatedBench) {
      selfState.x = clamp(selfEntry.curX - Math.sin(seatedBench.yaw) * 0.78, HILL_BOUNDS.minX, HILL_BOUNDS.maxX);
      selfState.z = clamp(selfEntry.curZ - Math.cos(seatedBench.yaw) * 0.78, HILL_BOUNDS.minZ, HILL_BOUNDS.maxZ);
      selfEntry.curX = selfState.x;
      selfEntry.curZ = selfState.z;
    }
    seatedBench = null;
    selfState.sitting = false;
    selfEntry.sitting = false;
    updateSitButtonUi();
  }

  btnToggleSit?.addEventListener('click', () => {
    audio.ensureContext();
    if (selfState.sitting) {
      standUpFromBench();
    } else {
      const targetBench = findNearestBench(selfEntry.curX, selfEntry.curZ);
      sitOnBench(targetBench);
    }
  });

  btnToggleDance?.addEventListener('click', () => {
    audio.ensureContext();
    if (selfState.dancing) {
      stopDancing();
      return;
    }
    if (selfState.sitting) {
      standUpFromBench();
    }
    selfState.dancing = true;
    selfEntry.dancing = true;
    selfDancingUntilMs = performance.now() + 10000;
    updateDanceButtonUi();
  });

  // =================================================================
  // Popover Sheets (Wish / Bungeoppang Shop / Tabbed Settings / Guide)
  // =================================================================
  let openSheetName = null;

  function setSheetOpen(name, forceOpen = false) {
    openSheetName = !forceOpen && openSheetName === name ? null : name;
    const isWish = openSheetName === 'wish';
    const isBungeoppang = openSheetName === 'bungeoppang';
    const isSettings = openSheetName === 'settings';
    const isGuide = openSheetName === 'guide';

    wishSheet?.classList.toggle('is-open', isWish);
    bungeoppangSheet?.classList.toggle('is-open', isBungeoppang);
    settingsSheet?.classList.toggle('is-open', isSettings);
    guideSheet?.classList.toggle('is-open', isGuide);

    btnToggleWish?.classList.toggle('is-active', isWish);
    btnToggleWish?.setAttribute('aria-expanded', String(isWish));
    btnToggleSettings?.classList.toggle('is-active', isSettings);
    btnToggleSettings?.setAttribute('aria-expanded', String(isSettings));
    btnToggleGuide?.classList.toggle('is-active', isGuide);
    btnToggleGuide?.setAttribute('aria-expanded', String(isGuide));

    mobileMovePad?.classList.toggle('is-obscured', isWish || isBungeoppang || isSettings || isGuide);

    if (isWish) {
      window.setTimeout(() => inputWish?.focus(), 60);
    }
  }

  btnToggleWish?.addEventListener('click', () => setSheetOpen('wish'));
  btnCloseWish?.addEventListener('click', () => setSheetOpen(null));
  btnCloseBungeoppang?.addEventListener('click', () => setSheetOpen(null));
  btnToggleSettings?.addEventListener('click', () => setSheetOpen('settings'));
  btnCloseSettings?.addEventListener('click', () => setSheetOpen(null));
  btnToggleGuide?.addEventListener('click', () => setSheetOpen('guide'));
  btnCloseGuide?.addEventListener('click', () => setSheetOpen(null));

  btnCloseTicketModal?.addEventListener('click', () => {
    ticketModalOpen = false;
    ticketModal?.classList.remove('is-open');
    audio.ensureContext();
    audio.playWishLantern();
    goldenSparkPool.trigger();
  });

  // Bungeoppang Purchase & Eat Sequence (lighter warm red-bean color 0xcf823a)
  let selfEatingUntilMs = 0;
  let eatBubbleUntilMs = 0;

  document.querySelectorAll('.bungeoppang-choice-btn[data-flavor]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const flavor = btn.getAttribute('data-flavor') || 'redbean';
      audio.ensureContext();
      audio.playBungeoppangEat();

      const now = performance.now();
      selfState.eating = true;
      selfEntry.eating = true;
      selfEatingUntilMs = now + 30000;
      eatBubbleUntilMs = now + 6500;

      if (selfEntry.mesh?.userData?.fishPastryMat) {
        selfEntry.mesh.userData.fishPastryMat.color.setHex(
          flavor === 'custard' ? 0xf3c363 : 0xcf823a
        );
      }

      if (eatBubbleEl) {
        eatBubbleEl.textContent = flavor === 'custard'
          ? '달콤한 슈크림 가득! 🍮'
          : '바삭하고 따뜻해! 🫘';
      }

      setSheetOpen(null);
    });
  });

  // =================================================================
  // 3-Mode Time-of-Day System (자동 / 낮 / 노을 / 밤)
  // =================================================================
  let selectedTimePreference = 'auto';
  let activeTimeKey = resolveAutoTimeMode(new Date());

  function syncTimeModeUi() {
    document.querySelectorAll('.option-chip[data-time]').forEach((chip) => {
      chip.classList.toggle('is-selected', chip.getAttribute('data-time') === selectedTimePreference);
    });
    if (timeModeStatusEl) {
      const activeLabel = TIME_PRESETS[activeTimeKey]?.label || '밤';
      timeModeStatusEl.textContent = selectedTimePreference === 'auto'
        ? `실시간 자동 · ${activeLabel}`
        : activeLabel;
    }
  }

  let midnightFlash = 0;

  function applyTimeAtmosphere(dt, immediate = false) {
    const preset = TIME_PRESETS[activeTimeKey] || TIME_PRESETS.night;
    const alpha = immediate ? 1 : 1 - Math.exp(-2.8 * dt);

    _tmpSkyBg.setHex(preset.bg);
    _tmpFogCol.setHex(preset.fog);
    _tmpHemiSky.setHex(preset.hemiSky);
    _tmpHemiGround.setHex(preset.hemiGround);
    _tmpKeyCol.setHex(preset.keyColor);
    _tmpWaterDeep.setHex(preset.waterDeep);
    _tmpWaterMid.setHex(preset.waterMid);
    _tmpSunCol.setHex(preset.sunColor);

    scene.background.lerp(_tmpSkyBg, alpha);
    scene.fog.color.lerp(_tmpFogCol, alpha);
    scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, preset.fogDensity, alpha);

    hemiLight.color.lerp(_tmpHemiSky, alpha);
    hemiLight.groundColor.lerp(_tmpHemiGround, alpha);
    hemiLight.intensity = THREE.MathUtils.lerp(hemiLight.intensity, preset.hemiInt + midnightFlash * 0.48, alpha);

    moonKeyLight.color.lerp(_tmpKeyCol, alpha);
    moonKeyLight.intensity = THREE.MathUtils.lerp(moonKeyLight.intensity, preset.keyInt + midnightFlash * 0.42, alpha);
    _vKeyPosGoal.set(preset.keyPos[0], preset.keyPos[1], preset.keyPos[2]);
    moonKeyLight.position.lerp(_vKeyPosGoal, alpha);

    renderer.toneMappingExposure = THREE.MathUtils.lerp(renderer.toneMappingExposure, preset.exposure + midnightFlash * 0.14, alpha);
    scene.environmentIntensity = THREE.MathUtils.lerp(
      scene.environmentIntensity,
      isMobile ? preset.envIntensity * 0.85 : preset.envIntensity,
      alpha
    );

    if (waterUniforms) {
      waterUniforms.uWaterDeep.value.lerp(_tmpWaterDeep, alpha);
      waterUniforms.uWaterMid.value.lerp(_tmpWaterMid, alpha);
      waterUniforms.uSunColor.value.lerp(_tmpSunCol, alpha);
      waterUniforms.uSunStrength.value = THREE.MathUtils.lerp(waterUniforms.uSunStrength.value, preset.sunStrength, alpha);
      waterUniforms.uNightLights.value = THREE.MathUtils.lerp(waterUniforms.uNightLights.value, preset.nightLights, alpha);
    }

    if (atmosphereRefs) {
      if (atmosphereRefs.starMat) {
        atmosphereRefs.starMat.opacity = THREE.MathUtils.lerp(atmosphereRefs.starMat.opacity, preset.starOpacity, alpha);
      }
      if (atmosphereRefs.moonMat) {
        atmosphereRefs.moonMat.opacity = THREE.MathUtils.lerp(atmosphereRefs.moonMat.opacity, preset.moonOpacity, alpha);
      }
      if (atmosphereRefs.moonHaloMat) {
        atmosphereRefs.moonHaloMat.opacity = THREE.MathUtils.lerp(atmosphereRefs.moonHaloMat.opacity, preset.moonHaloOpacity, alpha);
      }
      if (atmosphereRefs.bldgMat) {
        atmosphereRefs.bldgMat.emissiveIntensity = THREE.MathUtils.lerp(
          atmosphereRefs.bldgMat.emissiveIntensity,
          preset.bldgEmissive,
          alpha
        );
      }
      for (let i = 0; i < atmosphereRefs.nightWindowMats.length; i++) {
        const w = atmosphereRefs.nightWindowMats[i];
        const baseEm = w.baseEmissive ?? w.maxEmissive ?? 1.4;
        const minEm = w.minEmissive ?? 0.1;
        w.mat.emissiveIntensity = THREE.MathUtils.lerp(
          w.mat.emissiveIntensity,
          Math.max(minEm, baseEm * preset.windowScale),
          alpha
        );
      }
      for (let i = 0; i < atmosphereRefs.nightHaloSprites.length; i++) {
        const h = atmosphereRefs.nightHaloSprites[i];
        const baseOp = h.baseOpacity ?? h.maxOpacity ?? 0.4;
        h.mat.opacity = THREE.MathUtils.lerp(h.mat.opacity, baseOp * preset.lampScale, alpha);
      }
    }

    for (let i = 0; i < hillLampLights.length; i++) {
      const l = hillLampLights[i];
      l.light.intensity = THREE.MathUtils.lerp(l.light.intensity, l.baseIntensity * preset.lampScale, alpha);
    }
    if (bungeoppangStall.userData.haloMat) {
      const stallHaloTarget = 0.12 + 0.55 * preset.lampScale;
      bungeoppangStall.userData.haloMat.opacity = THREE.MathUtils.lerp(
        bungeoppangStall.userData.haloMat.opacity,
        stallHaloTarget,
        alpha
      );
    }
  }

  document.querySelectorAll('.option-chip[data-time]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const chosen = btn.getAttribute('data-time') || 'auto';
      selectedTimePreference = chosen;
      activeTimeKey = chosen === 'auto' ? resolveAutoTimeMode(new Date()) : chosen;
      syncTimeModeUi();
    });
  });

  syncTimeModeUi();
  applyTimeAtmosphere(1, true);

  // Settings Tab Switching (불꽃 | 아바타 | 분위기)
  document.querySelectorAll('.settings-tab-btn[data-tab]').forEach((tabBtn) => {
    tabBtn.addEventListener('click', () => {
      const targetTab = tabBtn.getAttribute('data-tab');
      document.querySelectorAll('.settings-tab-btn[data-tab]').forEach((b) => {
        const active = b === tabBtn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });
      document.querySelectorAll('.settings-tab-panel').forEach((panel) => {
        panel.classList.toggle('is-active', panel.id === `tab-panel-${targetTab}`);
      });
    });
  });

  // Dock Hide / Show (Zen Cinema Mode)
  btnHideDock?.addEventListener('click', () => {
    setSheetOpen(null);
    actionDock?.classList.add('is-hidden');
    btnShowDock?.classList.add('is-visible');
    mobileMovePad?.classList.add('is-obscured');
  });

  btnShowDock?.addEventListener('click', () => {
    actionDock?.classList.remove('is-hidden');
    btnShowDock?.classList.remove('is-visible');
    mobileMovePad?.classList.remove('is-obscured');
  });

  // =================================================================
  // Seamless Namsan Zoom / Glide Inspection & Return to Hill
  // =================================================================
  let cameraGlideActive = false;

  controls.addEventListener('start', () => {
    cameraGlideActive = false;
  });

  function focusOnBlueHouse() {
    if (!blueHouseInfo) return;
    const p = blueHouseInfo.porchWorldPos;
    _vCamTargetGoal.set(p.x - 0.25, p.y + 0.15, p.z);
    _vCamPosGoal.set(p.x + 0.8, p.y + 1.35, p.z + 6.4);
    cameraGlideActive = true;
  }

  function returnToHillView() {
    const gy = selfEntry.curY || groundHeightAt(selfEntry.curX, selfEntry.curZ);
    _vCamTargetGoal.set(selfEntry.curX, gy + 2.0, selfEntry.curZ - 6.5);
    _vCamPosGoal.set(selfEntry.curX, gy + 3.8, selfEntry.curZ + 9.6);
    cameraGlideActive = true;
  }

  btnBackToHill?.addEventListener('click', () => {
    audio.ensureContext();
    returnToHillView();
  });

  canvas.addEventListener('wheel', (e) => {
    cameraGlideActive = false;
    const dist = camera.position.distanceTo(controls.target);
    camera.getWorldDirection(_vFwd);

    if (e.deltaY < 0 && dist <= 7.0 && _vFwd.z < -0.18 && controls.target.z > -76) {
      const step = Math.min(4.8, Math.max(1.2, Math.abs(e.deltaY) * 0.04));
      controls.target.addScaledVector(_vFwd, step);
      camera.position.addScaledVector(_vFwd, step);
    } else if (e.deltaY > 0 && controls.target.z < -16) {
      const step = Math.min(4.8, Math.max(1.2, Math.abs(e.deltaY) * 0.04));
      controls.target.addScaledVector(_vFwd, -step);
      camera.position.addScaledVector(_vFwd, -step);
    }
  }, { passive: true });

  // =================================================================
  // Sound, BGM, SFX & Spatial Ambient Controls
  // =================================================================
  soundToggleBtn?.addEventListener('click', () => {
    isMuted = !isMuted;
    audio.setMuted(isMuted);
    if (!isMuted) audio.ensureContext();
    if (soundIcon) soundIcon.textContent = isMuted ? '🔇' : '🔊';
    soundToggleBtn.setAttribute('aria-pressed', String(isMuted));
  });

  btnBgmToggle?.addEventListener('click', () => {
    const next = !audio.bgmEnabled;
    audio.setBgmEnabled(next);
    btnBgmToggle.classList.toggle('is-selected', next);
    btnBgmToggle.setAttribute('aria-pressed', String(next));
    btnBgmToggle.textContent = next ? 'BGM 켜짐' : 'BGM 꺼짐';
  });

  rangeBgmVolume?.addEventListener('input', () => {
    const v = Number(rangeBgmVolume.value) / 100;
    audio.ensureContext();
    audio.setBgmVolume(v);
  });

  btnSfxToggle?.addEventListener('click', () => {
    const next = !audio.sfxEnabled;
    audio.setSfxEnabled(next);
    btnSfxToggle.classList.toggle('is-selected', next);
    btnSfxToggle.setAttribute('aria-pressed', String(next));
    btnSfxToggle.textContent = next ? '불꽃 소리 켜짐' : '불꽃 소리 꺼짐';
  });

  btnAmbientToggle?.addEventListener('click', () => {
    const next = !audio.ambientEnabled;
    audio.ensureContext();
    audio.setAmbientEnabled(next);
    btnAmbientToggle.classList.toggle('is-selected', next);
    btnAmbientToggle.setAttribute('aria-pressed', String(next));
    btnAmbientToggle.textContent = next ? '환경음 켜짐' : '환경음 꺼짐';
  });

  // =================================================================
  // Daily 23:59:50 3D Sky Countdown & Dec 31–Jan 1 Special New Year Event
  // =================================================================
  const DAILY_SKY_MESSAGES = [
    '새로운 하루가 시작됐어.',
    '오늘은 어떤 하루가 될까?'
  ];
  const NEW_YEAR_SKY_MESSAGE =
    'HAPPY NEW YEAR\n새해가 밝았어!\n지난 한 해도 수고 많았어.\n새로운 한 해에는 더 많은 행복과 반짝이는 순간이 함께하길.';

  let previewState = null; // { startEpoch, isNewYear }
  let liveEventState = null; // { dateKey, isNewYear, midnightEpoch, msgStartEpoch, msgEndEpoch, triggeredShow, announcedSec }
  let lastCountdownSecond = -1;
  const countdownTimers = [];

  function clearCountdownTimers() {
    while (countdownTimers.length > 0) {
      clearTimeout(countdownTimers.pop());
    }
  }

  function launchFinaleSequence() {
    const burstTypes = ['chrysanthemum', 'willow', 'ring'];
    const paletteKeys = ['gold', 'aurora', 'rose'];
    for (let i = 0; i < 6; i++) {
      window.setTimeout(() => {
        spawnFireworkShell({
          x: -22 + i * 8.8 + (Math.random() - 0.5) * 4,
          z: -36 - Math.random() * 16,
          targetY: 21 + Math.random() * 10,
          burstType: burstTypes[i % burstTypes.length],
          palette: paletteKeys[i % paletteKeys.length],
          burstScale: 1.05
        });
      }, i * 320);
    }
  }

  function spawnCountdownPrecursorBurst(secsLeft, isNewYear) {
    const crownRadius = isNewYear ? 1.85 : 1.5;
    const sparkCount = secsLeft <= 3 ? 22 : 12;
    for (let k = 0; k < sparkCount; k++) {
      const a = (k / sparkCount) * Math.PI * 2;
      allocSpark(
        Math.cos(a) * crownRadius,
        26.5 + Math.sin(a) * crownRadius,
        -54,
        Math.cos(a) * (5.2 + Math.random() * 3.4),
        Math.sin(a) * (5.2 + Math.random() * 3.4),
        (Math.random() - 0.5) * 2.2,
        k % 2 === 0 ? 0xffdf7a : 0xfff4cf,
        0.82,
        0.935,
        1.5,
        1
      );
    }
    if (secsLeft <= 3) {
      const flankX = secsLeft === 3 ? -20 : (secsLeft === 2 ? 20 : 0);
      spawnFireworkShell({
        x: flankX,
        z: -48,
        targetY: 22 + (3 - secsLeft) * 2.5,
        burstType: secsLeft === 1 ? 'willow' : 'ring',
        palette: isNewYear ? 'newyear' : 'gold',
        burstScale: 1.08
      });
    }
  }

  function launchDailyMidnightShow() {
    clearCountdownTimers();
    midnightFlash = 1.0;
    const burstTypes = ['chrysanthemum', 'ring', 'willow'];
    const paletteKeys = ['gold', 'aurora', 'rose'];

    // Wave 1 (0ms): Synchronized twin framing bursts around N Seoul Tower + Bosingak Bell toll
    [-16, 16].forEach((fx) => {
      spawnFireworkShell({
        x: fx,
        z: -46,
        targetY: 27,
        burstType: 'chrysanthemum',
        palette: 'gold',
        burstScale: 1.24
      });
    });
    countdownTimers.push(window.setTimeout(() => {
      triggerBosingakBell();
    }, 280));

    // Wave 2 (850ms): 6-shell sweeping panoramic arc
    for (let i = 0; i < 6; i++) {
      countdownTimers.push(window.setTimeout(() => {
        spawnFireworkShell({
          x: -26 + i * 10.4 + (Math.random() - 0.5) * 2.0,
          z: -40 - (i % 2) * 8,
          targetY: 23 + (i % 3) * 3.2,
          burstType: burstTypes[i % 3],
          palette: paletteKeys[i % 3],
          burstScale: 1.18
        });
      }, 850 + i * 180));
    }

    // Wave 3 (2150ms): Golden Crown Finale directly over N Seoul Tower
    [-11, 11, 0].forEach((fx, idx) => {
      countdownTimers.push(window.setTimeout(() => {
        spawnFireworkShell({
          x: fx,
          z: -50 - (idx === 2 ? 4 : 0),
          targetY: idx === 2 ? 31.5 : 27.5,
          burstType: idx === 2 ? 'willow' : 'chrysanthemum',
          palette: 'gold',
          burstScale: idx === 2 ? 1.32 : 1.2
        });
      }, 2150 + idx * 140));
    });
  }

  function launchNewYearSpecialShow() {
    clearCountdownTimers();
    midnightFlash = 1.25;
    const burstTypes = ['chrysanthemum', 'willow', 'ring'];
    const paletteKeys = ['newyear', 'gold', 'rose', 'aurora'];

    // Wave 1 (0ms): Panoramic golden/red/silver horizon fan
    for (let i = 0; i < 7; i++) {
      countdownTimers.push(window.setTimeout(() => {
        spawnFireworkShell({
          x: -34 + i * 11.3,
          z: -42 - (i % 2) * 8,
          targetY: 22 + (i % 3) * 3.5,
          burstType: burstTypes[i % 3],
          palette: paletteKeys[i % paletteKeys.length],
          burstScale: 1.18
        });
      }, i * 110));
    }

    // Wave 2 (1200ms): Twin crown framing N Seoul Tower
    for (let i = 0; i < 6; i++) {
      countdownTimers.push(window.setTimeout(() => {
        const side = i % 2 === 0 ? -1 : 1;
        spawnFireworkShell({
          x: side * (12 + Math.floor(i / 2) * 11),
          z: -46 - Math.random() * 10,
          targetY: 26 + Math.random() * 5,
          burstType: i % 2 === 0 ? 'willow' : 'ring',
          palette: i % 2 === 0 ? 'newyear' : 'gold',
          burstScale: 1.26
        });
      }, 1200 + i * 150));
    }

    // Wave 3 (2600ms): Cascading multi-height finale + Bosingak Bell toll
    countdownTimers.push(window.setTimeout(() => {
      triggerBosingakBell();
    }, 450));

    const climaxOffsets = [-18, 18, -8, 8, 0];
    climaxOffsets.forEach((cx, idx) => {
      countdownTimers.push(window.setTimeout(() => {
        spawnFireworkShell({
          x: cx,
          z: -50 - (idx === 4 ? 6 : 0),
          targetY: idx === 4 ? 33 : 28 + Math.random() * 3,
          burstType: idx === 4 ? 'chrysanthemum' : burstTypes[idx % 3],
          palette: idx === 4 ? 'newyear' : paletteKeys[idx % paletteKeys.length],
          burstScale: 1.4
        });
      }, 2600 + idx * 170));
    });
  }

  btnPreviewCountdown?.addEventListener('click', () => {
    audio.ensureContext();
    clearCountdownTimers();
    const nowEpoch = Date.now();
    const nowDate = new Date(nowEpoch);
    const isDec31 = nowDate.getMonth() === 11 && nowDate.getDate() === 31;
    previewState = {
      startEpoch: nowEpoch,
      midnightEpoch: nowEpoch + 10000,
      isNewYear: isDec31,
      triggeredShow: false,
      lastSec: -1,
      dailyMsg: DAILY_SKY_MESSAGES[Math.floor(Math.random() * DAILY_SKY_MESSAGES.length)],
      msgStartEpoch: nowEpoch + (isDec31 ? 14200 : 12400),
      msgEndEpoch: nowEpoch + (isDec31 ? 24800 : 18400)
    };
    setSheetOpen(null);
  });

  function updateSkyMidnightEvent(epochNow, renderNowMs) {
    const nowDate = new Date(epochNow);

    // Passive clock inside Settings tab
    if (nextMidnightTimerEl && openSheetName === 'settings') {
      const nextMid = new Date(nowDate);
      nextMid.setHours(24, 0, 0, 0);
      const diffSec = Math.max(0, Math.floor((nextMid.getTime() - nowDate.getTime()) / 1000));
      const hh = String(Math.floor(diffSec / 3600)).padStart(2, '0');
      const mm = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
      const ss = String(diffSec % 60).padStart(2, '0');
      nextMidnightTimerEl.textContent = `자정까지 ${hh}:${mm}:${ss} (매일 23:59:50 시작)`;
    }

    // 1. Preview Mode (highest temporary visual priority when triggered from settings)
    if (previewState) {
      const remMs = previewState.midnightEpoch - epochNow;
      if (remMs > 0) {
        const secsLeft = Math.min(10, Math.ceil(remMs / 1000));
        const secFrac = (remMs % 1000) / 1000;
        if (secsLeft !== previewState.lastSec) {
          previewState.lastSec = secsLeft;
          audio.playCountdownTick(secsLeft);
          if (countdownLiveEl) countdownLiveEl.textContent = String(secsLeft);
          spawnCountdownPrecursorBurst(secsLeft, previewState.isNewYear);
        }
        const styleMode = previewState.isNewYear ? 'newyear' : (secsLeft <= 3 ? 'final3' : 'normal');
        const sub = previewState.isNewYear ? 'NEW YEAR COUNTDOWN' : '';
        skyCountdown.setContent(String(secsLeft), sub, styleMode);
        skyCountdown.sprite.visible = true;
        const pulseScale = 1 + Math.sin((1 - secFrac) * Math.PI) * (secsLeft <= 3 ? 0.16 : 0.09);
        const baseW = previewState.isNewYear ? 48 : (secsLeft <= 3 ? 46 : 42);
        skyCountdown.sprite.scale.set(baseW * pulseScale, baseW * 0.5 * pulseScale, 1);
        skyCountdown.mat.opacity = 0.98;
        return;
      }

      if (!previewState.triggeredShow) {
        previewState.triggeredShow = true;
        audio.playMidnightChime();
        if (previewState.isNewYear) {
          launchNewYearSpecialShow();
        } else {
          launchDailyMidnightShow();
        }
      }

      if (epochNow >= previewState.msgStartEpoch && epochNow < previewState.msgEndEpoch) {
        const elap = epochNow - previewState.msgStartEpoch;
        const fadeIn = Math.min(1, elap / 900);
        const fadeOut = Math.min(1, (previewState.msgEndEpoch - epochNow) / 1100);
        skyCountdown.setContent(
          previewState.isNewYear ? NEW_YEAR_SKY_MESSAGE : previewState.dailyMsg,
          '',
          previewState.isNewYear ? 'newyear_message' : 'message'
        );
        skyCountdown.sprite.visible = true;
        skyCountdown.sprite.scale.set(previewState.isNewYear ? 50 : 44, previewState.isNewYear ? 25 : 22, 1);
        skyCountdown.mat.opacity = Math.min(fadeIn, fadeOut) * 0.98;
        return;
      }

      if (epochNow >= previewState.msgEndEpoch) {
        previewState = null;
        skyCountdown.sprite.visible = false;
        skyCountdown.mat.opacity = 0;
        return;
      }

      // Between 00:00 and message fade-in: keep sky clear for initial bursts
      skyCountdown.sprite.visible = false;
      skyCountdown.mat.opacity = 0;
      return;
    }

    // 2. Real System-Clock Daily 23:59:50 ~ 00:00:00+ Event (Wall-Clock Resilient + Per-Date Dedup)
    const h = nowDate.getHours();
    const m = nowDate.getMinutes();
    const s = nowDate.getSeconds();

    // Detect active window: 23:59:50..23:59:59 OR ongoing live celebration
    if (h === 23 && m === 59 && s >= 50) {
      const targetMidnight = new Date(nowDate);
      targetMidnight.setHours(24, 0, 0, 0);
      const targetDateKey = formatDateKey(targetMidnight); // e.g. '2027-01-01' for Dec 31 23:59:50
      const isDec31 = nowDate.getMonth() === 11 && nowDate.getDate() === 31;

      if (!liveEventState || liveEventState.dateKey !== targetDateKey) {
        if (hasMidnightPlayedForKey(targetDateKey)) {
          return;
        }
        const midMs = targetMidnight.getTime();
        liveEventState = {
          dateKey: targetDateKey,
          isNewYear: isDec31,
          midnightEpoch: midMs,
          triggeredShow: false,
          msgStartEpoch: midMs + (isDec31 ? 4200 : 2400),
          msgEndEpoch: midMs + (isDec31 ? 14800 : 8400),
          dailyMsg: DAILY_SKY_MESSAGES[targetDateKey.charCodeAt(targetDateKey.length - 1) % DAILY_SKY_MESSAGES.length]
        };
      }
    }

    if (!liveEventState) {
      skyCountdown.sprite.visible = false;
      skyCountdown.mat.opacity = 0;
      return;
    }

    const remMs = liveEventState.midnightEpoch - epochNow;
    if (remMs > 0 && remMs <= 10200) {
      const secsLeft = Math.min(10, Math.ceil(remMs / 1000));
      const secFrac = (remMs % 1000) / 1000;
      if (secsLeft !== lastCountdownSecond) {
        lastCountdownSecond = secsLeft;
        audio.playCountdownTick(secsLeft);
        if (countdownLiveEl) countdownLiveEl.textContent = String(secsLeft);
        spawnCountdownPrecursorBurst(secsLeft, liveEventState.isNewYear);
      }
      const styleMode = liveEventState.isNewYear ? 'newyear' : (secsLeft <= 3 ? 'final3' : 'normal');
      const sub = liveEventState.isNewYear ? 'NEW YEAR COUNTDOWN' : '';
      skyCountdown.setContent(String(secsLeft), sub, styleMode);
      skyCountdown.sprite.visible = true;
      const pulseScale = 1 + Math.sin((1 - secFrac) * Math.PI) * (secsLeft <= 3 ? 0.16 : 0.09);
      const baseW = liveEventState.isNewYear ? 48 : (secsLeft <= 3 ? 46 : 42);
      skyCountdown.sprite.scale.set(baseW * pulseScale, baseW * 0.5 * pulseScale, 1);
      skyCountdown.mat.opacity = 0.98;
      return;
    }

    // Past midnight moment
    if (!liveEventState.triggeredShow) {
      liveEventState.triggeredShow = true;
      markMidnightPlayedForKey(liveEventState.dateKey);
      lastCountdownSecond = 0;
      // Only fire bursts if user arrived right around midnight (< 6s past), never replay missed show late
      if (epochNow - liveEventState.midnightEpoch < 6000) {
        audio.playMidnightChime();
        if (liveEventState.isNewYear) {
          launchNewYearSpecialShow();
        } else {
          launchDailyMidnightShow();
        }
      }
    }

    if (epochNow >= liveEventState.msgStartEpoch && epochNow < liveEventState.msgEndEpoch) {
      const fadeIn = Math.min(1, (epochNow - liveEventState.msgStartEpoch) / 900);
      const fadeOut = Math.min(1, (liveEventState.msgEndEpoch - epochNow) / 1100);
      skyCountdown.setContent(
        liveEventState.isNewYear ? NEW_YEAR_SKY_MESSAGE : liveEventState.dailyMsg,
        '',
        liveEventState.isNewYear ? 'newyear_message' : 'message'
      );
      skyCountdown.sprite.visible = true;
      skyCountdown.sprite.scale.set(liveEventState.isNewYear ? 50 : 44, liveEventState.isNewYear ? 25 : 22, 1);
      skyCountdown.mat.opacity = Math.min(fadeIn, fadeOut) * 0.98;
      return;
    }

    if (epochNow >= liveEventState.msgEndEpoch) {
      liveEventState = null;
      lastCountdownSecond = -1;
      skyCountdown.sprite.visible = false;
      skyCountdown.mat.opacity = 0;
      return;
    }

    skyCountdown.sprite.visible = false;
    skyCountdown.mat.opacity = 0;
  }

  // =================================================================
  // Input Controls, Customization, Firework & Wish Triggers
  // =================================================================
  const keys = { up: false, down: false, left: false, right: false };

  function isTypingFocused() {
    const tag = document.activeElement?.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA';
  }

  function onKeyDown(e) {
    if (isTypingFocused() || ticketModalOpen) return;
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'Space') {
      e.preventDefault();
      triggerFirework();
    }
  }

  function onKeyUp(e) {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  document.querySelectorAll('.dpad-btn[data-dir]').forEach((btn) => {
    const dir = btn.getAttribute('data-dir');
    const setDir = (pressed) => {
      if (dir in keys) keys[dir] = pressed;
      btn.classList.toggle('is-pressed', pressed);
    };
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      audio.ensureContext();
      setDir(true);
    });
    btn.addEventListener('pointerup', () => setDir(false));
    btn.addEventListener('pointercancel', () => setDir(false));
    btn.addEventListener('pointerleave', () => setDir(false));
  });

  // 3 Burst Types & 3 Visual Palette Swatches
  document.querySelectorAll('.option-chip[data-burst]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.option-chip[data-burst]').forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      selectedBurstType = btn.getAttribute('data-burst') || 'chrysanthemum';
    });
  });

  document.querySelectorAll('.color-swatch-btn[data-palette]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch-btn[data-palette]').forEach((b) => {
        b.classList.remove('is-selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-selected');
      btn.setAttribute('aria-pressed', 'true');
      selectedPalette = btn.getAttribute('data-palette') || 'gold';
    });
  });

  function syncProfileToWorld() {
    const cleanName = (inputNickname?.value || '').trim().slice(0, 14);
    if (cleanName) selfState.name = cleanName;
    saveProfileLocal({
      name: selfState.name,
      coatColor: selfState.coatColor,
      lanternColor: selfState.lanternColor
    });
    updateSelfStyle();
  }

  document.querySelectorAll('.color-swatch-btn[data-coat]').forEach((btn) => {
    if (btn.getAttribute('data-coat') === selfState.coatColor) {
      document.querySelectorAll('.color-swatch-btn[data-coat]').forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
    }
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch-btn[data-coat]').forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      selfState.coatColor = btn.getAttribute('data-coat') || selfState.coatColor;
      syncProfileToWorld();
    });
  });

  document.querySelectorAll('.color-swatch-btn[data-lantern]').forEach((btn) => {
    if (btn.getAttribute('data-lantern') === selfState.lanternColor) {
      document.querySelectorAll('.color-swatch-btn[data-lantern]').forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
    }
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch-btn[data-lantern]').forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      selfState.lanternColor = btn.getAttribute('data-lantern') || selfState.lanternColor;
      syncProfileToWorld();
    });
  });

  btnSaveProfile?.addEventListener('click', syncProfileToWorld);
  inputNickname?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      syncProfileToWorld();
    }
  });

  function triggerFirework(customX, customZ, customY, overrideBurst, overridePalette) {
    audio.ensureContext();
    spawnFireworkShell({
      x: Number.isFinite(customX) ? customX : (Math.random() - 0.5) * 42,
      z: Number.isFinite(customZ) ? customZ : -34 - Math.random() * 18,
      targetY: Number.isFinite(customY) ? customY : 20 + Math.random() * 11,
      burstType: overrideBurst || selectedBurstType,
      palette: overridePalette || selectedPalette,
      burstScale: 1
    });
  }

  btnLaunchFirework?.addEventListener('click', () => {
    triggerFirework();
  });

  let finaleActive = false;
  btnLaunchFinale?.addEventListener('click', () => {
    if (finaleActive) return;
    finaleActive = true;
    audio.ensureContext();
    launchFinaleSequence();
    window.setTimeout(() => {
      finaleActive = false;
    }, 2000);
  });

  // Canvas Click/Tap: Golden Ticket, NPCs, 몽이, Bungeoppang Stall (Manbok + Cart), Benches, Bosingak, Blue House, Sky
  let pointerDownInfo = null;
  canvas.addEventListener('pointerdown', (e) => {
    pointerDownInfo = { x: e.clientX, y: e.clientY, time: performance.now() };
  });

  canvas.addEventListener('pointerup', (e) => {
    if (!pointerDownInfo) return;
    const dx = e.clientX - pointerDownInfo.x;
    const dy = e.clientY - pointerDownInfo.y;
    const dtMs = performance.now() - pointerDownInfo.time;
    pointerDownInfo = null;

    if (Math.hypot(dx, dy) > 8 || dtMs > 360 || ticketModalOpen) return;

    const rect = canvas.getBoundingClientRect();
    _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    _raycaster.setFromCamera(_pointerNdc, camera);

    // 0. Check Hidden Golden Ticket Treasure
    if (!ticketFound && goldenTicket.visible) {
      const ticketHits = _raycaster.intersectObject(goldenTicket, true);
      if (ticketHits.length > 0) {
        const distToPlayer = Math.hypot(selfEntry.curX - ticketSpot.x, selfEntry.curZ - ticketSpot.z);
        if (distToPlayer <= 5.0) {
          ticketFound = true;
          goldenTicket.visible = false;
          ticketModalOpen = true;
          ticketModal?.classList.add('is-open');
          audio.ensureContext();
        } else if (npcBubbleEl) {
          npcBubbleSpeakerEl.style.display = 'none';
          npcBubbleTextEl.textContent = '반짝이는 무언가가 있어요. 더 가까이 다가가 볼까요? ✨';
          activeBubbleNpc = {
            getWorldPos: () => ({ x: ticketSpot.x, y: ticketY + 0.55, z: ticketSpot.z })
          };
          npcBubbleUntilMs = performance.now() + 2600;
        }
        return;
      }
    }

    // 1. Check Named NPCs (모모, 비트, 토리, 나루)
    const npcHits = _raycaster.intersectObjects(npcClickMeshes, true);
    if (npcHits.length > 0) {
      let node = npcHits[0].object;
      while (node && !node.userData?.npcId) {
        node = node.parent;
      }
      if (node?.userData?.npcId) {
        const clickedNpc = hillNpcs.find((n) => n.id === node.userData.npcId);
        if (clickedNpc) {
          audio.ensureContext();
          clickRipple.trigger(clickedNpc.basePos.x, clickedNpc.basePos.z, 0xffe08a);
          showNpcDialogue(clickedNpc.id, () => ({
            x: clickedNpc.basePos.x,
            y: clickedNpc.basePos.y + (clickedNpc.sitting ? 1.32 : 1.52),
            z: clickedNpc.basePos.z
          }));
          return;
        }
      }
    }

    // 2. Check Cliffside Dog (몽이) -> Puppy Bark + Excited Tail Wag + Bubble
    const dogHits = _raycaster.intersectObject(cliffDog, true);
    if (dogHits.length > 0) {
      audio.ensureContext();
      puppyExcitedUntilMs = performance.now() + 1800;
      audio.playPuppyBark();
      clickRipple.trigger(1.65, -9.15, 0xffd166);
      showNpcDialogue('mongi', () => ({
        x: 1.65,
        y: groundHeightAt(1.65, -9.15) + 0.78,
        z: -9.15
      }));
      return;
    }

    // 3. Check Bungeoppang Stall & Manbok (vendor clicked -> dialogue; cart clicked -> shop sheet)
    if (bungeoppangStall.userData.vendor) {
      const manbokHits = _raycaster.intersectObject(bungeoppangStall.userData.vendor, true);
      if (manbokHits.length > 0) {
        audio.ensureContext();
        const vp = bungeoppangStall.userData.vendorWorldPos;
        clickRipple.trigger(vp.x, vp.z, 0xffd166);
        showNpcDialogue('manbok', () => ({ x: vp.x, y: vp.y + 1.54, z: vp.z }));
        return;
      }
    }
    const stallHits = _raycaster.intersectObject(bungeoppangStall, true);
    if (stallHits.length > 0) {
      audio.ensureContext();
      clickRipple.trigger(stallX, stallZ, 0xffb85c);
      setSheetOpen('bungeoppang', true);
      return;
    }

    // 4. Check Cliffside Benches
    const benchHits = _raycaster.intersectObjects(interactiveBenchMeshes, true);
    if (benchHits.length > 0) {
      let node = benchHits[0].object;
      while (node && !node.userData?.benchId) {
        node = node.parent;
      }
      if (node?.userData?.benchId) {
        const clickedBench = benchSpecs.find((b) => b.id === node.userData.benchId);
        if (clickedBench) {
          clickRipple.trigger(clickedBench.x, clickedBench.z, 0xffe08a);
          if (selfState.sitting && seatedBench?.id === clickedBench.id) {
            standUpFromBench();
          } else {
            sitOnBench(clickedBench);
          }
          return;
        }
      }
    }

    // 5. Check Bosingak Bell Pavilion -> Strike the Bell!
    const bellHits = _raycaster.intersectObject(pavilionGroup, true);
    if (bellHits.length > 0) {
      clickRipple.trigger(pavilionX, pavilionZ, 0xffdf7a);
      triggerBosingakBell();
      return;
    }

    // 6. Check Blue-Roof House / Chichi on Namsan -> glide smoothly up close (or say hi if zoomed)
    if (blueHouseInfo?.houseGroup) {
      const houseHits = _raycaster.intersectObject(blueHouseInfo.houseGroup, true);
      if (houseHits.length > 0) {
        audio.ensureContext();
        if (camera.position.distanceTo(blueHouseInfo.porchWorldPos) < 20) {
          const p = blueHouseInfo.porchWorldPos;
          showNpcDialogue('chichi', () => ({ x: p.x, y: p.y + 0.35, z: p.z }));
        } else {
          focusOnBlueHouse();
        }
        return;
      }
    }

    // 7. Launch Firework in Sky
    if (_raycaster.ray.intersectPlane(_skyPlane, _skyHit)) {
      if (_skyHit.y >= 11 && _skyHit.y <= 44 && Math.abs(_skyHit.x) <= 48) {
        skyHintBanner?.classList.add('is-hidden');
        triggerFirework(
          clamp(_skyHit.x, -44, 44),
          -38 - Math.random() * 12,
          clamp(_skyHit.y, 17, 35)
        );
      }
    }
  });

  const hintHideTimer = window.setTimeout(() => {
    skyHintBanner?.classList.add('is-hidden');
  }, 6500);

  wishForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = (inputWish?.value || '').trim().slice(0, 36);
    if (!raw) return;
    audio.ensureContext();
    inputWish.value = '';
    if (document.activeElement === inputWish) {
      inputWish.blur();
    }
    setSheetOpen(null);

    if (envMode !== 'lantern') {
      setEnvMode('lantern');
    }

    spawnWishLantern({
      id: `local-${Date.now()}`,
      ownerName: selfState.name,
      text: raw,
      color: selfState.lanternColor,
      x: selfEntry.curX,
      z: selfEntry.curZ - 0.6
    });
  });

  // =================================================================
  // Resize, Tab Visibility Pause/Resume & WebGL Recovery
  // =================================================================
  function onResize() {
    viewportW = window.innerWidth;
    viewportH = window.innerHeight;
    camera.aspect = viewportW / viewportH;
    camera.updateProjectionMatrix();
    renderer.setSize(viewportW, viewportH, false);
    renderer.setPixelRatio(getTargetPixelRatio());
  }
  window.addEventListener('resize', onResize);

  function onContextLost(e) {
    e.preventDefault();
    cancelLoop();
  }
  function onContextRestored() {
    scheduleLoop();
  }
  function onVisibilityChange() {
    audio.suspendForHidden(document.hidden);
    if (document.hidden) {
      cancelLoop();
    } else {
      scheduleLoop();
    }
  }

  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);
  document.addEventListener('visibilitychange', onVisibilityChange);

  // =================================================================
  // Animation Loop (Zero GC, Throttled Checks, Adaptive Performance)
  // =================================================================
  let lastFrameTime = performance.now();
  let lastCountdownCheck = 0;
  let lastThrottledCheck = 0;
  let avgDt = 0.016;
  let frameCounter = 0;
  let frameId = 0;
  let stopped = false;

  function projectLabelToScreen(worldX, worldY, worldZ, el, halfW, halfH, yOffsetPx = -10) {
    if (!el) return;
    _vProj.set(worldX, worldY, worldZ).project(camera);
    if (_vProj.z > 1 || _vProj.z < -1) {
      el.style.opacity = '0';
      return;
    }
    const sx = (_vProj.x * 0.5 + 0.5) * (halfW * 2);
    const sy = (-_vProj.y * 0.5 + 0.5) * (halfH * 2) + yOffsetPx;
    if (sx < -120 || sx > halfW * 2 + 120 || sy < -60 || sy > halfH * 2 + 60) {
      el.style.opacity = '0';
      return;
    }
    el.style.opacity = '1';
    el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -100%)`;
  }

  function stepSimulation(dt, nowMs) {
    frameCounter += 1;
    avgDt = avgDt * 0.92 + dt * 0.08;
    // Adaptive performance scaling when heavy effects overlap
    perfDegradeFactor = avgDt > 0.044 ? 0.68 : (avgDt > 0.032 ? 0.84 : 1.0);

    // 1. Movement Controls
    const moveZ = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    const moveX = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    const isMoving = !ticketModalOpen && (moveX !== 0 || moveZ !== 0);

    if (isMoving && selfState.sitting) {
      standUpFromBench();
    }
    if (isMoving && selfState.dancing) {
      stopDancing();
    }

    if (isMoving) {
      cameraGlideActive = false;
      if (controls.target.z < -16) {
        const gy = selfEntry.curY || groundHeightAt(selfEntry.curX, selfEntry.curZ);
        controls.target.set(selfEntry.curX, gy + 2.0, selfEntry.curZ - 6.5);
        camera.position.set(selfEntry.curX, gy + 3.8, selfEntry.curZ + 9.6);
      }
    }

    if (isMoving && !selfState.sitting) {
      camera.getWorldDirection(_vFwd);
      _vFwd.y = 0;
      if (_vFwd.lengthSq() < 0.0001) _vFwd.set(0, 0, -1);
      _vFwd.normalize();
      _vRight.set(-_vFwd.z, 0, _vFwd.x);

      _vMove.set(0, 0, 0)
        .addScaledVector(_vFwd, -moveZ)
        .addScaledVector(_vRight, moveX);
      if (_vMove.lengthSq() > 0.0001) {
        _vMove.normalize();
        const walkSpeed = 4.6;
        const nextX = clamp(selfEntry.curX + _vMove.x * walkSpeed * dt, HILL_BOUNDS.minX, HILL_BOUNDS.maxX);
        const nextZ = clamp(selfEntry.curZ + _vMove.z * walkSpeed * dt, HILL_BOUNDS.minZ, HILL_BOUNDS.maxZ);
        const dx = nextX - selfEntry.curX;
        const dz = nextZ - selfEntry.curZ;

        selfEntry.curX = nextX;
        selfEntry.curZ = nextZ;
        selfState.x = nextX;
        selfState.z = nextZ;

        const targetYaw = Math.atan2(_vMove.x, _vMove.z);
        selfEntry.curYaw = lerpAngle(selfEntry.curYaw, targetYaw, 1 - Math.exp(-12 * dt));
        selfState.yaw = selfEntry.curYaw;

        camera.position.x += dx;
        camera.position.z += dz;
        controls.target.x += dx;
        controls.target.z += dz;
      }
    }
    selfEntry.moving = isMoving && !selfState.sitting;
    selfState.moving = selfEntry.moving;

    if (selfState.dancing && selfDancingUntilMs > 0 && nowMs >= selfDancingUntilMs) {
      stopDancing();
    }

    if (selfState.eating && nowMs >= selfEatingUntilMs) {
      selfState.eating = false;
      selfEntry.eating = false;
    }

    // 2. Camera Smooth Glide & Safe Bounds Clamp
    if (cameraGlideActive) {
      const k = 1 - Math.exp(-5.8 * dt);
      camera.position.lerp(_vCamPosGoal, k);
      controls.target.lerp(_vCamTargetGoal, k);
      if (
        camera.position.distanceToSquared(_vCamPosGoal) < 0.015 &&
        controls.target.distanceToSquared(_vCamTargetGoal) < 0.015
      ) {
        cameraGlideActive = false;
      }
    }
    controls.target.x = clamp(controls.target.x, -68, 68);
    controls.target.y = clamp(controls.target.y, 1.2, 34);
    controls.target.z = clamp(controls.target.z, -96, 16);
    camera.position.y = Math.max(1.8, camera.position.y);
    controls.update();

    if (btnBackToHill) {
      btnBackToHill.classList.toggle('is-hidden', controls.target.z >= -16);
    }

    // 3. Update Self Avatar
    const halfW = viewportW * 0.5;
    const halfH = viewportH * 0.5;
    const posLerp = 1 - Math.exp(-10 * dt);

    const insidePavilion =
      Math.abs(selfEntry.curX - pavilionX) < 2.25 &&
      Math.abs(selfEntry.curZ - pavilionZ) < 2.25;
    const gy = insidePavilion
      ? groundHeightAt(pavilionX, pavilionZ) + 0.28
      : groundHeightAt(selfEntry.curX, selfEntry.curZ);
    selfEntry.curY = gy;

    selfEntry.mesh.position.set(selfEntry.curX, gy, selfEntry.curZ);
    selfEntry.mesh.rotation.y = selfEntry.curYaw;

    const ud = selfEntry.mesh.userData;
    if (selfEntry.sitting) {
      ud.bodyGroup.position.y = THREE.MathUtils.lerp(ud.bodyGroup.position.y, -0.18, posLerp);
      ud.bodyGroup.rotation.z = THREE.MathUtils.lerp(ud.bodyGroup.rotation.z, 0, posLerp);
      ud.bodyGroup.rotation.y = THREE.MathUtils.lerp(ud.bodyGroup.rotation.y, 0, posLerp);
      ud.leftLegPivot.rotation.x = THREE.MathUtils.lerp(ud.leftLegPivot.rotation.x, -Math.PI * 0.44, posLerp);
      ud.rightLegPivot.rotation.x = THREE.MathUtils.lerp(ud.rightLegPivot.rotation.x, -Math.PI * 0.44, posLerp);
      ud.armGroup.rotation.x = Math.sin(nowMs * 0.0018 + ud.walkPhase) * 0.04;
      ud.armGroup.rotation.z = THREE.MathUtils.lerp(ud.armGroup.rotation.z, 0, posLerp);
    } else if (selfEntry.dancing && !selfEntry.moving) {
      ud.walkPhase += dt * 7.2;
      const beat = ud.walkPhase;
      ud.bodyGroup.position.y = Math.abs(Math.sin(beat)) * 0.1;
      ud.bodyGroup.rotation.z = Math.sin(beat * 0.5) * 0.14;
      ud.bodyGroup.rotation.y = Math.sin(beat * 0.5) * 0.24;
      ud.leftLegPivot.rotation.x = Math.sin(beat) * 0.28;
      ud.rightLegPivot.rotation.x = -Math.sin(beat) * 0.28;
      ud.armGroup.rotation.x = -0.85 + Math.sin(beat) * 0.48;
      ud.armGroup.rotation.z = 0.22 + Math.cos(beat * 0.5) * 0.28;
    } else {
      ud.bodyGroup.position.y = THREE.MathUtils.lerp(ud.bodyGroup.position.y, 0, posLerp);
      ud.bodyGroup.rotation.z = THREE.MathUtils.lerp(ud.bodyGroup.rotation.z, 0, posLerp);
      ud.bodyGroup.rotation.y = THREE.MathUtils.lerp(ud.bodyGroup.rotation.y, 0, posLerp);
      ud.armGroup.rotation.z = THREE.MathUtils.lerp(ud.armGroup.rotation.z, 0, posLerp);
      if (selfEntry.moving) {
        ud.walkPhase += dt * 11;
        const swing = Math.sin(ud.walkPhase) * 0.45;
        ud.leftLegPivot.rotation.x = swing;
        ud.rightLegPivot.rotation.x = -swing;
        ud.armGroup.rotation.x = -swing * 0.3;
      } else {
        ud.walkPhase += dt * 2.0;
        ud.leftLegPivot.rotation.x *= 0.85;
        ud.rightLegPivot.rotation.x *= 0.85;
        ud.armGroup.rotation.x = Math.sin(ud.walkPhase) * 0.05;
      }
    }

    if (ud.bungeoppangGroup && ud.leftArmPivot) {
      if (selfEntry.eating) {
        ud.bungeoppangGroup.visible = true;
        const nibble = Math.sin(nowMs * 0.0068 + ud.walkPhase) * 0.18;
        ud.leftArmPivot.rotation.x = THREE.MathUtils.lerp(ud.leftArmPivot.rotation.x, -1.18 + nibble, posLerp);
        ud.leftArmPivot.rotation.z = THREE.MathUtils.lerp(ud.leftArmPivot.rotation.z, -0.26, posLerp);
      } else {
        ud.bungeoppangGroup.visible = false;
        const idleSwing = selfEntry.moving ? Math.sin(ud.walkPhase) * 0.32 : Math.sin(ud.walkPhase * 0.7) * 0.04;
        ud.leftArmPivot.rotation.x = THREE.MathUtils.lerp(ud.leftArmPivot.rotation.x, idleSwing, posLerp);
        ud.leftArmPivot.rotation.z = THREE.MathUtils.lerp(ud.leftArmPivot.rotation.z, 0, posLerp);
      }
    }

    const labelY = gy + (selfEntry.sitting ? 1.54 : 1.72);
    projectLabelToScreen(selfEntry.curX, labelY, selfEntry.curZ, selfEntry.labelEl, halfW, halfH, -8);

    if (eatBubbleEl) {
      if (selfEntry.eating && nowMs < eatBubbleUntilMs) {
        projectLabelToScreen(selfEntry.curX, labelY, selfEntry.curZ, eatBubbleEl, halfW, halfH, -33);
      } else {
        eatBubbleEl.style.opacity = '0';
      }
    }

    // 3.5 Throttled NPC Proximity Check + Spatial Audio Update (~8x/sec instead of per frame)
    if (nowMs - lastThrottledCheck >= 120) {
      lastThrottledCheck = nowMs;

      for (let i = 0; i < hillNpcs.length; i++) {
        const npc = hillNpcs[i];
        const dx = selfEntry.curX - npc.basePos.x;
        const dz = selfEntry.curZ - npc.basePos.z;
        const dist = Math.hypot(dx, dz);
        const radius = npc.proximityState.near ? 4.4 : 3.8;
        if (dist <= radius) {
          npc.proximityState.near = true;
          const worldYaw = Math.atan2(dx, dz);
          let relYaw = worldYaw - npc.baseYaw;
          while (relYaw > Math.PI) relYaw -= Math.PI * 2;
          while (relYaw < -Math.PI) relYaw += Math.PI * 2;
          npc.proximityState.headYaw = clamp(relYaw, -0.82, 0.82);
          npc.proximityState.headPitch = 0.03;
        } else {
          npc.proximityState.near = false;
          npc.proximityState.headYaw = 0;
          npc.proximityState.headPitch = 0;
        }
      }

      // Spatial Bungeoppang griddle sizzle attenuation
      const stallDist = Math.hypot(selfEntry.curX - stallX, selfEntry.curZ - stallZ);
      _vFwd.set(stallX - camera.position.x, 0, stallZ - camera.position.z);
      camera.getWorldDirection(_vRight);
      _vRight.y = 0;
      const pan = clamp(
        (_vRight.z * _vFwd.x - _vRight.x * _vFwd.z) / Math.max(4, _vFwd.length()),
        -0.88,
        0.88
      );
      audio.updateSpatialAmbient(stallDist, pan);
    }

    // 3.6 Update Named NPC Animations (Base Loops + Firework Sky Reaction + Head-Only Proximity Gaze)
    const timeSec = nowMs * 0.001;
    const headLerp = 1 - Math.exp(-7.5 * dt);

    for (let i = 0; i < hillNpcs.length; i++) {
      const npc = hillNpcs[i];
      let baseHeadYaw = 0;
      let baseHeadPitch = 0;
      let baseJumpY = npc.sitting ? -0.02 : 0;

      if (npc.id === 'momo') {
        baseHeadYaw = Math.sin(timeSec * 0.7) * 0.09;
        baseHeadPitch = Math.sin(timeSec * 1.1) * 0.04;
      } else if (npc.id === 'bit') {
        // Multi-phase musical dance groove (bounce + upper groove + arm wave + subtle step)
        const beat = timeSec * 5.4;
        const barPhase = Math.sin(beat * 0.25);
        baseJumpY = Math.abs(Math.sin(beat)) * 0.09;
        npc.bodyGroup.rotation.z = Math.sin(beat * 0.5) * 0.13 + barPhase * 0.04;
        npc.bodyGroup.rotation.y = Math.sin(beat * 0.5) * 0.22;
        npc.leftLegPivot.rotation.x = Math.sin(beat) * 0.26;
        npc.rightLegPivot.rotation.x = -Math.sin(beat) * 0.26;
        npc.leftArmPivot.rotation.x = -0.65 + Math.cos(beat) * 0.46;
        npc.leftArmPivot.rotation.z = -0.22 - Math.sin(beat * 0.5) * 0.24;
        npc.rightArmPivot.rotation.x = -0.72 + Math.sin(beat + 0.5) * 0.52;
        npc.rightArmPivot.rotation.z = 0.22 + Math.cos(beat * 0.5) * 0.26;
        baseHeadYaw = Math.sin(beat * 0.5) * 0.14;
        baseHeadPitch = Math.sin(beat) * 0.06;
      } else if (npc.id === 'tori' || npc.id === 'naru') {
        // Conversational gestures & attentive listening with phase offset
        const isTori = npc.id === 'tori';
        const p = timeSec * 2.3 + (isTori ? 0 : 2.1);
        const turnSignal = Math.sin(timeSec * 0.85 + (isTori ? 0 : Math.PI));
        const talkWeight = THREE.MathUtils.clamp(turnSignal * 0.5 + 0.5, 0.15, 1);

        npc.bodyGroup.rotation.z = Math.sin(p * 0.5) * 0.035;
        npc.rightArmPivot.rotation.x = (-0.28 - Math.sin(p * 1.4) * 0.24) * talkWeight;
        npc.rightArmPivot.rotation.z = 0.14 * talkWeight;
        npc.leftArmPivot.rotation.x = -0.14 + Math.cos(p * 1.1) * 0.12 * talkWeight;
        baseHeadYaw = Math.sin(p * 0.65) * 0.12;
        baseHeadPitch = Math.sin(p * 1.3) * 0.08;
      }

      // Overlay Firework Reaction (Priority over proximity gaze; preserves underlying loop)
      const fw = npc.fireworkReact;
      let fwPitch = 0;
      let fwJump = 0;
      let fwWave = 0;
      if (fw.active) {
        if (fw.phase === 'pending') {
          fw.delay -= dt;
          if (fw.delay <= 0) {
            fw.phase = 'looking';
            fw.elapsed = 0;
          }
        } else {
          fw.elapsed += dt;
          const env = fw.elapsed < 0.35
            ? fw.elapsed / 0.35
            : Math.max(0, 1 - Math.max(0, fw.elapsed - (fw.duration - 0.6)) / 0.6);
          fw.lookStrength = env;
          fwPitch = -0.46 * env; // Look skyward toward Namsan sky!
          if (fw.wantBurstJump && !npc.sitting && fw.elapsed < 0.7) {
            fwJump = Math.sin((fw.elapsed / 0.7) * Math.PI) * 0.16;
          }
          if (fw.wantBurstWave) {
            fwWave = env;
          }
          if (fw.elapsed >= fw.duration) {
            fw.active = false;
            fw.phase = 'idle';
            fw.lookStrength = 0;
          }
        }
      }

      npc.bodyGroup.position.y = baseJumpY + fwJump;
      if (fwWave > 0.05) {
        const waveMotion = Math.sin(timeSec * 10.5) * 0.38;
        npc.rightArmPivot.rotation.x = THREE.MathUtils.lerp(npc.rightArmPivot.rotation.x, -1.85, fwWave * 0.7);
        npc.rightArmPivot.rotation.z = THREE.MathUtils.lerp(npc.rightArmPivot.rotation.z, 0.55 + waveMotion, fwWave * 0.7);
      }

      // Head orientation: Firework look wins if active; otherwise head-only proximity turn if near
      const useProx = (!fw.active || fw.lookStrength < 0.15) && npc.proximityState.near;
      const targetHeadYaw = fw.active && fw.lookStrength > 0.15
        ? baseHeadYaw * 0.4
        : (useProx ? npc.proximityState.headYaw : baseHeadYaw);
      const targetHeadPitch = (fw.active && fw.lookStrength > 0.15)
        ? fwPitch
        : (useProx ? npc.proximityState.headPitch : baseHeadPitch);

      npc.headPivot.rotation.y = THREE.MathUtils.lerp(npc.headPivot.rotation.y, targetHeadYaw, headLerp);
      npc.headPivot.rotation.x = THREE.MathUtils.lerp(npc.headPivot.rotation.x, targetHeadPitch, headLerp);
    }

    // Active NPC click dialogue bubble (raised cleanly above head; no overhead NPC nameplates)
    if (npcBubbleEl) {
      if (activeBubbleNpc && nowMs < npcBubbleUntilMs) {
        const bp = activeBubbleNpc.getWorldPos();
        projectLabelToScreen(bp.x, bp.y, bp.z, npcBubbleEl, halfW, halfH, -10);
      } else {
        npcBubbleEl.style.opacity = '0';
        activeBubbleNpc = null;
      }
    }

    // 4. Update Rising Firework Shells
    for (let i = 0; i < shellPool.length; i++) {
      const sh = shellPool[i];
      if (!sh.active) continue;
      sh.vy -= 4.2 * dt;
      sh.x += sh.vx * dt;
      sh.y += sh.vy * dt;
      sh.z += sh.vz * dt;
      sh.sprite.position.set(sh.x, sh.y, sh.z);

      sh.trailTimer += dt;
      if (sh.trailTimer >= 0.024) {
        sh.trailTimer = 0;
        allocSpark(
          sh.x, sh.y - 0.15, sh.z,
          (Math.random() - 0.5) * 1.1,
          -1.8 - Math.random() * 1.2,
          (Math.random() - 0.5) * 1.1,
          0xffd584,
          0.32,
          0.92,
          2.8,
          0
        );
      }

      if (sh.y >= sh.targetY || sh.vy <= 0.6) {
        sh.active = false;
        sh.sprite.visible = false;
        explodeShell(sh);
      }
    }

    // 5. Update Sparks Pool (Zero Allocation)
    let anySparkUpdated = false;
    for (let i = 0; i < MAX_SPARKS; i++) {
      if (sparkLife[i] <= 0) continue;
      anySparkUpdated = true;
      sparkAge[i] += dt;
      if (sparkAge[i] >= sparkLife[i]) {
        sparkLife[i] = 0;
        sparkPositions[i * 3 + 1] = -500;
        sparkColors[i * 3] = 0;
        sparkColors[i * 3 + 1] = 0;
        sparkColors[i * 3 + 2] = 0;
        continue;
      }

      const damping = Math.pow(sparkDrag[i], dt * 60);
      sparkVelX[i] *= damping;
      sparkVelY[i] = sparkVelY[i] * damping - sparkGravity[i] * dt;
      sparkVelZ[i] *= damping;

      sparkPositions[i * 3] += sparkVelX[i] * dt;
      sparkPositions[i * 3 + 1] += sparkVelY[i] * dt;
      sparkPositions[i * 3 + 2] += sparkVelZ[i] * dt;

      const t = sparkAge[i] / sparkLife[i];
      let fade = 1 - t * t;
      if (sparkTwinkle[i] && t > 0.45) {
        fade *= 0.45 + 0.55 * Math.sin((sparkAge[i] * 42) + i);
      }
      sparkColors[i * 3] = sparkBaseR[i] * fade;
      sparkColors[i * 3 + 1] = sparkBaseG[i] * fade;
      sparkColors[i * 3 + 2] = sparkBaseB[i] * fade;
    }

    if (anySparkUpdated) {
      sparkGeo.attributes.position.needsUpdate = true;
      sparkGeo.attributes.color.needsUpdate = true;
    }

    // 6. Update Pooled Burst Lights
    for (let i = 0; i < burstLights.length; i++) {
      const slot = burstLights[i];
      if (slot.age < slot.life) {
        slot.age += dt;
        const p = Math.min(1, slot.age / slot.life);
        slot.light.intensity = slot.peak * (1 - p) * (1 - p);
      } else {
        slot.light.intensity = 0;
      }
    }

    // 7. Environment Mode Updates (Mutually Exclusive) + Cozy Firepit & Evening Fireflies
    const activeNightStrength = activeTimeKey === 'day' ? 0.0 : (activeTimeKey === 'sunset' ? 0.68 : 1.0);
    cozyFirepit.update(timeSec);

    if (envMode === 'lantern') {
      ambientSkyLanterns.update(dt, timeSec, 0.35 + activeNightStrength * 0.65);
      eveningFireflies.update(timeSec, activeNightStrength);
      for (let i = wishLanterns.length - 1; i >= 0; i--) {
        const w = wishLanterns[i];
        w.age += dt;
        if (w.age >= w.maxAge) {
          destroyWishLantern(w);
          wishLanterns.splice(i, 1);
          continue;
        }
        const x = w.baseX + Math.sin(w.age * 0.8 + w.swaySeed) * 1.1;
        const y = groundHeightAt(w.baseX, w.baseZ) + 1.45 + w.age * w.riseSpeed;
        const z = w.baseZ - w.age * 0.42 + Math.cos(w.age * 0.65 + w.swaySeed) * 0.5;
        w.mesh.position.set(x, y, z);
        w.mesh.rotation.y = w.age * 0.35;
        w.mesh.rotation.z = Math.sin(w.age * 1.2 + w.swaySeed) * 0.08;
        projectLabelToScreen(x, y + 0.45, z, w.labelEl, halfW, halfH, -8);
      }
      if (lanternRack.visible && lanternRack.userData.lanterns) {
        const rackLanterns = lanternRack.userData.lanterns;
        for (let i = 0; i < rackLanterns.length; i++) {
          const rl = rackLanterns[i];
          rl.pivot.rotation.z = Math.sin(timeSec * 1.45 + rl.phase) * 0.05;
          rl.pivot.rotation.x = Math.cos(timeSec * 1.15 + rl.phase) * 0.035;
        }
      }
    } else if (envMode === 'snow') {
      eveningFireflies.update(timeSec, 0);
      if (perfDegradeFactor > 0.72 || (frameCounter % 2 === 0)) {
        snowEnv.updateSnow(dt, timeSec);
      }
    }

    // Golden Ticket Twinkle & Player Victory Swirl
    if (!ticketFound && goldenTicket.visible) {
      goldenTicket.position.y = ticketY + Math.sin(timeSec * 2.4) * 0.028;
      goldenTicket.rotation.y = 0.55 + Math.sin(timeSec * 1.3) * 0.14;
      if (goldenTicket.userData.shimmerMat) {
        goldenTicket.userData.shimmerMat.opacity = 0.42 + Math.sin(timeSec * 3.4) * 0.24;
      }
    }
    if (goldenSparkPool.isActive()) {
      goldenSparkPool.update(dt, selfEntry.mesh.position);
    }

    // 8. Time-of-Day, Midnight Bloom, Ground Light Pools, Horizon Motion, Water & Bosingak Bell
    midnightFlash = Math.max(0, midnightFlash - dt * 0.52);
    applyTimeAtmosphere(dt, false);

    const activeLampScale = TIME_PRESETS[activeTimeKey]?.lampScale ?? 1.0;
    groundLightPools.update(timeSec, activeLampScale);
    clickRipple.update(dt);

    if (waterUniforms) {
      waterUniforms.uTime.value = timeSec;
    }
    if (beaconMat && beaconHaloMat) {
      const pulse = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(nowMs * 0.0036), 3);
      beaconMat.emissiveIntensity = 0.6 + pulse * 2.2;
      beaconHaloMat.opacity = 0.25 + pulse * 0.7;
    }
    if (starField) {
      starField.rotation.y += dt * 0.0035;
    }
    if (christmasTree.userData.starGroup) {
      christmasTree.userData.starGroup.rotation.y += dt * 0.55;
    }

    // Bosingak Bell, Expanding Resonance Wave Ring & Wooden Striker (당목)
    if (pavilionGroup.userData.strikerPivot && pavilionGroup.userData.bellPivot) {
      const strikeElapsed = (nowMs - bellStrikeStartMs) * 0.001;
      let strikerAngle = 0;

      if (strikeElapsed >= 0 && strikeElapsed < 1.1) {
        if (strikeElapsed < 0.2) {
          strikerAngle = 0.32 * Math.sin((strikeElapsed / 0.2) * (Math.PI * 0.5));
        } else if (strikeElapsed < 0.34) {
          const p = (strikeElapsed - 0.2) / 0.14;
          strikerAngle = THREE.MathUtils.lerp(0.32, -0.14, p * p);
        } else {
          if (bellSoundPending) {
            bellSoundPending = false;
            bellSwayAge = 0;
            audio.playBosingakBell();
          }
          const rec = (strikeElapsed - 0.34) / 0.76;
          strikerAngle = -0.14 * Math.exp(-rec * 4.5) * Math.cos(rec * Math.PI * 2.5);
        }
      }
      pavilionGroup.userData.strikerPivot.rotation.z = strikerAngle;

      if (bellSwayAge < 4.5) {
        bellSwayAge += dt;
        const decay = Math.exp(-bellSwayAge * 1.15);
        pavilionGroup.userData.bellPivot.rotation.z = -Math.sin(bellSwayAge * 7.2) * 0.085 * decay;
        if (pavilionGroup.userData.bellHaloMat && pavilionGroup.userData.bellHalo) {
          const ringPulse = Math.exp(-bellSwayAge * 1.8);
          pavilionGroup.userData.bellHaloMat.opacity = 0.45 + ringPulse * 0.48;
          const haloScale = 3.7 + Math.sin(Math.min(1, bellSwayAge * 2.2) * Math.PI) * 1.75 * ringPulse;
          pavilionGroup.userData.bellHalo.scale.set(haloScale, haloScale, 1);
        }
        if (pavilionGroup.userData.bellWaveRing && pavilionGroup.userData.bellWaveMat) {
          if (bellSwayAge < 1.8) {
            const wp = bellSwayAge / 1.8;
            pavilionGroup.userData.bellWaveRing.visible = true;
            pavilionGroup.userData.bellWaveRing.scale.setScalar(0.85 + wp * 3.4);
            pavilionGroup.userData.bellWaveMat.opacity = 0.65 * (1 - wp) * (1 - wp);
          } else {
            pavilionGroup.userData.bellWaveRing.visible = false;
          }
        }
      } else {
        pavilionGroup.userData.bellPivot.rotation.z = 0;
        if (pavilionGroup.userData.bellHaloMat && pavilionGroup.userData.bellHalo) {
          pavilionGroup.userData.bellHaloMat.opacity = 0.45;
          pavilionGroup.userData.bellHalo.scale.set(3.7, 3.7, 1);
        }
        if (pavilionGroup.userData.bellWaveRing) {
          pavilionGroup.userData.bellWaveRing.visible = false;
        }
      }
    }

    const puppyExcited = nowMs < puppyExcitedUntilMs;
    if (cliffDog.userData.tailPivot) {
      cliffDog.userData.tailPivot.rotation.z = puppyExcited
        ? Math.sin(nowMs * 0.024) * 0.56
        : Math.sin(nowMs * 0.0085) * 0.36;
    }
    if (cliffDog.userData.headPivot) {
      cliffDog.userData.headPivot.rotation.x = puppyExcited
        ? -0.26 + Math.sin(nowMs * 0.018) * 0.09
        : -0.2 + Math.sin(nowMs * 0.0018) * 0.045;
    }

    // Manbok (Bungeoppang Stall Vendor) & Steam
    if (bungeoppangStall.userData.vendorBody) {
      bungeoppangStall.userData.vendorBody.rotation.z = Math.sin(nowMs * 0.0022) * 0.05;
    }
    if (bungeoppangStall.userData.vendorRightArm) {
      bungeoppangStall.userData.vendorRightArm.rotation.x = -0.18 + Math.sin(nowMs * 0.0046) * 0.28;
      bungeoppangStall.userData.vendorRightArm.rotation.z = -0.14 + Math.cos(nowMs * 0.0023) * 0.1;
    }
    if (bungeoppangStall.userData.vendorHead) {
      bungeoppangStall.userData.vendorHead.rotation.y = Math.sin(nowMs * 0.0014) * 0.32;
      bungeoppangStall.userData.vendorHead.rotation.x = 0.04 + Math.sin(nowMs * 0.0028) * 0.05;
    }
    if (bungeoppangStall.userData.steams) {
      const steams = bungeoppangStall.userData.steams;
      for (let i = 0; i < steams.length; i++) {
        const st = steams[i];
        const cycle = ((nowMs * 0.00055 + st.phase * 0.16) % 1 + 1) % 1;
        st.sprite.position.y = 1.32 + cycle * 0.85;
        st.sprite.position.x = -0.55 + Math.sin(nowMs * 0.002 + st.phase) * 0.14;
        const s = 0.24 + cycle * 0.34;
        st.sprite.scale.set(s, s, 1);
        st.sprite.material.opacity = Math.sin(cycle * Math.PI) * 0.32;
      }
    }

    // Chichi (Blue-Roof House Villager): Wave when zoomed close + Nameplate within 55m
    if (blueHouseInfo) {
      const distToBlueHouse = camera.position.distanceTo(blueHouseInfo.porchWorldPos);
      const isClose = distToBlueHouse < 32;
      blueHouseInfo.waveBlend = THREE.MathUtils.damp(blueHouseInfo.waveBlend, isClose ? 1 : 0, 7.5, dt);
      const wb = blueHouseInfo.waveBlend;

      const restArmZ = 0.16;
      const waveArmZ = 2.38 + Math.sin(nowMs * 0.0115) * 0.55;
      blueHouseInfo.rightArmPivot.rotation.z = THREE.MathUtils.lerp(restArmZ, waveArmZ, wb);
      blueHouseInfo.bodyPivot.position.y = Math.abs(Math.sin(nowMs * 0.0055)) * 0.05 * wb;
      blueHouseInfo.bodyPivot.rotation.z = Math.sin(nowMs * 0.0055) * 0.06 * wb;

      if (waveLabelEl) {
        if (wb > 0.25) {
          projectLabelToScreen(
            blueHouseInfo.porchWorldPos.x,
            blueHouseInfo.porchWorldPos.y + 0.92,
            blueHouseInfo.porchWorldPos.z,
            waveLabelEl,
            halfW,
            halfH,
            -8
          );
          if (waveLabelEl.style.opacity !== '0') {
            waveLabelEl.style.opacity = wb.toFixed(2);
          }
        } else {
          waveLabelEl.style.opacity = '0';
        }
      }
    }

    // 9. Sky Midnight Countdown (high cadence while countdown active, 4x/sec idle)
    const epochNow = Date.now();
    const highRate = Boolean(previewState) || Boolean(liveEventState);
    if (highRate || epochNow - lastCountdownCheck >= 220) {
      lastCountdownCheck = epochNow;
      updateSkyMidnightEvent(epochNow, nowMs);
      if (selectedTimePreference === 'auto') {
        const autoNext = resolveAutoTimeMode(new Date());
        if (autoNext !== activeTimeKey) {
          activeTimeKey = autoNext;
          syncTimeModeUi();
        }
      }
    }
  }

  function afterDraw(cb) {
    const gl = renderer.getContext();
    if (gl && typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (stopped) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    } else {
      frameId = window.setTimeout(cb, 80);
    }
  }

  function tick() {
    if (stopped) return;
    const now = performance.now();
    const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
    lastFrameTime = now;

    stepSimulation(dt, now);
    renderer.render(scene, camera);

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }
  }

  function cancelLoop() {
    stopped = true;
    cancelAnimationFrame(frameId);
    clearTimeout(frameId);
    frameId = 0;
  }

  function scheduleLoop() {
    if (!stopped && frameId) return;
    stopped = false;
    lastFrameTime = performance.now();
    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }
  }

  function disposeSceneGraph(rootScene) {
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();

    rootScene.traverse((obj) => {
      if (obj.geometry) geometries.add(obj.geometry);
      if (obj.material) {
        const matList = Array.isArray(obj.material) ? obj.material : [obj.material];
        matList.forEach((m) => {
          materials.add(m);
          if (m.map) textures.add(m.map);
          if (m.emissiveMap) textures.add(m.emissiveMap);
          if (m.alphaMap) textures.add(m.alphaMap);
          if (m.normalMap) textures.add(m.normalMap);
          if (m.roughnessMap) textures.add(m.roughnessMap);
        });
      }
    });

    textures.forEach((t) => t.dispose());
    materials.forEach((m) => m.dispose());
    geometries.forEach((g) => g.dispose());
  }

  stopped = true;
  frameId = 0;
  scheduleLoop();

  window.addEventListener('pageshow', (event) => {
    selectedTimePreference = 'auto';
    activeTimeKey = resolveAutoTimeMode(new Date());
    syncTimeModeUi();
    applyTimeAtmosphere(1, true);

    if (event.persisted) {
      scheduleLoop();
    }
    if (!isMuted) {
      audio.suspendForHidden(false);
      audio.ensureContext();
      if (!audio.isRunning()) {
        window.addEventListener('pointerdown', tryUnlockAudio, { passive: true });
        window.addEventListener('click', tryUnlockAudio, { passive: true });
        window.addEventListener('touchend', tryUnlockAudio, { passive: true });
        window.addEventListener('keydown', tryUnlockAudio, { passive: true });
      }
    }
  });

  window.addEventListener('pagehide', (event) => {
    cancelLoop();
    audio.suspendForHidden(true);
    if (event.persisted) {
      return;
    }
    clearTimeout(hintHideTimer);
    clearCountdownTimers();
    goldenSparkPool.stop();
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('resize', onResize);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    canvas.removeEventListener('webglcontextrestored', onContextRestored);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    audio.dispose();
    controls.dispose();
    disposeSceneGraph(scene);
    glowTexture.dispose();
    envTarget.dispose();
    renderer.dispose();
  });

  return true;
}
