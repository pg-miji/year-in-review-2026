// ===================================================================
// 시간 조각 상점 - 은하재 3D Terrain, Namsan + N Seoul Tower,
// Pavilion Bench, Christmas Tree, Avatars & Wish Lanterns
// ===================================================================

import * as THREE from 'three';

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Deterministic terrain height shared between terrain mesh, props, and visitors
export function groundHeightAt(x, z) {
  const gentleRoll =
    Math.cos(x * 0.12) * Math.cos((z - 1.5) * 0.12) * 0.55 +
    Math.sin(x * 0.28 + z * 0.22) * 0.18;
  const plateauY = 6.55 + gentleRoll;

  const cliffFactor = smoothstep(-26.5, -12.0, z);
  const sideFalloff = 1 - smoothstep(16.0, 42.0, Math.abs(x));
  const southFalloff = 1 - smoothstep(14.5, 40.0, z);

  const hillMask = cliffFactor * sideFalloff * southFalloff;
  return THREE.MathUtils.lerp(-0.9, plateauY, hillMask);
}

// Soft radial glow sprite texture (generated once on offscreen canvas)
export function createGlowTexture(innerColor = 'rgba(255,255,255,1)', midColor = 'rgba(255,230,160,0.45)') {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, innerColor);
  grad.addColorStop(0.28, midColor);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Procedural building window facade texture for flanking Seoul city lights
function createCityFacadeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#090b18';
  ctx.fillRect(0, 0, 128, 256);

  const cols = 8;
  const rows = 24;
  const cellW = 128 / cols;
  const cellH = 256 / rows;

  for (let r = 1; r < rows - 1; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() < 0.42) {
        const warm = Math.random();
        if (warm < 0.65) {
          ctx.fillStyle = `rgba(255, ${200 + Math.floor(Math.random() * 45)}, ${110 + Math.floor(Math.random() * 60)}, ${0.5 + Math.random() * 0.5})`;
        } else if (warm < 0.88) {
          ctx.fillStyle = `rgba(170, 215, 255, ${0.4 + Math.random() * 0.45})`;
        } else {
          ctx.fillStyle = `rgba(255, 175, 195, ${0.35 + Math.random() * 0.4})`;
        }
        ctx.fillRect(c * cellW + 3, r * cellH + 3, cellW - 6, cellH - 5);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Continuous northern shore + wider Mount Namsan height function (organic shoreline, never submerged)
export function northLandElevation(wx, wz) {
  const bankCurve = Math.sin(wx * 0.085) * 1.15 + Math.cos(wx * 0.19) * 0.55;
  const shorelineZ = -58.5 + bankCurve;
  const bankFactor = smoothstep(shorelineZ + 2.8, shorelineZ - 2.4, wz);
  const shoreBase = THREE.MathUtils.lerp(-0.9, 1.05, bankFactor);
  if (wz > shorelineZ - 2.0) return shoreBase;

  // Center main peak & broad flanking ridges so Namsan spans wide across the skyline
  const dxCenter = (wx - 2.0) / 38.0;
  const dzCenter = (wz - (-96.0)) / 19.5;
  const mainPeak = 19.5 * Math.exp(-(dxCenter * dxCenter * 0.8 + dzCenter * dzCenter));

  const dxW1 = (wx + 38.0) / 30.0;
  const dzW1 = (wz - (-98.0)) / 17.5;
  const westShoulder = 13.0 * Math.exp(-(dxW1 * dxW1 + dzW1 * dzW1));

  const dxW2 = (wx + 76.0) / 26.0;
  const dzW2 = (wz - (-101.0)) / 16.0;
  const farWestRidge = 8.4 * Math.exp(-(dxW2 * dxW2 + dzW2 * dzW2));

  const dxE1 = (wx - 40.0) / 30.0;
  const dzE1 = (wz - (-97.0)) / 17.5;
  const eastShoulder = 12.6 * Math.exp(-(dxE1 * dxE1 + dzE1 * dzE1));

  const dxE2 = (wx - 78.0) / 26.0;
  const dzE2 = (wz - (-100.0)) / 16.0;
  const farEastRidge = 8.0 * Math.exp(-(dxE2 * dxE2 + dzE2 * dzE2));

  const detail = (Math.sin(wx * 0.16) * Math.cos(wz * 0.21) * 0.72 + Math.cos(wx * 0.08 - wz * 0.11) * 0.45);
  const namsanMask =
    (1 - smoothstep(82, 122, Math.abs(wx))) *
    smoothstep(-61.5, -70.0, wz) *
    (1 - smoothstep(-115.0, -132.0, wz));

  return shoreBase + Math.max(0, (mainPeak + westShoulder + farWestRidge + eastShoulder + farEastRidge + detail) * namsanMask);
}

// Shared materials registry per scene creation (minimizes GPU shader variants & heap memory)
function createSharedHouseMats() {
  return {
    stoneMat: new THREE.MeshStandardMaterial({ color: 0x3b3d4a, roughness: 0.9, metalness: 0.05 }),
    woodMat: new THREE.MeshStandardMaterial({ color: 0x543828, roughness: 0.82 }),
    winMat: new THREE.MeshStandardMaterial({
      color: 0xfff1c4,
      emissive: 0xffbe55,
      emissiveIntensity: 1.65,
      roughness: 0.25
    }),
    darkWinMat: new THREE.MeshStandardMaterial({
      color: 0x202736,
      roughness: 0.48,
      metalness: 0.12
    })
  };
}

// 1960s Modernist Namsan Public Library (horizontal concrete balcony slabs, recessed glass, flat roof, no signboard)
function createNamsanLibrary(x, z, atmosphereRefs) {
  const g = new THREE.Group();
  const baseY = northLandElevation(x, z);
  g.position.set(x, baseY, z);

  const concreteSlabMat = new THREE.MeshStandardMaterial({ color: 0xd6dbe3, roughness: 0.82, metalness: 0.06 });
  const concreteTrimMat = new THREE.MeshStandardMaterial({ color: 0xbac2cf, roughness: 0.86, metalness: 0.05 });
  const coreWallMat = new THREE.MeshStandardMaterial({ color: 0x8992a0, roughness: 0.85, metalness: 0.08 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x262c38, roughness: 0.45, metalness: 0.55 });
  const readingGlassMat = new THREE.MeshStandardMaterial({
    color: 0x4b637d,
    emissive: 0xffc66e,
    emissiveIntensity: 1.15,
    roughness: 0.18,
    metalness: 0.32
  });
  atmosphereRefs.nightWindowMats.push({ mat: readingGlassMat, baseEmissive: 1.15, maxEmissive: 1.15, minEmissive: 0.12 });

  // 1. Concrete Foundation Retaining Deck seated cleanly into Namsan slope
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(10.6, 5.6, 5.4), concreteTrimMat);
  foundation.position.set(0, -2.55, 0.2);
  g.add(foundation);

  // 2. Ground Floor Pilotis Columns & Recessed Lobby Core
  const lobbyCore = new THREE.Mesh(new THREE.BoxGeometry(7.8, 1.1, 2.8), coreWallMat);
  lobbyCore.position.set(0, 0.78, -0.35);
  g.add(lobbyCore);

  const lobbyGlass = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.85, 0.12), readingGlassMat);
  lobbyGlass.position.set(0, 0.68, 1.08);
  g.add(lobbyGlass);

  // 6 Vertical Modernist Structural Columns rising up the facade
  [-4.3, -2.6, -0.88, 0.88, 2.6, 4.3].forEach((cx) => {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.22, 4.95, 0.28), concreteSlabMat);
    col.position.set(cx, 2.65, 1.62);
    g.add(col);
  });

  // 3. Recessed Interior Glass Reading Hall Core (Floors 2~4)
  const upperCore = new THREE.Mesh(new THREE.BoxGeometry(9.0, 3.85, 3.3), readingGlassMat);
  upperCore.position.set(0, 3.18, -0.1);
  g.add(upperCore);

  // Dark horizontal spandrel & vertical window mullion ribs
  [-3.45, -1.75, 0, 1.75, 3.45].forEach((mx) => {
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.85, 3.42), frameMat);
    mullion.position.set(mx, 3.18, -0.1);
    g.add(mullion);
  });

  // 4. Iconic Stacked Horizontal Concrete Balcony Slabs (4 crisp modernist floor bands)
  [1.38, 2.42, 3.46, 4.5].forEach((slabY) => {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(9.65, 0.24, 4.1), concreteSlabMat);
    slab.position.set(0, slabY, 0.08);
    g.add(slab);

    // Subtle balcony railing parapet edge
    const rail = new THREE.Mesh(new THREE.BoxGeometry(9.65, 0.14, 0.08), concreteTrimMat);
    rail.position.set(0, slabY + 0.18, 2.08);
    g.add(rail);
  });

  // 5. Flat Modernist Roof Deck + Parapet + Compact Rooftop Mechanical Penthouse
  const flatRoof = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.32, 4.25), concreteSlabMat);
  flatRoof.position.set(0, 5.28, 0.06);
  g.add(flatRoof);

  const parapet = new THREE.Mesh(new THREE.BoxGeometry(9.84, 0.22, 4.29), concreteTrimMat);
  parapet.position.set(0, 5.5, 0.06);
  g.add(parapet);

  const penthouse = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.72, 1.8), coreWallMat);
  penthouse.position.set(-1.4, 5.95, -0.35);
  g.add(penthouse);

  // Entrance Terrace Steps on the south-west approach
  const steps = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.35, 1.15), concreteTrimMat);
  steps.position.set(0, 0.18, 2.25);
  g.add(steps);

  return g;
}

// Cozy Multi-part Hillside House on Namsan (varied stories/heights + Blue Roof House with Yard & Chichi)
function createNamsanHouse(x, z, { roofColor = 0x9c4638, wallColor = 0xe8dfd1, isBlueRoof = false, lit = true, stories = 1, heightScale = 1.0 }, glowTexture, sharedMats, atmosphereRefs) {
  const g = new THREE.Group();
  const baseY = northLandElevation(x, z);
  g.position.set(x, baseY, z);

  const { stoneMat, woodMat, winMat, darkWinMat } = sharedMats;
  const wallMat = new THREE.MeshStandardMaterial({
    color: wallColor,
    roughness: isBlueRoof ? 0.92 : 0.84,
    envMapIntensity: isBlueRoof ? 0.35 : 0.65
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: roofColor,
    roughness: isBlueRoof ? 0.64 : 0.68,
    metalness: isBlueRoof ? 0.06 : 0.06,
    envMapIntensity: isBlueRoof ? 0.42 : 0.65
  });

  const bodyH = (isBlueRoof ? 1.72 : 1.55) * heightScale;
  const roofH = (isBlueRoof ? 1.24 : 1.15) * (0.85 + 0.2 * heightScale);
  const houseOffsetX = isBlueRoof ? -0.35 : 0;
  const houseOffsetZ = isBlueRoof ? -0.45 : -0.15;

  // 1. Stone Terrace Foundation seated deeply into steep mountain slopes (expanded yard terrace for Chichi)
  const terrace = new THREE.Mesh(
    isBlueRoof ? new THREE.BoxGeometry(6.4, 5.2, 6.0) : new THREE.BoxGeometry(3.5, 5.2, 4.1),
    stoneMat
  );
  terrace.position.set(0, -2.45, isBlueRoof ? 1.05 : 0.35);
  g.add(terrace);

  // 2. Main House Body (varied story height)
  const body = new THREE.Mesh(
    isBlueRoof ? new THREE.BoxGeometry(2.9, bodyH, 2.25) : new THREE.BoxGeometry(2.6, bodyH, 2.1),
    wallMat
  );
  body.position.set(houseOffsetX, 0.15 + bodyH * 0.5, houseOffsetZ);
  g.add(body);

  // 3. Pitched Gable Roof (4-sided pyramid seated atop body)
  const roof = new THREE.Mesh(new THREE.ConeGeometry(isBlueRoof ? 2.38 : 2.25, roofH, 4), roofMat);
  roof.position.set(houseOffsetX, 0.15 + bodyH + roofH * 0.45, houseOffsetZ);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(isBlueRoof ? 1.02 : 1.12, 1.0, 0.96);
  g.add(roof);

  // 4. Brick Chimney
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.72, 0.32), stoneMat);
  chimney.position.set(houseOffsetX + 0.74, 0.15 + bodyH + roofH * 0.52, houseOffsetZ - 0.35);
  g.add(chimney);

  const activeWinMat = !lit
    ? darkWinMat
    : (isBlueRoof
        ? new THREE.MeshStandardMaterial({
            color: 0xfae3ac,
            emissive: 0xd99e42,
            emissiveIntensity: 0.85,
            roughness: 0.32,
            envMapIntensity: 0.35
          })
        : winMat);
  if (lit && isBlueRoof) {
    atmosphereRefs.nightWindowMats.push({ mat: activeWinMat, baseEmissive: 0.85, maxEmissive: 0.85, minEmissive: 0.22 });
  }

  // 5. Windows + Wooden Front Door
  const doorZ = houseOffsetZ + (isBlueRoof ? 1.13 : 1.06);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.96, 0.08), woodMat);
  door.position.set(houseOffsetX - 0.46, 0.63, doorZ);
  g.add(door);

  const frontWin = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.56, 0.08), activeWinMat);
  frontWin.position.set(houseOffsetX + 0.52, 0.94, doorZ);
  g.add(frontWin);

  const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.62), activeWinMat);
  if (isBlueRoof) {
    sideWin.position.set(houseOffsetX + 2.94, 0.78, houseOffsetZ + 0.08);
  } else {
    sideWin.position.set(houseOffsetX + 1.31, 0.94, houseOffsetZ + 0.05);
  }
  g.add(sideWin);

  // Upper floor windows for 2-story hillside houses
  if (stories >= 2 || heightScale >= 1.2) {
    [-0.5, 0.5].forEach((wx) => {
      const upperWin = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.48, 0.08), activeWinMat);
      upperWin.position.set(houseOffsetX + wx, 0.15 + bodyH * 0.74, doorZ);
      g.add(upperWin);
    });
  }

  if (lit) {
    const porchHaloMat = new THREE.SpriteMaterial({
      map: glowTexture,
      color: isBlueRoof ? 0xf6cf88 : 0xffcb74,
      transparent: true,
      opacity: isBlueRoof ? 0.2 : 0.36,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    atmosphereRefs.nightHaloSprites.push({
      mat: porchHaloMat,
      baseOpacity: isBlueRoof ? 0.2 : 0.36,
      maxOpacity: isBlueRoof ? 0.2 : 0.36
    });
    const porchHalo = new THREE.Sprite(porchHaloMat);
    porchHalo.position.set(houseOffsetX, isBlueRoof ? 1.2 : 1.05, doorZ + 0.28);
    porchHalo.scale.set(isBlueRoof ? 1.6 : 2.2, isBlueRoof ? 1.6 : 2.2, 1);
    g.add(porchHalo);
  }

  // 6. Upgraded Yard, Side Sunroom Wing, Fence Gate & Friendly Waving Villager (치치) for the Blue-Roof House
  let villager = null;
  if (isBlueRoof) {
    const yardGrassMat = new THREE.MeshStandardMaterial({ color: 0x2a4536, roughness: 0.94, envMapIntensity: 0.35 });
    const trimWhiteMat = new THREE.MeshStandardMaterial({ color: 0xded7cb, roughness: 0.85, envMapIntensity: 0.35 });
    const fenceWoodMat = new THREE.MeshStandardMaterial({ color: 0x6b4b36, roughness: 0.84, envMapIntensity: 0.35 });
    const pineYardMat = new THREE.MeshStandardMaterial({ color: 0x1e4a35, roughness: 0.86, envMapIntensity: 0.35 });
    const shrubMat = new THREE.MeshStandardMaterial({ color: 0x2c5c40, roughness: 0.88, envMapIntensity: 0.35 });

    // Landscaped Green Front & Side Yard Lawn Bed
    const yardLawn = new THREE.Mesh(new THREE.BoxGeometry(6.15, 0.16, 5.6), yardGrassMat);
    yardLawn.position.set(0, 0.14, 1.05);
    g.add(yardLawn);

    // Cozy Side Annex / Sunroom Wing on the +X side of the main cottage (flush outside shared wall at x = +1.10)
    const wingBody = new THREE.Mesh(new THREE.BoxGeometry(1.48, 1.18, 1.64), wallMat);
    wingBody.position.set(houseOffsetX + 2.19, 0.74, houseOffsetZ + 0.08);
    g.add(wingBody);

    // Solid cream gable triangle filling the upper annex wall cleanly
    const wingGableShape = new THREE.Shape();
    wingGableShape.moveTo(-0.82, 1.32);
    wingGableShape.lineTo(0.82, 1.32);
    wingGableShape.lineTo(0, 1.78);
    wingGableShape.closePath();
    const wingGable = new THREE.Mesh(
      new THREE.ExtrudeGeometry(wingGableShape, { depth: 1.48, bevelEnabled: false }),
      wallMat
    );
    wingGable.rotation.y = Math.PI / 2;
    wingGable.position.set(houseOffsetX + 1.45, 0, houseOffsetZ + 0.08);
    g.add(wingGable);

    // Solid gable roof starting strictly at x = +1.10 (zero middle-wall clipping) and overhanging all 3 outer sides
    const wingRoofShape = new THREE.Shape();
    wingRoofShape.moveTo(-1.02, 1.25);
    wingRoofShape.lineTo(-1.02, 1.36);
    wingRoofShape.lineTo(0, 1.87);
    wingRoofShape.lineTo(1.02, 1.36);
    wingRoofShape.lineTo(1.02, 1.25);
    wingRoofShape.lineTo(0, 1.76);
    wingRoofShape.closePath();
    const wingRoof = new THREE.Mesh(
      new THREE.ExtrudeGeometry(wingRoofShape, { depth: 1.68, bevelEnabled: false }),
      roofMat
    );
    wingRoof.rotation.y = Math.PI / 2;
    wingRoof.position.set(houseOffsetX + 1.45, 0, houseOffsetZ + 0.08);
    g.add(wingRoof);

    const wingWin = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.48, 0.08), activeWinMat);
    wingWin.position.set(houseOffsetX + 2.19, 0.78, houseOffsetZ + 0.91);
    g.add(wingWin);

    // Cozy Wooden Porch Deck + Steps leading down to the front yard
    const porchFloor = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.14, 1.25), woodMat);
    porchFloor.position.set(houseOffsetX, 0.22, doorZ + 0.62);
    g.add(porchFloor);

    const porchStep = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 0.42), woodMat);
    porchStep.position.set(houseOffsetX - 0.38, 0.16, doorZ + 1.38);
    g.add(porchStep);

    // Stepping Stone Path across the front yard to the open fence gate
    [0, 1, 2, 3].forEach((idx) => {
      const stepStone = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.27, 0.06, 7), stoneMat);
      stepStone.position.set(houseOffsetX - 0.35 + idx * 0.1, 0.23, doorZ + 1.85 + idx * 0.56);
      stepStone.rotation.y = idx * 0.6;
      g.add(stepStone);
    });

    // Yard Perimeter Fence (left, right, and front with an open centered garden gate)
    const postGeo = new THREE.BoxGeometry(0.11, 0.62, 0.11);
    const postPositions = [
      // Left edge (-2.88)
      [-2.88, -1.2], [-2.88, 0.2], [-2.88, 1.6], [-2.88, 3.0], [-2.88, 3.68],
      // Right edge (2.88)
      [2.88, -1.2], [2.88, 0.2], [2.88, 1.6], [2.88, 3.0], [2.88, 3.68],
      // Front edge (z = 3.68) with centered gate gap around x = -0.35 .. +0.35
      [-1.75, 3.68], [-0.85, 3.68], [0.55, 3.68], [1.75, 3.68]
    ];
    postPositions.forEach(([px, pz]) => {
      const post = new THREE.Mesh(postGeo, trimWhiteMat);
      post.position.set(px, 0.5, pz);
      g.add(post);
    });

    // Horizontal rails along left/right and front left/right segments
    [-2.88, 2.88].forEach((fx) => {
      [0.38, 0.65].forEach((ry) => {
        const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 4.92), trimWhiteMat);
        sideRail.position.set(fx, ry, 1.24);
        g.add(sideRail);
      });
    });
    [
      { x0: -2.88, x1: -0.85 },
      { x0: 0.55, x1: 2.88 }
    ].forEach((seg) => {
      const len = seg.x1 - seg.x0;
      const cx = (seg.x0 + seg.x1) * 0.5;
      [0.38, 0.65].forEach((ry) => {
        const frontRail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 0.06), trimWhiteMat);
        frontRail.position.set(cx, ry, 3.68);
        g.add(frontRail);
      });
    });

    // Open Gate Pillars with tiny warm brass caps
    [-0.85, 0.55].forEach((gx) => {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.15), activeWinMat);
      cap.position.set(gx, 0.85, 3.68);
      g.add(cap);
    });

    // Cozy Yard Pine Tree & Shrubs + Small Wooden Yard Bench
    const yardTreeTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.72, 7), woodMat);
    yardTreeTrunk.position.set(-2.1, 0.56, 2.65);
    g.add(yardTreeTrunk);
    const yardTreeCone1 = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.28, 8), pineYardMat);
    yardTreeCone1.position.set(-2.1, 1.32, 2.65);
    g.add(yardTreeCone1);
    const yardTreeCone2 = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.96, 8), pineYardMat);
    yardTreeCone2.position.set(-2.1, 1.95, 2.65);
    g.add(yardTreeCone2);

    [[-1.6, 3.15, 0.24], [1.15, 3.18, 0.22], [2.32, 2.85, 0.26]].forEach(([sx, sz, sr]) => {
      const shrub = new THREE.Mesh(new THREE.SphereGeometry(sr, 8, 7), shrubMat);
      shrub.scale.set(1.15, 0.85, 1.15);
      shrub.position.set(sx, 0.34, sz);
      g.add(shrub);
    });

    const yardBench = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.08, 0.34), fenceWoodMat);
    yardBench.position.set(1.88, 0.42, 2.35);
    yardBench.rotation.y = -0.35;
    g.add(yardBench);
    [-0.36, 0.36].forEach((blx) => {
      const bLeg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.28), stoneMat);
      bLeg.position.set(1.88 + Math.cos(-0.35) * blx, 0.3, 2.35 - Math.sin(-0.35) * blx);
      bLeg.rotation.y = -0.35;
      g.add(bLeg);
    });

    // Stylized Friendly Villager (치치) standing on the Porch facing +Z (deep navy hat + coat buttons + calmer lighting)
    const villagerGroup = new THREE.Group();
    villagerGroup.position.set(houseOffsetX + 0.34, 0.29, doorZ + 0.65);

    const bodyPivot = new THREE.Group();
    villagerGroup.add(bodyPivot);

    const coatMat = new THREE.MeshStandardMaterial({ color: 0xd4a43f, roughness: 0.82, envMapIntensity: 0.32 });
    const scarfMat = new THREE.MeshStandardMaterial({ color: 0xc24354, roughness: 0.86, envMapIntensity: 0.32 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xeec9af, roughness: 0.76, envMapIntensity: 0.3 });
    const pantMat = new THREE.MeshStandardMaterial({ color: 0x262b3d, roughness: 0.84, envMapIntensity: 0.3 });
    const bucketHatMat = new THREE.MeshStandardMaterial({ color: 0x1e325c, roughness: 0.82, envMapIntensity: 0.32 });
    const chichiButtonMat = new THREE.MeshStandardMaterial({ color: 0xf4e3b8, roughness: 0.45, metalness: 0.25, envMapIntensity: 0.35 });

    [-0.08, 0.08].forEach((lx) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.048, 0.34, 8), pantMat);
      leg.position.set(lx, 0.17, 0);
      bodyPivot.add(leg);
    });

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.52, 10), coatMat);
    torso.position.y = 0.58;
    bodyPivot.add(torso);

    // Coat front buttons for Chichi
    [
      { y: 0.72, z: 0.156 },
      { y: 0.6, z: 0.17 },
      { y: 0.48, z: 0.184 }
    ].forEach((b) => {
      const btn = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), chichiButtonMat);
      btn.position.set(0, b.y, b.z);
      bodyPivot.add(btn);
    });

    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.04, 6, 12), scarfMat);
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = 0.84;
    bodyPivot.add(scarf);

    const headPivot = new THREE.Group();
    headPivot.position.y = 0.99;
    const darkEyeMat = new THREE.MeshStandardMaterial({ color: 0x241714, roughness: 0.45 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), skinMat);
    headPivot.add(head);

    [-0.048, 0.048].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), darkEyeMat);
      eye.position.set(ex, 0.012, 0.128);
      headPivot.add(eye);
    });

    // Snugly pulled-down deep navy bucket hat seated low on forehead while keeping eyes clearly visible
    const hatGroup = new THREE.Group();
    hatGroup.position.set(0, 0.056, -0.004);
    hatGroup.rotation.x = -0.06;
    const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.136, 0.152, 0.115, 14), bucketHatMat);
    hatCrown.position.y = 0.052;
    hatGroup.add(hatCrown);
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.152, 0.228, 0.042, 16), bucketHatMat);
    hatBrim.position.y = -0.008;
    hatGroup.add(hatBrim);
    headPivot.add(hatGroup);

    bodyPivot.add(headPivot);

    // Left resting arm + skin-colored round hand
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.19, 0.78, 0.02);
    leftArmGroup.rotation.z = -0.16;
    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.042, 0.32, 6), coatMat);
    leftArm.position.y = -0.15;
    leftArmGroup.add(leftArm);
    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.046, 8, 8), skinMat);
    leftHand.position.y = -0.32;
    leftArmGroup.add(leftHand);
    bodyPivot.add(leftArmGroup);

    // Right Waving Arm Pivot (shoulder joint at upper right torso)
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.19, 0.78, 0.02);
    const armMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.042, 0.36, 6), coatMat);
    armMesh.position.y = -0.16;
    rightArmPivot.add(armMesh);
    const handMesh = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), skinMat);
    handMesh.position.y = -0.35;
    rightArmPivot.add(handMesh);
    bodyPivot.add(rightArmPivot);

    g.add(villagerGroup);

    villager = {
      houseGroup: g,
      villagerGroup,
      bodyPivot,
      headPivot,
      rightArmPivot,
      porchWorldPos: new THREE.Vector3(x + houseOffsetX + 0.34, baseY + 1.24, z + doorZ + 0.65),
      waveBlend: 0
    };
  }

  g.userData.isBlueRoofHouse = isBlueRoof;
  return { houseGroup: g, villager, bodyH, roofH, offsetX: houseOffsetX, offsetZ: houseOffsetZ, isBlueRoof };
}

// Wide Northern Shoreline, Mount Namsan + N Seoul Tower, Modernist Library & Hillside Houses
function createNamsanAndTower(glowTexture, quality, atmosphereRefs) {
  const namsanGroup = new THREE.Group();
  const isMobile = Boolean(quality?.isMobile);

  // 1. Continuous Northern Landmass + Wide Mount Namsan Range (mobile-scaled grid)
  const landGeo = new THREE.PlaneGeometry(340, 144, isMobile ? 76 : 104, isMobile ? 30 : 42);
  landGeo.rotateX(-Math.PI / 2);

  const pos = landGeo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const snowColors = new Float32Array(pos.count * 3);
  const cBank = new THREE.Color('#1d202b');
  const cPlain = new THREE.Color('#141923');
  const cMid = new THREE.Color('#172227');
  const cPeak = new THREE.Color('#1d2b2e');
  const cSnowPlain = new THREE.Color('#cad8e6');
  const cSnowPeak = new THREE.Color('#edf4fc');
  const tmp = new THREE.Color();
  const tmpSnow = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const lx = pos.getX(i);
    const lz = pos.getZ(i) - 128.0; // Spans z = -56 to z = -200
    const h = northLandElevation(lx, lz);
    pos.setZ(i, lz);
    pos.setY(i, h);

    const bankCurve = Math.sin(lx * 0.085) * 1.15 + Math.cos(lx * 0.19) * 0.55;
    const shorelineZ = -58.5 + bankCurve;
    const shoreBlend = smoothstep(shorelineZ - 1.2, shorelineZ - 7.8, lz);

    const t = smoothstep(0.95, 19.5, h);
    tmp.copy(cPlain).lerp(cMid, Math.min(1, t * 1.45)).lerp(cPeak, Math.max(0, t - 0.35));
    tmp.copy(cBank).lerp(tmp, shoreBlend);

    const snowMtn = tmpSnow.copy(cSnowPlain).lerp(cSnowPeak, Math.min(1, t * 1.25));
    const snowBankR = cBank.r + (cSnowPlain.r - cBank.r) * 0.42;
    const snowBankG = cBank.g + (cSnowPlain.g - cBank.g) * 0.42;
    const snowBankB = cBank.b + (cSnowPlain.b - cBank.b) * 0.42;
    tmpSnow.setRGB(
      THREE.MathUtils.lerp(snowBankR, snowMtn.r, shoreBlend),
      THREE.MathUtils.lerp(snowBankG, snowMtn.g, shoreBlend),
      THREE.MathUtils.lerp(snowBankB, snowMtn.b, shoreBlend)
    );

    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;

    snowColors[i * 3] = tmpSnow.r;
    snowColors[i * 3 + 1] = tmpSnow.g;
    snowColors[i * 3 + 2] = tmpSnow.b;
  }

  const baseColorAttr = new THREE.BufferAttribute(colors, 3);
  const snowColorAttr = new THREE.BufferAttribute(snowColors, 3);
  landGeo.setAttribute('color', baseColorAttr);
  landGeo.computeVertexNormals();

  const landMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.94,
    metalness: 0.04
  });
  const landMesh = new THREE.Mesh(landGeo, landMat);
  namsanGroup.add(landMesh);

  // 2. N Seoul Tower (9 composite parts seated flush on Namsan center summit)
  const summitX = 2.0;
  const summitZ = -96.0;
  const summitY = northLandElevation(summitX, summitZ) - 0.45;

  const tower = new THREE.Group();
  tower.position.set(summitX, summitY, summitZ);

  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x3b4254, roughness: 0.55, metalness: 0.25 });
  const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x1c2130, roughness: 0.4, metalness: 0.72 });
  const goldGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffe4a0,
    emissive: 0xffb347,
    emissiveIntensity: 1.85,
    roughness: 0.25
  });
  const cyanGlowMat = new THREE.MeshStandardMaterial({
    color: 0xa6f0ff,
    emissive: 0x4cc9f0,
    emissiveIntensity: 1.55,
    roughness: 0.25
  });
  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0xff4d6d,
    emissive: 0xff2a55,
    emissiveIntensity: 2.2,
    roughness: 0.2
  });

  // 1. Octagonal Plaza Deck
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 4.2, 1.8, 8), darkMetalMat);
  plaza.position.y = 0.9;
  tower.add(plaza);

  // 2. Warm lit plaza ring
  const plazaRing = new THREE.Mesh(new THREE.CylinderGeometry(3.55, 3.55, 0.35, 16), goldGlowMat);
  plazaRing.position.y = 1.6;
  tower.add(plazaRing);

  // 3. Main Tower Shaft
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.35, 14.5, 14), concreteMat);
  shaft.position.y = 9.0;
  tower.add(shaft);

  // 4. Shaft accent light collar
  const shaftCollar = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, 0.45, 14), cyanGlowMat);
  shaftCollar.position.y = 12.6;
  tower.add(shaftCollar);

  // 5. Observation Pod Lower Deck
  const obsLower = new THREE.Mesh(new THREE.CylinderGeometry(2.85, 1.9, 1.6, 18), darkMetalMat);
  obsLower.position.y = 16.5;
  tower.add(obsLower);

  // 6. Observation Glowing Window Band
  const obsWindows = new THREE.Mesh(new THREE.CylinderGeometry(2.92, 2.92, 1.05, 18), goldGlowMat);
  obsWindows.position.y = 17.75;
  tower.add(obsWindows);

  // 7. Observation Upper Roof Pod
  const obsTop = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 2.75, 1.15, 18), darkMetalMat);
  obsTop.position.y = 18.8;
  tower.add(obsTop);

  // 8. Upper Antenna Spire
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.48, 8.8, 10), darkMetalMat);
  spire.position.y = 23.6;
  tower.add(spire);

  // 9. Red Aviation Beacon at Summit Tip
  const beaconMesh = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), beaconMat);
  beaconMesh.position.y = 28.2;
  tower.add(beaconMesh);

  const towerHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xffd17a,
      transparent: true,
      opacity: 0.48,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    })
  );
  towerHalo.position.set(0, 17.8, 0);
  towerHalo.scale.set(16, 16, 1);
  tower.add(towerHalo);

  const beaconHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xff3d67,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    })
  );
  beaconHalo.position.set(0, 28.2, 0);
  beaconHalo.scale.set(4.5, 4.5, 1);
  tower.add(beaconHalo);

  namsanGroup.add(tower);

  // 3. Varied-Elevation Hillside Houses on Namsan (low riverside cottage -> upper slope 2-story homes)
  const sharedHouseMats = createSharedHouseMats();
  atmosphereRefs.nightWindowMats.push({ mat: sharedHouseMats.winMat, baseEmissive: 1.65, maxEmissive: 1.65, minEmissive: 0.14 });

  const houseSpecs = [
    { x: -18.0, z: -74.5, roofColor: 0x2558c4, wallColor: 0xd8cfc2, isBlueRoof: true, lit: true, stories: 1, heightScale: 1.0 },
    { x: -36.5, z: -85.0, roofColor: 0x9c4638, wallColor: 0xe6dccd, isBlueRoof: false, lit: true, stories: 2, heightScale: 1.38 },
    { x: -3.5, z: -67.5, roofColor: 0x4b5563, wallColor: 0xe2d8c8, isBlueRoof: false, lit: false, stories: 1, heightScale: 0.88 },
    { x: 34.5, z: -83.5, roofColor: 0x3b5954, wallColor: 0xe5dccb, isBlueRoof: false, lit: true, stories: 2, heightScale: 1.28 },
    { x: -51.0, z: -76.5, roofColor: 0x8c5a32, wallColor: 0xebe1d2, isBlueRoof: false, lit: false, stories: 1, heightScale: 1.08 }
  ];

  let blueHouseInfo = null;
  const namsanHousesInfo = [];
  houseSpecs.forEach((spec) => {
    const built = createNamsanHouse(spec.x, spec.z, spec, glowTexture, sharedHouseMats, atmosphereRefs);
    namsanGroup.add(built.houseGroup);
    namsanHousesInfo.push({
      x: spec.x,
      y: northLandElevation(spec.x, spec.z),
      z: spec.z,
      bodyH: built.bodyH,
      roofH: built.roofH,
      offsetX: built.offsetX,
      offsetZ: built.offsetZ,
      isBlueRoof: built.isBlueRoof
    });
    if (spec.isBlueRoof && built.villager) {
      blueHouseInfo = built.villager;
    }
  });

  // 4. Real 1960s Modernist Namsan Public Library (no hanok look, no signboard)
  const libraryGroup = createNamsanLibrary(20.0, -78.5, atmosphereRefs);
  namsanGroup.add(libraryGroup);

  return {
    namsanGroup,
    beaconMat,
    beaconHaloMat: beaconHalo.material,
    blueHouseInfo,
    landGeo,
    landBaseColorAttr: baseColorAttr,
    landSnowColorAttr: snowColorAttr,
    namsanHousesInfo,
    libraryPos: { x: 20.0, y: northLandElevation(20.0, -78.5), z: -78.5 },
    towerPlazaPos: { x: summitX, y: summitY, z: summitZ }
  };
}

export function createTerrainAndBay(scene, glowTexture, quality = { isMobile: false }) {
  const group = new THREE.Group();
  const isMobile = Boolean(quality?.isMobile);
  const atmosphereRefs = {
    nightWindowMats: [],
    nightHaloSprites: [],
    lampLights: [],
    starMat: null,
    moonMat: null,
    moonHaloMat: null,
    bldgMat: null,
    waterUniforms: null
  };

  // 1. Sculpted Grassy Nocturnal Hilltop (mobile-scaled grid)
  const hillSegs = isMobile ? 54 : 76;
  const geo = new THREE.PlaneGeometry(110, 110, hillSegs, hillSegs);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const hillSnowColors = new Float32Array(pos.count * 3);
  const cCrest = new THREE.Color('#1a2328');
  const cSlope = new THREE.Color('#13191e');
  const cPath = new THREE.Color('#2c2734');
  const cSnowCrest = new THREE.Color('#dce8f5');
  const cSnowSlope = new THREE.Color('#b8cbe0');
  const cSnowPath = new THREE.Color('#98a6bb');
  const tmpColor = new THREE.Color();
  const tmpSnow = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = groundHeightAt(x, z);
    pos.setY(i, y);

    const onLookoutPath = Math.exp(-Math.pow(x / 3.8, 2)) * smoothstep(-13.5, -2.0, z) * (1 - smoothstep(6.0, 12.0, z));
    const slopeT = smoothstep(1.0, 6.6, y);
    tmpColor.copy(cSlope).lerp(cCrest, slopeT);
    tmpColor.lerp(cPath, onLookoutPath * 0.55);

    tmpSnow.copy(cSnowSlope).lerp(cSnowCrest, slopeT);
    tmpSnow.lerp(cSnowPath, onLookoutPath * 0.45);

    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;

    hillSnowColors[i * 3] = tmpSnow.r;
    hillSnowColors[i * 3 + 1] = tmpSnow.g;
    hillSnowColors[i * 3 + 2] = tmpSnow.b;
  }

  const hillBaseColorAttr = new THREE.BufferAttribute(colors, 3);
  const hillSnowColorAttr = new THREE.BufferAttribute(hillSnowColors, 3);
  geo.setAttribute('color', hillBaseColorAttr);
  geo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.04
  });
  const terrainMesh = new THREE.Mesh(geo, terrainMat);
  terrainMesh.receiveShadow = true;
  group.add(terrainMesh);

  // 2. Animated Han River (adaptive Time-of-Day colors + ripples + lightweight mobile shader)
  const waterGeo = new THREE.PlaneGeometry(360, 76, isMobile ? 64 : 112, isMobile ? 16 : 26);
  waterGeo.rotateX(-Math.PI / 2);
  const waterUniforms = {
    uTime: { value: 0 },
    uWaterDeep: { value: new THREE.Color(0x061b3c) },
    uWaterMid: { value: new THREE.Color(0x0c2f59) },
    uSunColor: { value: new THREE.Color(0xf2e0a6) },
    uSunStrength: { value: 0.78 },
    uNightLights: { value: 1.0 }
  };
  atmosphereRefs.waterUniforms = waterUniforms;

  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0a2b52,
    roughness: 0.14,
    metalness: 0.18,
    envMapIntensity: 0.85
  });
  waterMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = waterUniforms.uTime;
    shader.uniforms.uWaterDeep = waterUniforms.uWaterDeep;
    shader.uniforms.uWaterMid = waterUniforms.uWaterMid;
    shader.uniforms.uSunColor = waterUniforms.uSunColor;
    shader.uniforms.uSunStrength = waterUniforms.uSunStrength;
    shader.uniforms.uNightLights = waterUniforms.uNightLights;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uTime;
        varying vec3 vWaterWorldPos;`
      )
      .replace(
        '#include <begin_vertex>',
        isMobile
          ? `#include <begin_vertex>
            vWaterWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
          : `#include <begin_vertex>
            vec4 wPosTmp = modelMatrix * vec4(transformed, 1.0);
            float swell1 = sin(wPosTmp.x * 0.24 + uTime * 1.35 + wPosTmp.z * 0.18) * 0.04;
            float swell2 = cos(wPosTmp.z * 0.42 - uTime * 1.1 + wPosTmp.x * 0.12) * 0.025;
            transformed.y += swell1 + swell2;
            vWaterWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uTime;
        uniform vec3 uWaterDeep;
        uniform vec3 uWaterMid;
        uniform vec3 uSunColor;
        uniform float uSunStrength;
        uniform float uNightLights;
        varying vec3 vWaterWorldPos;`
      )
      .replace(
        '#include <normal_fragment_maps>',
        isMobile
          ? `#include <normal_fragment_maps>
            float rx = vWaterWorldPos.x;
            float rz = vWaterWorldPos.z;
            float w1 = sin(rx * 0.55 - uTime * 1.6 + rz * 0.7) * 0.11;
            float w2 = cos(rx * 1.1 + uTime * 1.2 - rz * 1.3) * 0.07;
            normal = normalize(normal + vec3(w1, 0.0, w2));`
          : `#include <normal_fragment_maps>
            float rx = vWaterWorldPos.x;
            float rz = vWaterWorldPos.z;
            float w1 = sin(rx * 0.55 - uTime * 1.65 + rz * 0.7) * 0.12;
            float w2 = cos(rx * 1.15 + uTime * 1.25 - rz * 1.35) * 0.08;
            float w3 = sin(rx * 2.1 - uTime * 2.3 + sin(rz * 0.8) * 1.6) * 0.05;
            normal = normalize(normal + vec3(w1 + w2 * 0.5, 0.0, w2 + w3));`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float distCenter = clamp(abs(vWaterWorldPos.z + 41.5) / 19.0, 0.0, 1.0);
        float currentStreak = 0.5 + 0.5 * sin(vWaterWorldPos.x * 0.19 - uTime * 1.1 + vWaterWorldPos.z * 0.65);
        diffuseColor.rgb = mix(uWaterDeep, uWaterMid, currentStreak * 0.65);
        diffuseColor.rgb = mix(diffuseColor.rgb, uWaterMid * 1.18, smoothstep(0.68, 1.0, distCenter) * 0.42);`
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float fx = vWaterWorldPos.x;
        float fz = vWaterWorldPos.z;
        float rippleGlint = pow(max(0.0, sin(fx * 0.72 - uTime * 1.85 + fz * 1.85) * cos(fx * 1.35 + uTime * 1.3 - fz * 2.1)), 2.0);
        float moonCol = exp(-pow((fx + 38.0) / 8.5, 2.0));
        float towerCol = exp(-pow((fx - 2.0) / 8.0, 2.0));
        float villageCol = exp(-pow((fx + 18.0) / 6.5, 2.0)) + exp(-pow((fx - 20.0) / 8.0, 2.0));
        float skySheen = pow(0.5 + 0.5 * sin(fx * 0.45 - uTime * 1.4 + fz * 1.2), 4.0) * 0.14;
        vec3 celestialGlow = uSunColor * moonCol * uSunStrength * (0.28 + rippleGlint * 1.25);
        vec3 warmGlow = vec3(1.0, 0.72, 0.36) * uNightLights * (towerCol * 0.25 + villageCol * 0.2) * (0.28 + rippleGlint * 1.1);
        vec3 coolWaterGlow = uWaterMid * skySheen * 1.4;
        totalEmissiveRadiance += celestialGlow + warmGlow + coolWaterGlow;`
      );
  };
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.set(0, 0, -30.0);
  waterMesh.receiveShadow = !isMobile;
  group.add(waterMesh);

  // 3. Northern Shoreline, Wide Mount Namsan + N Seoul Tower, Modernist Library & Hillside Houses
  const {
    namsanGroup,
    beaconMat,
    beaconHaloMat,
    blueHouseInfo,
    landGeo,
    landBaseColorAttr,
    landSnowColorAttr,
    namsanHousesInfo,
    libraryPos,
    towerPlazaPos
  } = createNamsanAndTower(glowTexture, quality, atmosphereRefs);
  group.add(namsanGroup);

  // 4. Flanking Night Buildings seated firmly on dry northern riverbank land
  const buildingOffsets = [];
  for (let i = 0; i < (isMobile ? 6 : 8); i++) {
    buildingOffsets.push(-72 - i * 8.5 + (Math.random() - 0.5) * 2.5);
    buildingOffsets.push(74 + i * 8.5 + (Math.random() - 0.5) * 2.5);
  }
  const bldgGeo = new THREE.BoxGeometry(1, 1, 1);
  const facadeTex = createCityFacadeTexture();
  facadeTex.colorSpace = THREE.SRGBColorSpace;
  const bldgMat = new THREE.MeshStandardMaterial({
    color: 0x161b2e,
    emissive: 0xffffff,
    emissiveMap: facadeTex,
    emissiveIntensity: 0.78,
    roughness: 0.65,
    metalness: 0.25
  });
  atmosphereRefs.bldgMat = bldgMat;

  const buildings = new THREE.InstancedMesh(bldgGeo, bldgMat, buildingOffsets.length);
  const dummy = new THREE.Object3D();
  buildingOffsets.forEach((bx, idx) => {
    const bz = -68 - (idx % 3) * 14 - Math.random() * 8;
    const baseTerrainY = northLandElevation(bx, bz);
    const bw = 3.8 + Math.random() * 4.2;
    const bd = 3.8 + Math.random() * 4.2;
    const bh = 7 + Math.random() * 14;
    dummy.position.set(bx, baseTerrainY + bh * 0.5 - 0.25, bz);
    dummy.scale.set(bw, bh, bd);
    dummy.rotation.y = (Math.random() - 0.5) * 0.15;
    dummy.updateMatrix();
    buildings.setMatrixAt(idx, dummy.matrix);
  });
  buildings.instanceMatrix.needsUpdate = true;
  buildings.computeBoundingSphere();
  group.add(buildings);

  // 5. Celestial Moon & Halo (opacity adapts by Time-of-Day)
  const moonGroup = new THREE.Group();
  moonGroup.position.set(-38, 43, -104);
  const moonMat = new THREE.MeshBasicMaterial({ color: 0xfff5d6, transparent: true, opacity: 1.0, fog: false });
  atmosphereRefs.moonMat = moonMat;
  const moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(3.6, isMobile ? 20 : 22, isMobile ? 18 : 22),
    moonMat
  );
  moonGroup.add(moonMesh);

  const moonHaloMat = new THREE.SpriteMaterial({
    map: glowTexture,
    color: 0xffe4a0,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false
  });
  atmosphereRefs.moonHaloMat = moonHaloMat;
  const moonHalo = new THREE.Sprite(moonHaloMat);
  moonHalo.scale.set(21, 21, 1);
  moonGroup.add(moonHalo);
  group.add(moonGroup);

  // 6. Starfield Celestial Dome (Points)
  const starCount = isMobile ? 520 : 700;
  const starPos = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const sColor = new THREE.Color();

  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(0.08 + Math.random() * 0.92);
    const r = 132 + Math.random() * 18;
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi);
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    const tint = Math.random();
    if (tint < 0.35) sColor.setHex(0xffe9b0);
    else if (tint < 0.7) sColor.setHex(0xffffff);
    else sColor.setHex(0xc2dcff);

    starColors[i * 3] = sColor.r;
    starColors[i * 3 + 1] = sColor.g;
    starColors[i * 3 + 2] = sColor.b;
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
  const starMat = new THREE.PointsMaterial({
    size: 1.45,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    fog: false
  });
  atmosphereRefs.starMat = starMat;
  const starField = new THREE.Points(starGeo, starMat);
  group.add(starField);

  // 7. Instanced Pine Trees around outer slopes (northern cliff left wide open; full instanced density)
  const treeCoords = [];
  const totalTreeSamples = isMobile ? 30 : 36;
  for (let i = 0; i < totalTreeSamples; i++) {
    const angle = (i / totalTreeSamples) * Math.PI * 2;
    const dirZ = Math.sin(angle);
    const dirX = Math.cos(angle);
    if (dirZ < -0.25 && Math.abs(dirX) < 0.8) continue;

    const dist = 16.5 + (i % 4) * 3.8 + Math.random() * 2.2;
    const tx = dirX * dist;
    const tz = dirZ * dist + 1.5;
    const ty = groundHeightAt(tx, tz);
    if (ty > 1.2) {
      treeCoords.push({ x: tx, y: ty, z: tz, scale: 0.82 + Math.random() * 0.5 });
    }
  }

  if (treeCoords.length > 0) {
    const trunkGeo = new THREE.CylinderGeometry(0.14, 0.22, 1.4, 7);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3a261c, roughness: 0.9 });
    const foliageGeo = new THREE.ConeGeometry(1.15, 2.8, 8);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x162b22, roughness: 0.88 });

    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCoords.length);
    const lowerCones = new THREE.InstancedMesh(foliageGeo, foliageMat, treeCoords.length);
    const upperCones = new THREE.InstancedMesh(foliageGeo, foliageMat, treeCoords.length);
    trunks.castShadow = true;
    lowerCones.castShadow = true;
    upperCones.castShadow = true;

    treeCoords.forEach((t, idx) => {
      dummy.position.set(t.x, t.y + 0.65 * t.scale, t.z);
      dummy.scale.setScalar(t.scale);
      dummy.rotation.y = idx * 0.7;
      dummy.updateMatrix();
      trunks.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(t.x, t.y + 2.0 * t.scale, t.z);
      dummy.scale.set(t.scale, t.scale, t.scale);
      dummy.updateMatrix();
      lowerCones.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(t.x, t.y + 3.2 * t.scale, t.z);
      dummy.scale.set(t.scale * 0.72, t.scale * 0.82, t.scale * 0.72);
      dummy.updateMatrix();
      upperCones.setMatrixAt(idx, dummy.matrix);
    });

    trunks.instanceMatrix.needsUpdate = true;
    lowerCones.instanceMatrix.needsUpdate = true;
    upperCones.instanceMatrix.needsUpdate = true;
    trunks.computeBoundingSphere();
    lowerCones.computeBoundingSphere();
    upperCones.computeBoundingSphere();
    group.add(trunks, lowerCones, upperCones);
  }

  scene.add(group);
  return {
    starField,
    waterMesh,
    waterUniforms,
    atmosphereRefs,
    beaconMat,
    beaconHaloMat,
    blueHouseInfo,
    snowRefs: {
      hillGeo: geo,
      hillBaseColorAttr,
      hillSnowColorAttr,
      landGeo,
      landBaseColorAttr,
      landSnowColorAttr,
      treeCoords,
      namsanHousesInfo,
      libraryPos,
      towerPlazaPos
    }
  };
}

// Bosingak-Inspired Two-Tier Bell Pavilion (보신각 종각) with Interactive Bronze Bell, Striker Log & Bench
export function createHilltopPavilion(x, z, glowTexture) {
  const g = new THREE.Group();
  const baseY = groundHeightAt(x, z);
  g.position.set(x, baseY, z);

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x4f4a59, roughness: 0.85, metalness: 0.08 });
  const stepMat = new THREE.MeshStandardMaterial({ color: 0x625d6d, roughness: 0.82 });
  const redPillarMat = new THREE.MeshStandardMaterial({ color: 0x8d2b26, roughness: 0.68, metalness: 0.06 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x3b261b, roughness: 0.78 });
  const dancheongMat = new THREE.MeshStandardMaterial({ color: 0x265c4b, roughness: 0.72 });
  const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.35, metalness: 0.72 });
  const roofTileMat = new THREE.MeshStandardMaterial({ color: 0x232533, roughness: 0.62, metalness: 0.22 });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x221e2b, roughness: 0.45, metalness: 0.75 });
  const bronzeBellMat = new THREE.MeshStandardMaterial({
    color: 0x6b5a3c,
    emissive: 0x3a2810,
    emissiveIntensity: 0.22,
    roughness: 0.34,
    metalness: 0.78
  });

  // 1. Wide Granite Stone Plinth Base & Front/Back Steps (top floor at y = 0.28)
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.32, 5.0), stoneMat);
  plinth.position.y = 0.12;
  plinth.receiveShadow = true;
  g.add(plinth);

  [-2.68, 2.68].forEach((sz) => {
    const step = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 0.46), stepMat);
    step.position.set(0, 0.075, sz);
    step.receiveShadow = true;
    g.add(step);
  });

  // Stone Corner Pillar Plinths (주춧돌) & Raised Vermilion Pillars (주홍 기둥) to frame the large bell
  const plinthStoneGeo = new THREE.CylinderGeometry(0.18, 0.21, 0.14, 10);
  const pillarGeo = new THREE.CylinderGeometry(0.13, 0.145, 3.35, 10);
  [[-1.95, -1.95], [1.95, -1.95], [-1.95, 1.95], [1.95, 1.95]].forEach(([px, pz]) => {
    const baseStone = new THREE.Mesh(plinthStoneGeo, stepMat);
    baseStone.position.set(px, 0.34, pz);
    g.add(baseStone);

    const p = new THREE.Mesh(pillarGeo, redPillarMat);
    p.position.set(px, 2.02, pz);
    p.castShadow = true;
    g.add(p);
  });

  // Low Wooden Balustrade Rails around left/right edges (open front & back for walking)
  [-2.02, 2.02].forEach((rx) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 3.85), redPillarMat);
    rail.position.set(rx, 0.72, 0);
    g.add(rail);
    [-0.95, 0, 0.95].forEach((rz) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.46, 0.07), darkWoodMat);
      post.position.set(rx, 0.51, rz);
      g.add(post);
    });
  });

  // 2. First-Tier Dancheong Beam Frame + Flared Eaves Roof (1층 처마)
  const lowerBeam = new THREE.Mesh(new THREE.BoxGeometry(4.35, 0.26, 4.35), dancheongMat);
  lowerBeam.position.y = 3.68;
  lowerBeam.castShadow = true;
  g.add(lowerBeam);

  // Traditional Front Nameplate Plaque (현판 프레임)
  const plaqueFrame = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.36, 0.08), goldTrimMat);
  plaqueFrame.position.set(0, 3.5, -2.22);
  g.add(plaqueFrame);
  const plaqueBoard = new THREE.Mesh(new THREE.BoxGeometry(1.03, 0.26, 0.1), darkWoodMat);
  plaqueBoard.position.set(0, 3.5, -2.22);
  g.add(plaqueBoard);

  // Lower Flared Giwa Roof Skirt
  const lowerRoof = new THREE.Mesh(new THREE.CylinderGeometry(2.65, 4.05, 0.62, 4), roofTileMat);
  lowerRoof.position.y = 4.06;
  lowerRoof.rotation.y = Math.PI / 4;
  lowerRoof.castShadow = true;
  g.add(lowerRoof);

  // 3. Second-Tier Upper Story Neck & Main Curved Giwa Roof (2층 중층 팔작지붕 느낌)
  const upperBody = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.54, 3.2), redPillarMat);
  upperBody.position.y = 4.58;
  g.add(upperBody);

  const upperEaveTrim = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.16, 3.5), dancheongMat);
  upperEaveTrim.position.y = 4.88;
  g.add(upperEaveTrim);

  const upperRoof = new THREE.Mesh(new THREE.ConeGeometry(3.35, 1.32, 4), roofTileMat);
  upperRoof.position.y = 5.58;
  upperRoof.rotation.y = Math.PI / 4;
  upperRoof.castShadow = true;
  g.add(upperRoof);

  // Traditional Ridge Beam & Finials (용마루 & 취두)
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.14, 0.2), roofTileMat);
  ridge.position.y = 6.16;
  g.add(ridge);
  [-0.92, 0.92].forEach((fx) => {
    const finial = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.22), goldTrimMat);
    finial.position.set(fx, 6.23, 0);
    g.add(finial);
  });

  // 4. Heavy Overhead Bell Crossbeam + Iron Hanger + Grand Bosingak Bronze Bell (보신각 범종)
  const bellCrossbeam = new THREE.Mesh(new THREE.BoxGeometry(3.85, 0.2, 0.26), darkWoodMat);
  bellCrossbeam.position.set(0, 3.52, -0.1);
  g.add(bellCrossbeam);

  const bellHanger = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.46, 8), ironMat);
  bellHanger.position.set(-0.14, 3.29, -0.1);
  g.add(bellHanger);

  const bellPivot = new THREE.Group();
  bellPivot.position.set(-0.14, 2.98, -0.1);

  const yokeLoop = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.055, 8, 12), ironMat);
  yokeLoop.position.y = -0.11;
  bellPivot.add(yokeLoop);

  // Bell Crown Shoulder Dome (용뉴 아래 종 견부)
  const bellShoulder = new THREE.Mesh(
    new THREE.SphereGeometry(0.74, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
    bronzeBellMat
  );
  bellShoulder.scale.set(1, 0.45, 1);
  bellShoulder.position.y = -0.26;
  bellPivot.add(bellShoulder);

  const bellBody = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 1.02, 1.82, 24), bronzeBellMat);
  bellBody.position.y = -1.16;
  bellBody.castShadow = true;
  bellPivot.add(bellBody);

  const bellLip = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.082, 10, 24), bronzeBellMat);
  bellLip.rotation.x = Math.PI / 2;
  bellLip.position.y = -2.06;
  bellPivot.add(bellLip);

  [-0.45, -1.86].forEach((by, idx) => {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(idx === 0 ? 0.78 : 0.97, 0.028, 6, 24),
      goldTrimMat
    );
    band.rotation.x = Math.PI / 2;
    band.position.y = by;
    bellPivot.add(band);
  });

  // Striking Medallion (당좌) facing the wooden striker on +X side
  const dangjwa = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.055, 16), goldTrimMat);
  dangjwa.rotation.z = Math.PI / 2;
  dangjwa.position.set(0.94, -1.38, 0);
  bellPivot.add(dangjwa);

  g.add(bellPivot);

  // 5. Enlarged Suspended Horizontal Wooden Striking Log (당목) hung cleanly from the Crossbeam at matching Bell Strike Height
  const strikerPivot = new THREE.Group();
  strikerPivot.position.set(1.66, 3.42, -0.1);

  const strikerLog = new THREE.Mesh(new THREE.CylinderGeometry(0.128, 0.142, 1.46, 12), darkWoodMat);
  strikerLog.rotation.z = Math.PI / 2;
  strikerLog.position.set(-0.06, -1.82, 0);
  strikerLog.castShadow = true;
  strikerPivot.add(strikerLog);

  const strikerTip = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.11, 12), goldTrimMat);
  strikerTip.rotation.z = Math.PI / 2;
  strikerTip.position.set(-0.82, -1.82, 0);
  strikerPivot.add(strikerTip);

  [-0.5, 0.36].forEach((rx) => {
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.82, 6), ironMat);
    rope.position.set(rx, -0.91, 0);
    strikerPivot.add(rope);
  });

  g.add(strikerPivot);

  // Golden Resonance Halo, Expanding Soundwave Ring & Warm Lantern Light inside Bosingak
  const bellHaloMat = new THREE.SpriteMaterial({
    map: glowTexture,
    color: 0xffd166,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const bellHalo = new THREE.Sprite(bellHaloMat);
  bellHalo.position.set(-0.14, 1.79, -0.1);
  bellHalo.scale.set(3.7, 3.7, 1);
  g.add(bellHalo);

  const bellWaveMat = new THREE.MeshBasicMaterial({
    color: 0xffe08a,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const bellWaveRing = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.18, 28), bellWaveMat);
  bellWaveRing.rotation.x = -Math.PI / 2;
  bellWaveRing.position.set(-0.14, 0.92, -0.1);
  bellWaveRing.visible = false;
  g.add(bellWaveRing);

  const warmLight = new THREE.PointLight(0xffb85c, 2.6, 13, 1.6);
  warmLight.position.set(0, 2.45, 0);
  g.add(warmLight);

  g.userData.bellPivot = bellPivot;
  g.userData.strikerPivot = strikerPivot;
  g.userData.bellHalo = bellHalo;
  g.userData.bellHaloMat = bellHaloMat;
  g.userData.bellWaveRing = bellWaveRing;
  g.userData.bellWaveMat = bellWaveMat;
  g.userData.worldCenter = new THREE.Vector3(x, baseY + 2.15, z);

  return g;
}

// Richly Decorated Festive Christmas Tree + Wrapped Gift Boxes around the Base
export function createChristmasTree(x, z, glowTexture) {
  const g = new THREE.Group();
  const groundY = groundHeightAt(x, z);
  g.position.set(x, groundY, z);

  const potMat = new THREE.MeshStandardMaterial({ color: 0x5c2323, roughness: 0.65, metalness: 0.1 });
  const potTrimMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.85 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3b2419, roughness: 0.9 });
  const pineMat = new THREE.MeshStandardMaterial({ color: 0x154730, roughness: 0.82 });
  const snowPineMat = new THREE.MeshStandardMaterial({ color: 0x266347, roughness: 0.78 });
  const garlandMat = new THREE.MeshStandardMaterial({
    color: 0xf4cf6a,
    emissive: 0x9c7218,
    emissiveIntensity: 0.45,
    roughness: 0.28,
    metalness: 0.82
  });
  const starMat = new THREE.MeshStandardMaterial({
    color: 0xfff3b8,
    emissive: 0xffcc33,
    emissiveIntensity: 2.3,
    roughness: 0.2
  });

  // 1. Ornate Festive Tree Skirt / Planter with Brass Rim
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.62, 0.56, 14), potMat);
  base.position.y = 0.28;
  base.castShadow = true;
  g.add(base);

  const baseRim = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.045, 8, 20), potTrimMat);
  baseRim.rotation.x = Math.PI / 2;
  baseRim.position.y = 0.55;
  g.add(baseRim);

  // 2. Trunk
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 1.05, 8), trunkMat);
  trunk.position.y = 0.95;
  g.add(trunk);

  // 3. Five Lush Layered Evergreen Tiers
  const tiers = [
    { r: 1.85, h: 1.55, y: 1.65, seg: 14, mat: pineMat },
    { r: 1.56, h: 1.42, y: 2.45, seg: 14, mat: snowPineMat },
    { r: 1.24, h: 1.28, y: 3.22, seg: 14, mat: pineMat },
    { r: 0.92, h: 1.12, y: 3.94, seg: 12, mat: snowPineMat },
    { r: 0.58, h: 0.92, y: 4.58, seg: 12, mat: pineMat }
  ];
  tiers.forEach((t, idx) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(t.r, t.h, t.seg), t.mat);
    cone.position.y = t.y;
    cone.rotation.y = idx * 0.4;
    cone.castShadow = true;
    g.add(cone);
  });

  // 4. Coiled Golden Ribbon Garland around the Tree
  const spiralPts = [];
  const spiralSteps = 44;
  for (let i = 0; i <= spiralSteps; i++) {
    const t = i / spiralSteps;
    const angle = t * Math.PI * 2 * 3.6;
    const radius = THREE.MathUtils.lerp(1.66, 0.28, t);
    const py = 1.15 + t * 3.55;
    spiralPts.push(new THREE.Vector3(Math.cos(angle) * radius, py, Math.sin(angle) * radius));
  }
  const garlandCurve = new THREE.CatmullRomCurve3(spiralPts);
  const garlandMesh = new THREE.Mesh(new THREE.TubeGeometry(garlandCurve, 64, 0.045, 6, false), garlandMat);
  g.add(garlandMesh);

  // 5. Instanced Glowing Ornaments & Fairy Lights (56 bulbs)
  const bulbCount = 56;
  const orbGeo = new THREE.SphereGeometry(0.095, 8, 8);
  const orbMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 1.55,
    roughness: 0.2
  });
  const ornaments = new THREE.InstancedMesh(orbGeo, orbMat, bulbCount);
  const dummy = new THREE.Object3D();
  const orbColor = new THREE.Color();
  const palette = [0xffd166, 0xff4d6d, 0xfff5cc, 0x72efdd, 0xff9f1c];

  for (let i = 0; i < bulbCount; i++) {
    const t = i / (bulbCount - 1);
    const y = 1.05 + t * 3.65;
    const radiusAtY = THREE.MathUtils.lerp(1.68, 0.25, t);
    const angle = i * 1.18 + (i % 2) * 0.4;
    dummy.position.set(Math.cos(angle) * radiusAtY, y, Math.sin(angle) * radiusAtY);
    dummy.scale.setScalar(0.85 + (i % 3) * 0.22);
    dummy.updateMatrix();
    ornaments.setMatrixAt(i, dummy.matrix);

    orbColor.setHex(palette[i % palette.length]);
    ornaments.setColorAt(i, orbColor);
  }
  ornaments.instanceMatrix.needsUpdate = true;
  if (ornaments.instanceColor) ornaments.instanceColor.needsUpdate = true;
  ornaments.computeBoundingSphere();
  g.add(ornaments);

  // 6. Radiant Dual-Star Golden Topper + Halo + Warm Tree Light
  const starGroup = new THREE.Group();
  starGroup.position.y = 5.22;
  const starA = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), starMat);
  const starB = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), starMat);
  starB.rotation.set(Math.PI / 4, Math.PI / 4, 0);
  starGroup.add(starA, starB);
  g.add(starGroup);

  const topHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xffe28a,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  topHalo.position.y = 5.22;
  topHalo.scale.set(2.9, 2.9, 1);
  g.add(topHalo);

  const treeLight = new THREE.PointLight(0xffcb6b, 2.9, 12, 1.65);
  treeLight.position.set(0, 3.1, 0);
  g.add(treeLight);

  // 7. Five Wrapped Gift Boxes with Satin Ribbons & Top Bows around the Base
  const gifts = [
    { px: -1.15, pz: 0.65, w: 0.58, h: 0.44, d: 0.54, box: 0xc93b4b, ribbon: 0xf4cf6a, rot: 0.32 },
    { px: 1.08, pz: 0.72, w: 0.66, h: 0.36, d: 0.48, box: 0x2c6e91, ribbon: 0xfff0c2, rot: -0.42 },
    { px: -0.45, pz: 1.24, w: 0.44, h: 0.52, d: 0.44, box: 0xd99b26, ribbon: 0xa61c3c, rot: 0.14 },
    { px: 0.52, pz: -1.18, w: 0.54, h: 0.4, d: 0.52, box: 0x6f428a, ribbon: 0xffd166, rot: 0.55 },
    { px: -1.25, pz: -0.62, w: 0.46, h: 0.34, d: 0.46, box: 0x2c7855, ribbon: 0xffb3c1, rot: -0.22 }
  ];

  gifts.forEach((gift) => {
    const giftGroup = new THREE.Group();
    const localGroundOffset = groundHeightAt(x + gift.px, z + gift.pz) - groundY;
    giftGroup.position.set(gift.px, localGroundOffset, gift.pz);
    giftGroup.rotation.y = gift.rot;

    const boxMat = new THREE.MeshStandardMaterial({ color: gift.box, roughness: 0.62 });
    const ribMat = new THREE.MeshStandardMaterial({ color: gift.ribbon, roughness: 0.3, metalness: 0.45 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(gift.w, gift.h, gift.d), boxMat);
    body.position.y = gift.h * 0.5;
    body.castShadow = true;
    giftGroup.add(body);

    const ribX = new THREE.Mesh(new THREE.BoxGeometry(gift.w + 0.02, gift.h + 0.02, 0.08), ribMat);
    ribX.position.y = gift.h * 0.5;
    giftGroup.add(ribX);

    const ribZ = new THREE.Mesh(new THREE.BoxGeometry(0.08, gift.h + 0.02, gift.d + 0.02), ribMat);
    ribZ.position.y = gift.h * 0.5;
    giftGroup.add(ribZ);

    const bowLoopA = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.024, 6, 12), ribMat);
    bowLoopA.position.set(-0.06, gift.h + 0.05, 0);
    bowLoopA.rotation.y = 0.4;
    const bowLoopB = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.024, 6, 12), ribMat);
    bowLoopB.position.set(0.06, gift.h + 0.05, 0);
    bowLoopB.rotation.y = -0.4;
    giftGroup.add(bowLoopA, bowLoopB);

    g.add(giftGroup);
  });

  g.userData.starGroup = starGroup;
  return g;
}

// Cozy Winter Puppy Sitting by the Bench Watching Namsan Tower & Fireworks (11 parts)
export function createSittingDog(x, z, yaw = Math.PI) {
  const g = new THREE.Group();
  g.position.set(x, groundHeightAt(x, z), z);
  g.rotation.y = yaw;

  const furMainMat = new THREE.MeshStandardMaterial({ color: 0xe2a856, roughness: 0.84 });
  const furBellyMat = new THREE.MeshStandardMaterial({ color: 0xfaead0, roughness: 0.88 });
  const scarfMat = new THREE.MeshStandardMaterial({ color: 0xc93b4b, roughness: 0.78 });
  const darkFeatureMat = new THREE.MeshStandardMaterial({ color: 0x18131c, roughness: 0.25 });

  // 1. Seated Haunches (hips resting on hill)
  const hips = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), furMainMat);
  hips.scale.set(0.95, 0.85, 1.12);
  hips.position.set(0, 0.21, -0.14);
  hips.castShadow = true;
  g.add(hips);

  // 2. Upright Chest Torso
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.42, 12), furMainMat);
  chest.position.set(0, 0.36, 0.04);
  chest.rotation.x = 0.24;
  chest.castShadow = true;
  g.add(chest);

  // Cream chest tuft
  const bellyPatch = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), furBellyMat);
  bellyPatch.scale.set(0.75, 1.15, 0.7);
  bellyPatch.position.set(0, 0.35, 0.14);
  g.add(bellyPatch);

  // 3-4. Front Legs + Paws planted forward
  [-0.1, 0.1].forEach((lx) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.042, 0.34, 8), furMainMat);
    leg.position.set(lx, 0.17, 0.16);
    leg.castShadow = true;
    g.add(leg);

    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.052, 8, 8), furBellyMat);
    paw.scale.set(0.9, 0.65, 1.2);
    paw.position.set(lx, 0.035, 0.2);
    g.add(paw);
  });

  // 5. Cozy Red Winter Collar fitted outside neck + tiny Gold Collar Bell (zero clipping!)
  const collarGoldMat = new THREE.MeshStandardMaterial({ color: 0xf4cf6b, roughness: 0.25, metalness: 0.85 });
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.174, 0.038, 8, 18), scarfMat);
  scarf.rotation.x = Math.PI / 2 + 0.24;
  scarf.position.set(0, 0.565, 0.092);
  g.add(scarf);

  const collarBell = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), collarGoldMat);
  collarBell.position.set(0, 0.495, 0.268);
  g.add(collarBell);

  // 6. Head Pivot (gently looking slightly up toward Namsan & Fireworks!)
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.68, 0.12);
  headPivot.rotation.x = -0.2;

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), furMainMat);
  headPivot.add(skull);

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.088, 10, 10), furBellyMat);
  muzzle.scale.set(0.95, 0.8, 1.15);
  muzzle.position.set(0, -0.04, 0.14);
  headPivot.add(muzzle);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), darkFeatureMat);
  nose.position.set(0, -0.015, 0.23);
  headPivot.add(nose);

  [-0.068, 0.068].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), darkFeatureMat);
    eye.position.set(ex, 0.045, 0.15);
    headPivot.add(eye);
  });

  // Perky Triangular Ears
  [-0.1, 0.1].forEach((ex, idx) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 4), furMainMat);
    ear.position.set(ex, 0.17, -0.01);
    ear.rotation.z = idx === 0 ? 0.25 : -0.25;
    ear.rotation.y = 0.2;
    headPivot.add(ear);
  });

  g.add(headPivot);

  // 7. Curled Fluffy Tail Pivot (wags softly in animation loop)
  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0.25, -0.34);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.055, 0.26, 8), furMainMat);
  tail.position.set(0, 0.1, -0.04);
  tail.rotation.x = -0.55;
  tailPivot.add(tail);
  g.add(tailPivot);

  g.userData.headPivot = headPivot;
  g.userData.tailPivot = tailPivot;
  return g;
}

// Multi-part Antique Brass Lantern Post (4 parts + optional PointLight)
export function createLanternPost(x, z, glowTexture, withLight = true) {
  const g = new THREE.Group();
  g.position.set(x, groundHeightAt(x, z), z);

  const ironMat = new THREE.MeshStandardMaterial({ color: 0x262131, roughness: 0.45, metalness: 0.72 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xc9a33c, roughness: 0.35, metalness: 0.82 });
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff0c2,
    emissive: 0xffbe55,
    emissiveIntensity: 1.8,
    roughness: 0.2
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.4, 10), ironMat);
  base.position.y = 0.2;
  base.castShadow = true;
  g.add(base);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.085, 2.5, 10), ironMat);
  pole.position.y = 1.65;
  pole.castShadow = true;
  g.add(pole);

  const lanternHead = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.38, 6), bulbMat);
  lanternHead.position.y = 3.05;
  g.add(lanternHead);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.22, 6), brassMat);
  cap.position.y = 3.34;
  g.add(cap);

  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xffcb74,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  halo.position.y = 3.05;
  halo.scale.set(2.2, 2.2, 1);
  g.add(halo);

  if (withLight) {
    const pt = new THREE.PointLight(0xffb85c, 1.8, 10, 1.8);
    pt.position.y = 3.0;
    g.add(pt);
  }

  return g;
}

// Multi-part Wooden Bench (5 parts)
export function createParkBench(x, z, yaw = 0) {
  const g = new THREE.Group();
  g.position.set(x, groundHeightAt(x, z), z);
  g.rotation.y = yaw;

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3b28, roughness: 0.78 });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x221e2b, roughness: 0.5, metalness: 0.7 });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.58), woodMat);
  seat.position.set(0, 0.45, 0);
  seat.castShadow = true;
  g.add(seat);

  const backrest = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.42, 0.07), woodMat);
  backrest.position.set(0, 0.78, 0.25);
  backrest.rotation.x = -0.14;
  backrest.castShadow = true;
  g.add(backrest);

  [-0.78, 0.78].forEach((lx) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.46, 0.52), ironMat);
    leg.position.set(lx, 0.23, 0);
    leg.castShadow = true;
    g.add(leg);
  });

  const bar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.05), ironMat);
  bar.position.set(0, 0.2, 0);
  g.add(bar);

  return g;
}

// Wooden Cliff Lookout Railing Fence
export function createCliffRailing() {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x4c3224, roughness: 0.82 });
  const postGeo = new THREE.CylinderGeometry(0.06, 0.075, 1.05, 8);

  const points = [];
  for (let x = -14; x <= 14; x += 2.8) {
    const z = -11.9 - Math.cos(x * 0.1) * 0.6;
    const y = groundHeightAt(x, z);
    points.push(new THREE.Vector3(x, y, z));

    const post = new THREE.Mesh(postGeo, woodMat);
    post.position.set(x, y + 0.5, z);
    post.castShadow = true;
    g.add(post);
  }

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dist = a.distanceTo(b);
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    const angleY = Math.atan2(b.x - a.x, b.z - a.z);

    [0.48, 0.88].forEach((offsetY) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.065, dist), woodMat);
      rail.position.set(mid.x, mid.y + offsetY, mid.z);
      rail.rotation.y = angleY;
      rail.castShadow = true;
      g.add(rail);
    });
  }

  return g;
}

// Striped Canvas Awning Texture for the Hilltop Bungeoppang Cart
function createAwningTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const stripes = 6;
  const sw = 128 / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#b9313d' : '#f7ebd2';
    ctx.fillRect(i * sw, 0, sw + 1, 64);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Detailed Fish-Shaped Bungeoppang Pastry (cute eyeless silhouette shared across stall & hand)
function createBungeoppangFishMesh(pastryMat, scale = 1) {
  const fish = new THREE.Group();
  fish.scale.setScalar(scale);

  // Plump oval fish torso
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 8), pastryMat);
  body.scale.set(0.74, 1.05, 1.48);
  fish.add(body);

  // Forked fan tail fin
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.056, 0.095, 4), pastryMat);
  tail.rotation.x = Math.PI / 2;
  tail.scale.set(0.42, 1.0, 1.15);
  tail.position.set(0, 0.004, -0.108);
  fish.add(tail);

  // Small top dorsal fin ridge
  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.06, 4), pastryMat);
  dorsal.scale.set(0.35, 0.9, 1.4);
  dorsal.position.set(0, 0.072, -0.008);
  fish.add(dorsal);

  return fish;
}

// Cozy Left-Hill Bungeoppang Street Cart (붕어빵 포장마차 + 사장님 + 물고기 붕어빵 + rising warm steam)
export function createBungeoppangStall(x, z, glowTexture, withLight = true) {
  const g = new THREE.Group();
  const groundY = groundHeightAt(x, z);
  g.position.set(x, groundY, z);
  g.rotation.y = 0.62;

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b422a, roughness: 0.8 });
  const counterMat = new THREE.MeshStandardMaterial({ color: 0xc29768, roughness: 0.65 });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x222029, roughness: 0.45, metalness: 0.7 });
  const awningMat = new THREE.MeshStandardMaterial({ map: createAwningTexture(), roughness: 0.85 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d4,
    emissive: 0xffb347,
    emissiveIntensity: 0.55,
    transparent: true,
    opacity: 0.46,
    roughness: 0.15
  });
  const redbeanPastryMat = new THREE.MeshStandardMaterial({ color: 0xcf823a, roughness: 0.62 });
  const custardPastryMat = new THREE.MeshStandardMaterial({ color: 0xf3c363, roughness: 0.62 });
  const pastryEyeMat = new THREE.MeshStandardMaterial({ color: 0x5c3014, roughness: 0.7 });
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff5cc,
    emissive: 0xffc857,
    emissiveIntensity: 2.0,
    roughness: 0.2
  });

  // 1. Cart Lower Body & Two Wheels
  const cartBody = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.92, 1.15), woodMat);
  cartBody.position.set(0, 0.62, 0);
  cartBody.castShadow = true;
  g.add(cartBody);

  [-0.95, 0.95].forEach((wx) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.12, 12), ironMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.28, 0);
    g.add(wheel);
  });

  // 2. Countertop + Cast-Iron Bungeoppang Griddle with baking fish (darker red-bean & lighter custard)
  const counter = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.1, 1.32), counterMat);
  counter.position.set(0, 1.12, 0.04);
  g.add(counter);

  const griddle = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.12, 0.66), ironMat);
  griddle.position.set(-0.55, 1.22, 0.05);
  g.add(griddle);

  // Two fish baking right on top of the cast-iron griddle
  [-0.72, -0.38].forEach((gx, idx) => {
    const bakingFish = createBungeoppangFishMesh(idx === 0 ? redbeanPastryMat : custardPastryMat, 1.05);
    bakingFish.rotation.y = idx === 0 ? 0.25 : -0.25;
    bakingFish.rotation.z = Math.PI / 2;
    bakingFish.position.set(gx, 1.31, 0.05);
    g.add(bakingFish);
  });

  // 3. Glass Warmer Showcase + Detailed Fish-Shaped Bungeoppang Inside (red-bean darker vs custard lighter)
  const showcase = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.46, 0.64), glassMat);
  showcase.position.set(0.55, 1.4, 0.05);
  g.add(showcase);

  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.04, 0.54), counterMat);
  tray.position.set(0.55, 1.19, 0.05);
  g.add(tray);

  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.03, 0.52), counterMat);
  shelf.position.set(0.55, 1.41, 0.05);
  g.add(shelf);

  const displaySpots = [
    [0.34, 1.27, 0.12, 0.22],
    [0.56, 1.27, 0.02, -0.18],
    [0.76, 1.27, 0.14, 0.3],
    [0.36, 1.48, 0.04, -0.24],
    [0.57, 1.48, 0.12, 0.15],
    [0.75, 1.48, 0.02, -0.1]
  ];
  displaySpots.forEach(([fx, fy, fz, rotY], idx) => {
    const fish = createBungeoppangFishMesh(idx < 3 ? redbeanPastryMat : custardPastryMat, 1.12);
    fish.position.set(fx, fy, fz);
    fish.rotation.y = rotY;
    fish.rotation.z = Math.PI / 2;
    g.add(fish);
  });

  // 4. Full-Height Friendly Shopkeeper Standing Beside the Cart (inviting & looking around)
  const localVx = 1.88;
  const localVz = 0.42;
  const cosR = Math.cos(g.rotation.y);
  const sinR = Math.sin(g.rotation.y);
  const worldVx = x + localVx * cosR + localVz * sinR;
  const worldVz = z - localVx * sinR + localVz * cosR;
  const vendorYOffset = groundHeightAt(worldVx, worldVz) - groundY;

  const vendor = new THREE.Group();
  vendor.position.set(localVx, vendorYOffset, localVz);
  vendor.rotation.y = 0.28;

  const vendorBody = new THREE.Group();
  vendor.add(vendorBody);

  const vBootsMat = new THREE.MeshStandardMaterial({ color: 0x201a24, roughness: 0.78 });
  const vCoatMat = new THREE.MeshStandardMaterial({ color: 0x214a35, roughness: 0.76 });
  const vScarfMat = new THREE.MeshStandardMaterial({ color: 0xf4e4c1, roughness: 0.84 });
  const vSkinMat = new THREE.MeshStandardMaterial({ color: 0xf6d5be, roughness: 0.65 });
  const vCapMat = new THREE.MeshStandardMaterial({ color: 0x7c2530, roughness: 0.78 });
  const vBagMat = new THREE.MeshStandardMaterial({ color: 0xd6a468, roughness: 0.88 });
  const vBagFoldMat = new THREE.MeshStandardMaterial({ color: 0xb98349, roughness: 0.9 });

  [-0.12, 0.12].forEach((lx) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.062, 0.48, 8), vBootsMat);
    leg.position.set(lx, 0.24, 0);
    vendorBody.add(leg);
  });

  const vTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.7, 12), vCoatMat);
  vTorso.position.y = 0.79;
  vTorso.castShadow = true;
  vendorBody.add(vTorso);

  const vScarf = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.055, 8, 16), vScarfMat);
  vScarf.rotation.x = Math.PI / 2;
  vScarf.position.y = 1.15;
  vendorBody.add(vScarf);

  const vHeadGroup = new THREE.Group();
  vHeadGroup.position.set(0, 1.34, 0);
  const vHead = new THREE.Mesh(new THREE.SphereGeometry(0.185, 14, 12), vSkinMat);
  vHeadGroup.add(vHead);

  [-0.065, 0.065].forEach((ex) => {
    const vEye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), pastryEyeMat);
    vEye.position.set(ex, 0.02, 0.168);
    vHeadGroup.add(vEye);
  });

  // Baseball cap (캡 모자) for Manbok
  const vCapGroup = new THREE.Group();
  vCapGroup.position.set(0, 0.036, 0);
  vCapGroup.rotation.x = -0.1;
  const vCapCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.193, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52),
    vCapMat
  );
  vCapGroup.add(vCapCrown);
  const vCapButton = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), vCapMat);
  vCapButton.scale.set(1, 0.55, 1);
  vCapButton.position.y = 0.194;
  vCapGroup.add(vCapButton);
  const vCapVisor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.155, 0.165, 0.022, 14, 1, false, -Math.PI * 0.42, Math.PI * 0.84),
    vCapMat
  );
  vCapVisor.scale.set(1.04, 1, 1.38);
  vCapVisor.position.set(0, 0.028, 0.12);
  vCapVisor.rotation.x = 0.14;
  vCapGroup.add(vCapVisor);
  vHeadGroup.add(vCapGroup);
  vendorBody.add(vHeadGroup);

  // Left arm + bare round skin-colored hand holding a small kraft paper bag
  const vendorLeftArm = new THREE.Group();
  vendorLeftArm.position.set(-0.25, 1.04, 0.06);
  const vLeftSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.054, 0.36, 8), vCoatMat);
  vLeftSleeve.position.set(-0.04, -0.15, 0.06);
  vLeftSleeve.rotation.x = -0.38;
  vLeftSleeve.rotation.z = -0.12;
  vendorLeftArm.add(vLeftSleeve);

  const vLeftHand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), vSkinMat);
  vLeftHand.position.set(-0.065, -0.33, 0.138);
  vendorLeftArm.add(vLeftHand);

  const paperBag = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.25, 0.11), vBagMat);
  paperBag.position.set(-0.07, -0.46, 0.165);
  paperBag.rotation.z = 0.06;
  vendorLeftArm.add(paperBag);

  const paperBagTop = new THREE.Mesh(new THREE.BoxGeometry(0.186, 0.024, 0.116), vBagFoldMat);
  paperBagTop.position.set(-0.076, -0.34, 0.165);
  paperBagTop.rotation.z = 0.06;
  vendorLeftArm.add(paperBagTop);
  vendorBody.add(vendorLeftArm);

  // Right arm + bare round skin-colored hand outstretched in a friendly beckoning gesture
  const vendorRightArmPivot = new THREE.Group();
  vendorRightArmPivot.position.set(0.26, 1.05, 0.08);
  const vRightSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.054, 0.36, 8), vCoatMat);
  vRightSleeve.position.set(0.05, -0.07, 0.15);
  vRightSleeve.rotation.x = -1.15;
  vRightSleeve.rotation.z = 0.18;
  vendorRightArmPivot.add(vRightSleeve);

  const vRightHand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), vSkinMat);
  vRightHand.position.set(0.086, -0.148, 0.325);
  vendorRightArmPivot.add(vRightHand);
  vendorBody.add(vendorRightArmPivot);

  g.add(vendor);

  // 5. Four Canopy Poles & Striped Awning Roof
  [[-1.12, -0.52], [1.12, -0.52], [-1.12, 0.52], [1.12, 0.52]].forEach(([px, pz]) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 1.35, 6), ironMat);
    pole.position.set(px, 1.78, pz);
    g.add(pole);
  });

  const awning = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.14, 1.65), awningMat);
  awning.position.set(0, 2.48, 0.06);
  awning.rotation.x = 0.08;
  awning.castShadow = true;
  g.add(awning);

  // 6. Hanging Warm Edison Bulb + Glow Halo + Subtle Rising Steam Sprites
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), bulbMat);
  bulb.position.set(0, 2.22, 0.56);
  g.add(bulb);

  const haloMat = new THREE.SpriteMaterial({
    map: glowTexture,
    color: 0xffc866,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const halo = new THREE.Sprite(haloMat);
  halo.position.set(0, 2.12, 0.56);
  halo.scale.set(2.4, 2.4, 1);
  g.add(halo);

  if (withLight) {
    const pt = new THREE.PointLight(0xffb454, 1.8, 9, 1.8);
    pt.position.set(0, 2.05, 0.65);
    g.add(pt);
    g.userData.stallLight = pt;
  }

  // Subtle upward drifting warm steam particles above the griddle
  const steams = [];
  for (let i = 0; i < 3; i++) {
    const sm = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: 0xfff6e0,
        transparent: true,
        opacity: 0.28,
        depthWrite: false
      })
    );
    sm.position.set(-0.55 + (i - 1) * 0.16, 1.38 + i * 0.22, 0.05);
    sm.scale.set(0.32, 0.32, 1);
    g.add(sm);
    steams.push({ sprite: sm, phase: i * 2.1 });
  }

  g.userData.steams = steams;
  g.userData.haloMat = haloMat;
  g.userData.vendor = vendor;
  g.userData.vendorBody = vendorBody;
  g.userData.vendorRightArm = vendorRightArmPivot;
  g.userData.vendorHead = vHeadGroup;
  g.userData.vendorWorldPos = new THREE.Vector3(worldVx, groundY + vendorYOffset, worldVz);
  g.userData.worldCenter = new THREE.Vector3(x, groundY + 1.4, z);
  return g;
}

// Multi-part Stylized Winter Visitor Avatar (standing, walking, bench sitting, dancing & eating Bungeoppang!)
export function createVisitorAvatar({ coatColor = '#c94c4c', lanternColor = '#ffd166', isSelf = false }, glowTexture) {
  const g = new THREE.Group();
  const bodyGroup = new THREE.Group();
  g.add(bodyGroup);

  const bootMat = new THREE.MeshStandardMaterial({ color: 0x1e1824, roughness: 0.7 });
  const coatMat = new THREE.MeshStandardMaterial({ color: coatColor, roughness: 0.72, metalness: 0.05 });
  const scarfMat = new THREE.MeshStandardMaterial({ color: 0xf4e4c1, roughness: 0.85 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf6d5be, roughness: 0.65 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x241714, roughness: 0.45 });
  const hatMat = new THREE.MeshStandardMaterial({ color: 0x2c2240, roughness: 0.82 });

  // Left & Right Legs + Boots
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.12, 0.44, 0);
  const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.42, 8), bootMat);
  leftLeg.position.y = -0.21;
  leftLegPivot.add(leftLeg);
  bodyGroup.add(leftLegPivot);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.12, 0.44, 0);
  const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.42, 8), bootMat);
  rightLeg.position.y = -0.21;
  rightLegPivot.add(rightLeg);
  bodyGroup.add(rightLegPivot);

  // Coat Torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.27, 0.68, 12), coatMat);
  torso.position.y = 0.76;
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Cozy Scarf Ring
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.055, 8, 16), scarfMat);
  scarf.rotation.x = Math.PI / 2;
  scarf.position.y = 1.1;
  bodyGroup.add(scarf);

  // Head + Cute Dark Eyes (matching vendor)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 14), skinMat);
  head.position.y = 1.29;
  head.castShadow = true;
  bodyGroup.add(head);

  [-0.062, 0.062].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), eyeMat);
    eye.position.set(ex, 1.305, 0.162);
    bodyGroup.add(eye);
  });

  // Winter Beanie & Pompom
  const beanie = new THREE.Mesh(
    new THREE.SphereGeometry(0.188, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.56),
    hatMat
  );
  beanie.position.y = 1.32;
  beanie.rotation.x = -0.15;
  bodyGroup.add(beanie);

  const pom = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), scarfMat);
  pom.position.set(0, 1.52, -0.04);
  bodyGroup.add(pom);

  // Right Arm + Round Skin-Colored Hand + Miniature Wish Lantern (풍등)
  const armGroup = new THREE.Group();
  armGroup.position.set(0.24, 1.0, 0.08);
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.34, 8), coatMat);
  sleeve.rotation.z = 0.25;
  sleeve.rotation.x = -0.5;
  sleeve.position.set(0.04, -0.13, 0.08);
  armGroup.add(sleeve);

  const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.052, 8, 8), skinMat);
  rightHand.position.set(0.082, -0.274, 0.162);
  armGroup.add(rightHand);

  const lanternCord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.005, 0.075, 5),
    new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 })
  );
  lanternCord.position.set(0.084, -0.31, 0.175);
  armGroup.add(lanternCord);

  const heldLantern = createWishLanternMesh(lanternColor, glowTexture);
  heldLantern.scale.setScalar(0.42);
  heldLantern.position.set(0.086, -0.41, 0.185);
  armGroup.add(heldLantern);
  bodyGroup.add(armGroup);

  // Left Arm + Round Skin-Colored Hand + Held Warm Bungeoppang Pastry (visible while eating!)
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.24, 1.0, 0.06);
  const leftSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.052, 0.34, 8), coatMat);
  leftSleeve.position.set(-0.025, -0.15, 0.02);
  leftSleeve.rotation.z = -0.15;
  leftArmPivot.add(leftSleeve);

  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.052, 8, 8), skinMat);
  leftHand.position.set(-0.05, -0.32, 0.02);
  leftArmPivot.add(leftHand);

  const fishPastryMat = new THREE.MeshStandardMaterial({ color: 0xde892d, roughness: 0.65 });
  const bungeoppangGroup = createBungeoppangFishMesh(fishPastryMat, 1.0);
  bungeoppangGroup.position.set(-0.05, -0.33, 0.12);
  bungeoppangGroup.visible = false;
  leftArmPivot.add(bungeoppangGroup);

  bodyGroup.add(leftArmPivot);

  // Subtle golden ground ring on self so user easily tracks their position
  if (isSelf) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.34, 0.4, 24),
      new THREE.MeshBasicMaterial({
        color: 0xf3cf7a,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    g.add(ring);
  }

  g.userData = {
    bodyGroup,
    leftLegPivot,
    rightLegPivot,
    armGroup,
    leftArmPivot,
    bungeoppangGroup,
    fishPastryMat,
    coatMat,
    lanternGlowMat: heldLantern.userData.shellMat,
    lanternHaloMat: heldLantern.userData.haloMat,
    walkPhase: Math.random() * Math.PI * 2
  };

  return g;
}

// Floating Sky Wish Lantern (풍등)
export function createWishLanternMesh(colorHex = '#ffd166', glowTexture) {
  const g = new THREE.Group();

  const shellMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 1.45,
    roughness: 0.45,
    transparent: true,
    opacity: 0.92
  });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.16, 0.44, 8), shellMat);
  g.add(body);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.015, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = -0.22;
  g.add(rim);

  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: colorHex,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  halo.scale.set(1.5, 1.5, 1);
  g.add(halo);

  g.userData.shellMat = shellMat;
  g.userData.haloMat = halo.material;
  return g;
}

// ===================================================================
// 풍등 모드 전용: 나무 풍등 걸이 (Tree/Post Lantern Rack, Emissive Only)
// ===================================================================
export function createLanternRack(glowTexture) {
  const g = new THREE.Group();
  const ax = -12.4;
  const az = 7.4;
  const bx = -8.6;
  const bz = 11.2;
  const ay = groundHeightAt(ax, az);
  const by = groundHeightAt(bx, bz);

  const timberMat = new THREE.MeshStandardMaterial({ color: 0x4b3123, roughness: 0.85 });
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0x6b4c35, roughness: 0.9 });
  const warmColors = [0xffbe55, 0xffd166, 0xff9f1c, 0xffe082, 0xffb347];

  const postGeo = new THREE.CylinderGeometry(0.085, 0.12, 3.05, 8);
  const crossTopGeo = new THREE.BoxGeometry(0.45, 0.1, 0.14);

  [[ax, ay, az], [bx, by, bz]].forEach(([px, py, pz]) => {
    const post = new THREE.Mesh(postGeo, timberMat);
    post.position.set(px, py + 1.48, pz);
    post.castShadow = true;
    g.add(post);

    const cap = new THREE.Mesh(crossTopGeo, timberMat);
    cap.position.set(px, py + 2.95, pz);
    cap.rotation.y = Math.atan2(bx - ax, bz - az);
    g.add(cap);
  });

  const ropePts = [];
  const steps = 16;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const sag = Math.sin(t * Math.PI) * 0.42;
    const rx = THREE.MathUtils.lerp(ax, bx, t);
    const ry = THREE.MathUtils.lerp(ay + 2.9, by + 2.9, t) - sag;
    const rz = THREE.MathUtils.lerp(az, bz, t);
    ropePts.push(new THREE.Vector3(rx, ry, rz));
  }
  const curve = new THREE.CatmullRomCurve3(ropePts);
  const ropeMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.022, 6, false), ropeMat);
  g.add(ropeMesh);

  const lanterns = [];
  const lanternBodyGeo = new THREE.CylinderGeometry(0.14, 0.1, 0.28, 8);
  const lanternRimGeo = new THREE.TorusGeometry(0.1, 0.012, 6, 10);
  const cordGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.24, 5);

  for (let i = 0; i < 5; i++) {
    const t = (i + 1) / 6;
    const anchor = curve.getPoint(t);
    const pivot = new THREE.Group();
    pivot.position.copy(anchor);

    const cord = new THREE.Mesh(cordGeo, ropeMat);
    cord.position.y = -0.12;
    pivot.add(cord);

    const col = warmColors[i % warmColors.length];
    const shellMat = new THREE.MeshStandardMaterial({
      color: col,
      emissive: col,
      emissiveIntensity: 1.45,
      roughness: 0.42,
      transparent: true,
      opacity: 0.94
    });

    const body = new THREE.Mesh(lanternBodyGeo, shellMat);
    body.position.y = -0.35;
    pivot.add(body);

    const rim = new THREE.Mesh(lanternRimGeo, ropeMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = -0.49;
    pivot.add(rim);

    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: col,
        transparent: true,
        opacity: 0.56,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    halo.position.y = -0.35;
    halo.scale.set(0.95, 0.95, 1);
    pivot.add(halo);

    g.add(pivot);
    lanterns.push({ pivot, shellMat, haloMat: halo.material, phase: i * 1.15 });
  }

  g.userData.lanterns = lanterns;
  return g;
}

// ===================================================================
// 설경 모드: THREE.Points 눈 내림 + 주요 오브젝트 눈 덮임 + 눈사람
// ===================================================================
function createSnowFlakeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.55, 'rgba(232, 244, 255, 0.85)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 32);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createSnowEnvironment(
  scene,
  snowRefs,
  benchSpecs,
  pavilionPos,
  stallPos,
  treePos,
  quality = { isMobile: false }
) {
  const isMobile = Boolean(quality?.isMobile);
  const snowRoot = new THREE.Group();
  snowRoot.visible = false;

  const snowMat = new THREE.MeshStandardMaterial({
    color: 0xeef5fc,
    roughness: 0.9,
    metalness: 0.02
  });

  // 1. Snowman (눈사람) cleanly situated at rear-left scenic clearing
  const snowmanX = -6.8;
  const snowmanZ = 7.8;
  const snowmanY = groundHeightAt(snowmanX, snowmanZ);
  const snowman = new THREE.Group();
  snowman.position.set(snowmanX, snowmanY, snowmanZ);
  snowman.rotation.y = 0.45;

  const smBot = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 12), snowMat);
  smBot.position.y = 0.36;
  smBot.castShadow = true;
  snowman.add(smBot);

  const smMid = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 12), snowMat);
  smMid.position.y = 0.94;
  smMid.castShadow = true;
  snowman.add(smMid);

  const smHead = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 12), snowMat);
  smHead.position.y = 1.38;
  smHead.castShadow = true;
  snowman.add(smHead);

  const coalMat = new THREE.MeshStandardMaterial({ color: 0x1b1a22, roughness: 0.6 });
  const carrotMat = new THREE.MeshStandardMaterial({ color: 0xf47c2a, roughness: 0.65 });
  const smScarfMat = new THREE.MeshStandardMaterial({ color: 0xc93b4b, roughness: 0.85 });
  const twigMat = new THREE.MeshStandardMaterial({ color: 0x4a3121, roughness: 0.9 });

  [-0.068, 0.068].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), coalMat);
    eye.position.set(ex, 1.42, 0.185);
    snowman.add(eye);
  });

  const carrot = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.16, 8), carrotMat);
  carrot.rotation.x = Math.PI / 2;
  carrot.position.set(0, 1.37, 0.25);
  snowman.add(carrot);

  const smScarf = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.048, 8, 14), smScarfMat);
  smScarf.rotation.x = Math.PI / 2;
  smScarf.position.y = 1.19;
  snowman.add(smScarf);

  [0.98, 0.85].forEach((by) => {
    const btn = new THREE.Mesh(new THREE.SphereGeometry(0.026, 6, 6), coalMat);
    btn.position.set(0, by, 0.29);
    snowman.add(btn);
  });

  // Top hat
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.025, 14), coalMat);
  hatBrim.position.set(0, 1.56, 0);
  hatBrim.rotation.z = -0.06;
  snowman.add(hatBrim);
  const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.155, 0.2, 14), coalMat);
  hatCrown.position.set(0.01, 1.66, 0);
  hatCrown.rotation.z = -0.06;
  snowman.add(hatCrown);

  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.42, 6), twigMat);
    arm.position.set(side * 0.4, 1.0, 0.04);
    arm.rotation.z = side * -1.05;
    snowman.add(arm);
  });
  snowRoot.add(snowman);

  // 2. Simple Snow Caps on Trees (single instanced mesh reuse)
  if (snowRefs?.treeCoords?.length) {
    const dummy = new THREE.Object3D();
    const snowUpperGeo = new THREE.ConeGeometry(0.84, 0.85, 8);
    const snowUpper = new THREE.InstancedMesh(snowUpperGeo, snowMat, snowRefs.treeCoords.length);
    const snowLowerGeo = new THREE.ConeGeometry(1.06, 0.72, 8);
    const snowLower = new THREE.InstancedMesh(snowLowerGeo, snowMat, snowRefs.treeCoords.length);
    snowRefs.treeCoords.forEach((t, idx) => {
      dummy.position.set(t.x, t.y + 3.92 * t.scale, t.z);
      dummy.scale.set(t.scale * 0.72, t.scale * 0.82, t.scale * 0.72);
      dummy.rotation.y = idx * 0.7;
      dummy.updateMatrix();
      snowUpper.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(t.x, t.y + 2.66 * t.scale, t.z);
      dummy.scale.set(t.scale, t.scale, t.scale);
      dummy.updateMatrix();
      snowLower.setMatrixAt(idx, dummy.matrix);
    });
    snowUpper.instanceMatrix.needsUpdate = true;
    snowLower.instanceMatrix.needsUpdate = true;
    snowRoot.add(snowUpper, snowLower);
  }

  // 3. Simple Snow Covers on Benches
  if (Array.isArray(benchSpecs)) {
    benchSpecs.forEach((b) => {
      const by = groundHeightAt(b.x, b.z);
      const seatSnow = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.055, 0.52), snowMat);
      seatSnow.position.set(b.x, by + 0.505, b.z);
      seatSnow.rotation.y = b.yaw;
      snowRoot.add(seatSnow);
    });
  }

  // 4. Simple Snow Roof Caps on Bosingak, Stall Awning, Christmas Tree Tiers, Namsan Houses & Tower
  if (pavilionPos) {
    const py = groundHeightAt(pavilionPos.x, pavilionPos.z);
    const pCap = new THREE.Mesh(new THREE.ConeGeometry(3.28, 0.92, 4), snowMat);
    pCap.position.set(pavilionPos.x, py + 5.82, pavilionPos.z);
    pCap.rotation.y = Math.PI / 4;
    snowRoot.add(pCap);
  }

  if (stallPos) {
    const sy = groundHeightAt(stallPos.x, stallPos.z);
    const sCap = new THREE.Mesh(new THREE.BoxGeometry(2.74, 0.08, 1.56), snowMat);
    sCap.position.set(stallPos.x, sy + 2.58, stallPos.z);
    sCap.rotation.y = 0.62;
    sCap.rotation.x = 0.08;
    snowRoot.add(sCap);
  }

  if (treePos) {
    const ty = groundHeightAt(treePos.x, treePos.z);
    [
      { r: 1.72, y: 1.98 },
      { r: 1.44, y: 2.75 },
      { r: 1.12, y: 3.48 },
      { r: 0.8, y: 4.16 },
      { r: 0.46, y: 4.74 }
    ].forEach((tier) => {
      const frost = new THREE.Mesh(new THREE.ConeGeometry(tier.r, 0.28, 12), snowMat);
      frost.position.set(treePos.x, ty + tier.y, treePos.z);
      snowRoot.add(frost);
    });
  }

  if (snowRefs?.namsanHousesInfo) {
    snowRefs.namsanHousesInfo.forEach((h) => {
      const cap = new THREE.Mesh(new THREE.ConeGeometry(h.isBlueRoof ? 2.15 : 2.2, h.roofH * 0.72, 4), snowMat);
      cap.position.set(
        h.x + (h.offsetX ?? 0),
        h.y + 0.22 + h.bodyH + h.roofH * 0.56,
        h.z + (h.offsetZ ?? -0.15)
      );
      cap.rotation.y = Math.PI / 4;
      cap.scale.set(h.isBlueRoof ? 0.98 : 1.08, 1.0, 0.92);
      snowRoot.add(cap);
    });
  }

  if (snowRefs?.libraryPos) {
    const libCap = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.16, 4.1), snowMat);
    libCap.position.set(snowRefs.libraryPos.x, snowRefs.libraryPos.y + 5.65, snowRefs.libraryPos.z + 0.06);
    snowRoot.add(libCap);
  }

  if (snowRefs?.towerPlazaPos) {
    const tCap = new THREE.Mesh(new THREE.CylinderGeometry(3.55, 4.1, 0.18, 8), snowMat);
    tCap.position.set(snowRefs.towerPlazaPos.x, snowRefs.towerPlazaPos.y + 1.85, snowRefs.towerPlazaPos.z);
    snowRoot.add(tCap);
  }

  // 5. THREE.Points Falling Snow Particle System (capped & reused, zero per-frame allocations)
  const particleCount = isMobile ? 280 : 650;
  const positions = new Float32Array(particleCount * 3);
  const fallSpeeds = new Float32Array(particleCount);
  const driftOffsets = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 64;
    positions[i * 3 + 1] = 2 + Math.random() * 24;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 64 - 4;
    fallSpeeds[i] = 1.65 + Math.random() * 1.9;
    driftOffsets[i] = Math.random() * Math.PI * 2;
  }

  const snowGeo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(positions, 3);
  snowGeo.setAttribute('position', posAttr);

  const snowTex = createSnowFlakeTexture();
  const snowPointsMat = new THREE.PointsMaterial({
    map: snowTex,
    color: 0xf4f9ff,
    size: isMobile ? 0.38 : 0.34,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  });
  const snowPoints = new THREE.Points(snowGeo, snowPointsMat);
  snowPoints.frustumCulled = false;
  snowRoot.add(snowPoints);

  scene.add(snowRoot);

  let enabled = false;

  function setSnowEnabled(nextEnabled) {
    enabled = Boolean(nextEnabled);
    snowRoot.visible = enabled;

    if (snowRefs?.hillGeo && snowRefs.hillBaseColorAttr && snowRefs.hillSnowColorAttr) {
      snowRefs.hillGeo.setAttribute('color', enabled ? snowRefs.hillSnowColorAttr : snowRefs.hillBaseColorAttr);
    }
    if (snowRefs?.landGeo && snowRefs.landBaseColorAttr && snowRefs.landSnowColorAttr) {
      snowRefs.landGeo.setAttribute('color', enabled ? snowRefs.landSnowColorAttr : snowRefs.landBaseColorAttr);
    }
  }

  function updateSnow(dt, elapsed) {
    if (!enabled) return;
    const stepDt = Math.min(0.05, dt);
    const arr = posAttr.array;
    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      arr[idx] += Math.sin(elapsed * 0.9 + driftOffsets[i]) * 0.42 * stepDt;
      arr[idx + 1] -= fallSpeeds[i] * stepDt;
      if (arr[idx + 1] < 0.8) {
        arr[idx + 1] = 24 + (i % 5) * 0.9;
        arr[idx] = ((i * 73) % 64) - 32 + Math.sin(elapsed + i) * 1.4;
      }
    }
    posAttr.needsUpdate = true;
  }

  return {
    snowRoot,
    setSnowEnabled,
    updateSnow,
    isSnowEnabled: () => enabled
  };
}

// ===================================================================
// Named NPCs (모모, 비트, 토리, 나루) - Reused Shared Geometries/Materials
// ===================================================================
export function createHillNpcs() {
  // Shared low-poly stylized geometry across all 4 named NPCs (minimal draw/memory cost)
  const sharedGeo = {
    leg: new THREE.CylinderGeometry(0.06, 0.056, 0.42, 8),
    torso: new THREE.CylinderGeometry(0.175, 0.255, 0.66, 12),
    hem: new THREE.TorusGeometry(0.254, 0.018, 6, 14),
    head: new THREE.SphereGeometry(0.175, 14, 12),
    eye: new THREE.SphereGeometry(0.02, 6, 6),
    button: new THREE.SphereGeometry(0.016, 6, 6),
    arm: new THREE.CylinderGeometry(0.046, 0.05, 0.34, 8),
    cuff: new THREE.CylinderGeometry(0.055, 0.055, 0.042, 8),
    hand: new THREE.SphereGeometry(0.048, 8, 8),
    beanie: new THREE.SphereGeometry(0.184, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55)
  };
  const sharedMat = {
    boot: new THREE.MeshStandardMaterial({ color: 0x211a26, roughness: 0.72 }),
    skin: new THREE.MeshStandardMaterial({ color: 0xf6d5be, roughness: 0.65 }),
    eye: new THREE.MeshStandardMaterial({ color: 0x241714, roughness: 0.45 }),
    trim: new THREE.MeshStandardMaterial({ color: 0xe6dccd, roughness: 0.84 }),
    button: new THREE.MeshStandardMaterial({ color: 0xd9b36c, roughness: 0.4, metalness: 0.4 })
  };

  function buildNpc({ id, name, coatColor, hatColor, hairMode = false, skipDefaultHeadwear = false, showButtons = true, x, z, yaw, sitting = false, accessoryFn = null }) {
    const g = new THREE.Group();
    const gy = groundHeightAt(x, z);
    g.position.set(x, gy, z);
    g.rotation.y = yaw;

    const bodyGroup = new THREE.Group();
    g.add(bodyGroup);

    const coatMat = new THREE.MeshStandardMaterial({ color: coatColor, roughness: 0.74 });
    const hatMat = new THREE.MeshStandardMaterial({ color: hatColor, roughness: 0.8 });

    // Legs
    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.11, 0.42, 0);
    const lLeg = new THREE.Mesh(sharedGeo.leg, sharedMat.boot);
    lLeg.position.y = -0.2;
    leftLegPivot.add(lLeg);
    bodyGroup.add(leftLegPivot);

    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.11, 0.42, 0);
    const rLeg = new THREE.Mesh(sharedGeo.leg, sharedMat.boot);
    rLeg.position.y = -0.2;
    rightLegPivot.add(rLeg);
    bodyGroup.add(rightLegPivot);

    // Torso + subtle winter coat hem & optional front buttons
    const torso = new THREE.Mesh(sharedGeo.torso, coatMat);
    torso.position.y = 0.74;
    torso.castShadow = true;
    bodyGroup.add(torso);

    const hemTrim = new THREE.Mesh(sharedGeo.hem, sharedMat.trim);
    hemTrim.rotation.x = Math.PI / 2;
    hemTrim.position.y = 0.425;
    bodyGroup.add(hemTrim);

    if (showButtons) {
      [0.84, 0.7, 0.56].forEach((by, bIdx) => {
        const btn = new THREE.Mesh(sharedGeo.button, sharedMat.button);
        btn.position.set(0, by, 0.2 + bIdx * 0.018);
        bodyGroup.add(btn);
      });
    }

    // Head Pivot (allows independent head-only rotation toward player / fireworks!)
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 1.24, 0);
    const head = new THREE.Mesh(sharedGeo.head, sharedMat.skin);
    head.castShadow = true;
    headPivot.add(head);

    [-0.06, 0.06].forEach((ex) => {
      const eye = new THREE.Mesh(sharedGeo.eye, sharedMat.eye);
      eye.position.set(ex, 0.015, 0.158);
      headPivot.add(eye);
    });

    if (!skipDefaultHeadwear) {
      if (hairMode) {
        const hair = new THREE.Mesh(sharedGeo.beanie, hatMat);
        hair.position.y = 0.03;
        hair.rotation.x = -0.18;
        headPivot.add(hair);
      } else {
        const beanie = new THREE.Mesh(sharedGeo.beanie, hatMat);
        beanie.position.y = 0.025;
        beanie.rotation.x = -0.14;
        headPivot.add(beanie);
      }
    }
    bodyGroup.add(headPivot);

    // Left Arm + Cozy Cuff + Skin Hand
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.23, 0.96, 0.02);
    const lSleeve = new THREE.Mesh(sharedGeo.arm, coatMat);
    lSleeve.position.y = -0.15;
    leftArmPivot.add(lSleeve);
    const lCuff = new THREE.Mesh(sharedGeo.cuff, sharedMat.trim);
    lCuff.position.y = -0.295;
    leftArmPivot.add(lCuff);
    const lHand = new THREE.Mesh(sharedGeo.hand, sharedMat.skin);
    lHand.position.y = -0.335;
    leftArmPivot.add(lHand);
    bodyGroup.add(leftArmPivot);

    // Right Arm + Cozy Cuff + Skin Hand
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.23, 0.96, 0.02);
    const rSleeve = new THREE.Mesh(sharedGeo.arm, coatMat);
    rSleeve.position.y = -0.15;
    rightArmPivot.add(rSleeve);
    const rCuff = new THREE.Mesh(sharedGeo.cuff, sharedMat.trim);
    rCuff.position.y = -0.295;
    rightArmPivot.add(rCuff);
    const rHand = new THREE.Mesh(sharedGeo.hand, sharedMat.skin);
    rHand.position.y = -0.335;
    rightArmPivot.add(rHand);
    bodyGroup.add(rightArmPivot);

    if (sitting) {
      bodyGroup.position.set(0, -0.02, 0.02);
      leftLegPivot.rotation.x = -1.35;
      rightLegPivot.rotation.x = -1.35;
      leftArmPivot.rotation.x = -0.32;
      rightArmPivot.rotation.x = -0.32;
    }

    if (typeof accessoryFn === 'function') {
      accessoryFn({ g, bodyGroup, headPivot, leftArmPivot, rightArmPivot });
    }

    g.userData.npcId = id;
    g.userData.npcName = name;

    return {
      id,
      name,
      group: g,
      bodyGroup,
      headPivot,
      leftArmPivot,
      rightArmPivot,
      leftLegPivot,
      rightLegPivot,
      basePos: new THREE.Vector3(x, gy, z),
      baseYaw: yaw,
      sitting,
      fireworkReact: {
        active: false,
        phase: 'idle',
        delay: 0,
        elapsed: 0,
        duration: 0,
        wantBurstJump: false,
        wantBurstWave: false,
        cooldownUntil: 0,
        lookStrength: 0,
        jumpOffset: 0,
        waveBlend: 0
      },
      proximityState: {
        near: false,
        headYaw: 0,
        headPitch: 0
      }
    };
  }

  // 1. 모모 (Sitting permanently on right side of cliff-center bench beside 몽이 + Warm beige scarf)
  const momo = buildNpc({
    id: 'momo',
    name: '모모',
    coatColor: 0x6f587a,
    hatColor: 0x3b2d26,
    hairMode: true,
    x: 0.62,
    z: -9.2,
    yaw: Math.PI,
    sitting: true,
    accessoryFn: ({ bodyGroup }) => {
      const beigeScarfMat = new THREE.MeshStandardMaterial({ color: 0xf3e5cb, roughness: 0.85 });
      const scarfRing = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.056, 8, 16), beigeScarfMat);
      scarfRing.rotation.x = Math.PI / 2;
      scarfRing.position.y = 1.08;
      bodyGroup.add(scarfRing);

      const scarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.28, 0.04), beigeScarfMat);
      scarfTail.position.set(0.08, 0.94, 0.19);
      scarfTail.rotation.z = -0.14;
      bodyGroup.add(scarfTail);
    }
  });

  // 2. 비트 (Dancing NPC in open left-center yard + Clean Non-Clipping Gold Collar Necklace & Pendant)
  const beat = buildNpc({
    id: 'beat',
    name: '비트',
    coatColor: 0x2f537a,
    hatColor: 0x252b3b,
    x: -4.2,
    z: -1.4,
    yaw: 0.42,
    accessoryFn: ({ bodyGroup }) => {
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xf5d061, roughness: 0.22, metalness: 0.88 });
      const chain = new THREE.Mesh(new THREE.TorusGeometry(0.186, 0.015, 8, 22), goldMat);
      chain.rotation.x = Math.PI / 2 + 0.1;
      chain.position.set(0, 1.078, 0.005);
      bodyGroup.add(chain);

      const pendant = new THREE.Mesh(new THREE.OctahedronGeometry(0.036, 0), goldMat);
      pendant.position.set(0, 0.96, 0.214);
      bodyGroup.add(pendant);
    }
  });

  // 3. 토리 (Conversing NPC 1 + Brown Coat, Pink Knit Pom Beanie & Warm Amber Scarf)
  const toriX = 3.0;
  const toriZ = -1.8;
  const naruX = 4.1;
  const naruZ = -1.5;
  const toriYaw = Math.atan2(naruX - toriX, naruZ - toriZ);
  const naruYaw = Math.atan2(toriX - naruX, toriZ - naruZ);

  const tori = buildNpc({
    id: 'tori',
    name: '토리',
    coatColor: 0x6b4c35,
    hatColor: 0xb85d78,
    x: toriX,
    z: toriZ,
    yaw: toriYaw,
    accessoryFn: ({ bodyGroup, headPivot }) => {
      const scarfMat = new THREE.MeshStandardMaterial({ color: 0xd9924c, roughness: 0.84 });
      const scarfRing = new THREE.Mesh(new THREE.TorusGeometry(0.174, 0.048, 8, 16), scarfMat);
      scarfRing.rotation.x = Math.PI / 2;
      scarfRing.position.set(0, 1.085, 0);
      bodyGroup.add(scarfRing);

      const scarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.24, 0.036), scarfMat);
      scarfTail.position.set(0.075, 0.94, 0.205);
      scarfTail.rotation.x = -0.14;
      scarfTail.rotation.z = -0.1;
      bodyGroup.add(scarfTail);

      // Calm deeper dusty-rose pompom matching Tori's hat
      const pinkPomMat = new THREE.MeshStandardMaterial({ color: 0xd48da2, roughness: 0.86 });
      const pom = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 10), pinkPomMat);
      pom.position.set(0, 0.22, -0.04);
      headPivot.add(pom);
    }
  });

  // 4. 나루 (Conversing NPC 2 + Calm Deep Orange Coat without buttons + Dark Gray Brimmed Hat pressed low + Bracelet & Drink Can)
  const naru = buildNpc({
    id: 'naru',
    name: '나루',
    coatColor: 0xa84d24,
    hatColor: 0x3e4450,
    hairMode: false,
    showButtons: false,
    x: naruX,
    z: naruZ,
    yaw: naruYaw,
    accessoryFn: ({ headPivot, leftArmPivot, rightArmPivot }) => {
      // Dark gray fedora/cloche-style brimmed hat pressed low just like Chichi (zero inner brown clipping)
      const fedoraMat = new THREE.MeshStandardMaterial({ color: 0x3e4450, roughness: 0.8 });
      const bandMat = new THREE.MeshStandardMaterial({ color: 0x22262e, roughness: 0.72 });
      const naruHatGroup = new THREE.Group();
      naruHatGroup.position.set(0, 0.048, -0.004);
      naruHatGroup.rotation.x = -0.08;

      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.198, 0.165, 18), fedoraMat);
      crown.position.y = 0.082;
      naruHatGroup.add(crown);

      const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.194, 0.199, 0.026, 18), bandMat);
      hatBand.position.y = 0.013;
      naruHatGroup.add(hatBand);

      const flatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.248, 0.248, 0.016, 22), fedoraMat);
      flatBrim.position.y = -0.002;
      naruHatGroup.add(flatBrim);
      headPivot.add(naruHatGroup);

      const braceletGoldMat = new THREE.MeshStandardMaterial({ color: 0xf0c965, roughness: 0.24, metalness: 0.85 });
      const jadeBeadMat = new THREE.MeshStandardMaterial({ color: 0x62d4a8, roughness: 0.28, metalness: 0.15 });

      const bangle = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.012, 6, 14), braceletGoldMat);
      bangle.rotation.x = Math.PI / 2;
      bangle.position.set(0, -0.265, 0);
      rightArmPivot.add(bangle);

      const beadGeo = new THREE.SphereGeometry(0.016, 6, 6);
      [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].forEach((ang) => {
        const bead = new THREE.Mesh(beadGeo, jadeBeadMat);
        bead.position.set(Math.cos(ang) * 0.056, -0.265, Math.sin(ang) * 0.056);
        rightArmPivot.add(bead);
      });

      const canGroup = new THREE.Group();
      canGroup.position.set(0, -0.355, 0.068);
      canGroup.rotation.x = 0.14;

      const canBodyMat = new THREE.MeshStandardMaterial({ color: 0x3f6c8a, roughness: 0.34, metalness: 0.35 });
      const canLabelMat = new THREE.MeshStandardMaterial({ color: 0xf6ebd8, roughness: 0.45, metalness: 0.08 });
      const canMetalMat = new THREE.MeshStandardMaterial({ color: 0xdce2ea, roughness: 0.24, metalness: 0.82 });

      const canBody = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.054, 0.155, 14), canBodyMat);
      canGroup.add(canBody);

      const canLabel = new THREE.Mesh(new THREE.CylinderGeometry(0.0552, 0.0552, 0.072, 14), canLabelMat);
      canGroup.add(canLabel);

      const rimGeo = new THREE.CylinderGeometry(0.051, 0.051, 0.015, 14);
      const topRim = new THREE.Mesh(rimGeo, canMetalMat);
      topRim.position.y = 0.084;
      canGroup.add(topRim);

      const bottomRim = new THREE.Mesh(rimGeo, canMetalMat);
      bottomRim.position.y = -0.084;
      canGroup.add(bottomRim);

      const pullTab = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.006, 0.034), canMetalMat);
      pullTab.position.set(0, 0.094, 0.009);
      canGroup.add(pullTab);

      leftArmPivot.add(canGroup);
    }
  });

  // 5. 로미 (Patrolling near cozy campfire, spacing out at the flames, easily cold, holding golden custard bungeoppang)
  const romiStartX = -3.1;
  const romiStartZ = 3.1;
  const romiStartYaw = Math.atan2(-4.8 - romiStartX, 4.4 - romiStartZ);

  const romi = buildNpc({
    id: 'romi',
    name: '로미',
    coatColor: 0xd8ccb8,
    hatColor: 0x355c57,
    skipDefaultHeadwear: true,
    showButtons: true,
    x: romiStartX,
    z: romiStartZ,
    yaw: romiStartYaw,
    accessoryFn: ({ bodyGroup, headPivot, leftArmPivot }) => {
      // Thick cozy winter scarf wrapped snugly around neck (sensitive to cold)
      const scarfMat = new THREE.MeshStandardMaterial({ color: 0x9e4756, roughness: 0.86 });
      const scarfRing = new THREE.Mesh(new THREE.TorusGeometry(0.182, 0.056, 8, 16), scarfMat);
      scarfRing.rotation.x = Math.PI / 2;
      scarfRing.position.set(0, 1.09, 0);
      bodyGroup.add(scarfRing);

      const scarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.27, 0.04), scarfMat);
      scarfTail.position.set(0.085, 0.93, 0.205);
      scarfTail.rotation.x = -0.14;
      scarfTail.rotation.z = -0.1;
      bodyGroup.add(scarfTail);

      // Chichi-style snug bucket hat in calm deep moss-teal
      const bucketHatMat = new THREE.MeshStandardMaterial({ color: 0x355c57, roughness: 0.82 });
      const hatGroup = new THREE.Group();
      hatGroup.position.set(0, 0.07, -0.005);
      hatGroup.rotation.x = -0.06;

      const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.144, 16), bucketHatMat);
      hatCrown.position.y = 0.065;
      hatGroup.add(hatCrown);

      const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.285, 0.052, 18), bucketHatMat);
      hatBrim.position.y = -0.01;
      hatGroup.add(hatBrim);
      headPivot.add(hatGroup);

      // Golden custard-cream bungeoppang held visibly in left hand
      const custardPastryMat = new THREE.MeshStandardMaterial({ color: 0xf3c363, roughness: 0.58 });
      const heldFish = createBungeoppangFishMesh(custardPastryMat, 1.12);
      heldFish.position.set(0, -0.335, 0.115);
      heldFish.rotation.set(0.2, 0.35, Math.PI / 2 - 0.12);
      leftArmPivot.add(heldFish);
      leftArmPivot.rotation.x = -0.52;
      leftArmPivot.rotation.z = -0.12;
    }
  });

  romi.patrol = {
    waypoints: [
      { x: -3.1, z: 3.1, pause: 4.5, lookX: -4.8, lookZ: 4.4 },
      { x: -2.4, z: 5.8, pause: 2.4, lookX: -4.8, lookZ: 4.4 },
      { x: -4.9, z: 6.7, pause: 4.2, lookX: -4.8, lookZ: 4.4 },
      { x: -7.5, z: 4.2, pause: 3.2, lookX: -9.2, lookZ: 2.5 },
      { x: -5.2, z: 2.2, pause: 3.6, lookX: -4.8, lookZ: 4.4 }
    ],
    wpIdx: 0,
    phase: 'pause',
    pauseLeft: 3.2,
    walkSpeed: 1.25,
    walkPhase: 0
  };

  return [momo, beat, tori, naru, romi];
}

// ===================================================================
// Festive Walking Rudolph Reindeer (단이) Patrolling Bosingak & Christmas Tree
// ===================================================================
export function createReindeerDani(x = 5.8, z = 4.8) {
  const g = new THREE.Group();
  const gy = groundHeightAt(x, z);
  g.position.set(x, gy, z);

  const bodyGroup = new THREE.Group();
  g.add(bodyGroup);

  const furMat = new THREE.MeshStandardMaterial({ color: 0x7c4e32, roughness: 0.82 });
  const tanMat = new THREE.MeshStandardMaterial({ color: 0xe6cfa8, roughness: 0.86 });
  const hoofMat = new THREE.MeshStandardMaterial({ color: 0x221a1e, roughness: 0.65 });
  const antlerMat = new THREE.MeshStandardMaterial({ color: 0x4b3222, roughness: 0.78 });
  const noseMat = new THREE.MeshStandardMaterial({
    color: 0xe82e3e,
    emissive: 0xd91c2c,
    emissiveIntensity: 0.78,
    roughness: 0.24
  });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x18131a, roughness: 0.25 });
  const collarMat = new THREE.MeshStandardMaterial({ color: 0xb82937, roughness: 0.68 });
  const bellGoldMat = new THREE.MeshStandardMaterial({
    color: 0xf6cf65,
    emissive: 0x6b4c0a,
    emissiveIntensity: 0.22,
    roughness: 0.22,
    metalness: 0.88
  });

  // 1. Quadruped Torso + Cream Chest Patch + Perky Tail Tuft
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.185, 0.42, 6, 12), furMat);
  torso.rotation.x = Math.PI / 2;
  torso.position.set(0, 0.56, 0);
  torso.castShadow = true;
  bodyGroup.add(torso);

  const bellyPatch = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), tanMat);
  bellyPatch.scale.set(0.84, 0.96, 0.78);
  bellyPatch.position.set(0, 0.57, 0.21);
  bodyGroup.add(bellyPatch);

  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.082, 8, 8), tanMat);
  tail.scale.set(0.82, 0.95, 1.25);
  tail.position.set(0, 0.66, -0.38);
  tail.rotation.x = 0.45;
  bodyGroup.add(tail);

  // 2. Four Articulated Slender Legs + Dark Hooves (seated flush on ground y = 0)
  const legGeo = new THREE.CylinderGeometry(0.044, 0.036, 0.36, 8);
  const hoofGeo = new THREE.CylinderGeometry(0.038, 0.046, 0.08, 8);
  function makeLeg(lx, lz) {
    const pivot = new THREE.Group();
    pivot.position.set(lx, 0.44, lz);
    const legMesh = new THREE.Mesh(legGeo, furMat);
    legMesh.position.y = -0.18;
    legMesh.castShadow = true;
    pivot.add(legMesh);
    const hoof = new THREE.Mesh(hoofGeo, hoofMat);
    hoof.position.y = -0.4;
    pivot.add(hoof);
    bodyGroup.add(pivot);
    return pivot;
  }

  const legFL = makeLeg(-0.11, 0.21);
  const legFR = makeLeg(0.11, 0.21);
  const legBL = makeLeg(-0.11, -0.21);
  const legBR = makeLeg(0.11, -0.21);

  // 3. Neck, Head, Snout, Glowing Red Nose, Ears & Branched Antlers
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.68, 0.26);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.145, 0.28, 10), furMat);
  neck.position.set(0, 0.1, 0.04);
  neck.rotation.x = 0.26;
  neck.castShadow = true;
  headPivot.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.155, 12, 10), furMat);
  head.scale.set(0.92, 0.94, 1.14);
  head.position.set(0, 0.25, 0.14);
  head.castShadow = true;
  headPivot.add(head);

  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 8), tanMat);
  snout.scale.set(0.94, 0.82, 1.08);
  snout.position.set(0, 0.21, 0.27);
  headPivot.add(snout);

  const redNose = new THREE.Mesh(new THREE.SphereGeometry(0.046, 10, 10), noseMat);
  redNose.position.set(0, 0.23, 0.368);
  headPivot.add(redNose);

  [-0.078, 0.078].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 7, 7), eyeMat);
    eye.position.set(ex, 0.295, 0.245);
    headPivot.add(eye);
  });

  const earGeo = new THREE.SphereGeometry(0.068, 8, 7);
  [-1, 1].forEach((side) => {
    const ear = new THREE.Mesh(earGeo, furMat);
    ear.scale.set(0.45, 0.95, 0.32);
    ear.position.set(side * 0.142, 0.335, 0.085);
    ear.rotation.z = side * -0.78;
    ear.rotation.x = 0.18;
    headPivot.add(ear);

    const antlerPivot = new THREE.Group();
    antlerPivot.position.set(side * 0.072, 0.365, 0.1);
    antlerPivot.rotation.z = side * -0.26;
    antlerPivot.rotation.x = -0.18;

    const mainBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.022, 0.34, 6), antlerMat);
    mainBeam.position.y = 0.16;
    antlerPivot.add(mainBeam);

    const tineA = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.014, 0.14, 6), antlerMat);
    tineA.position.set(side * 0.045, 0.17, 0.025);
    tineA.rotation.z = side * -0.68;
    tineA.rotation.x = 0.38;
    antlerPivot.add(tineA);

    const tineB = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.014, 0.15, 6), antlerMat);
    tineB.position.set(side * -0.02, 0.27, -0.02);
    tineB.rotation.z = side * 0.45;
    tineB.rotation.x = -0.3;
    antlerPivot.add(tineB);

    headPivot.add(antlerPivot);
  });

  bodyGroup.add(headPivot);

  // 4. Crimson Winter Collar (aligned perpendicularly to neck axis) + Attached Golden Sleigh Bell
  const collarGroup = new THREE.Group();
  collarGroup.position.set(0, 0.052, 0.027);
  collarGroup.rotation.x = 0.26; // Matches neck.rotation.x so collar wraps cleanly without tilting
  headPivot.add(collarGroup);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.138, 0.028, 10, 22), collarMat);
  collar.rotation.x = Math.PI / 2;
  collarGroup.add(collar);

  const collarClasp = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.0065, 8, 12), bellGoldMat);
  collarClasp.position.set(0, -0.008, 0.16);
  collarGroup.add(collarClasp);

  const bellPivot = new THREE.Group();
  bellPivot.position.set(0, -0.022, 0.162);
  bellPivot.rotation.x = -0.26; // Counter-rotates collar tilt so bell hangs straight down

  const bellLoop = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.0055, 6, 12), bellGoldMat);
  bellLoop.rotation.y = Math.PI / 2;
  bellLoop.position.y = -0.006;
  bellPivot.add(bellLoop);

  const bellSphere = new THREE.Mesh(new THREE.SphereGeometry(0.064, 12, 10), bellGoldMat);
  bellSphere.position.y = -0.066;
  bellPivot.add(bellSphere);

  const bellRim = new THREE.Mesh(new THREE.TorusGeometry(0.064, 0.009, 6, 14), bellGoldMat);
  bellRim.rotation.x = Math.PI / 2;
  bellRim.position.y = -0.066;
  bellPivot.add(bellRim);

  collarGroup.add(bellPivot);

  const waypoints = [
    { x: 5.8,  z: 4.8,  pause: 2.6, lookX: 10.2, lookZ: 8.8 },
    { x: 11.8, z: 4.2,  pause: 2.0, lookX: 10.2, lookZ: 8.8 },
    { x: 12.0, z: -2.0, pause: 1.4, lookX: 8.4,  lookZ: -4.0 },
    { x: 10.8, z: -6.4, pause: 3.0, lookX: 8.4,  lookZ: -4.0 },
    { x: 6.2,  z: -6.2, pause: 2.5, lookX: 8.4,  lookZ: -4.0 },
    { x: 5.5,  z: 0.4,  pause: 2.4, lookX: 8.4,  lookZ: -4.0 }
  ];

  const initYaw = Math.atan2(waypoints[0].lookX - x, waypoints[0].lookZ - z);
  g.rotation.y = initYaw;

  return {
    id: 'dani',
    name: '단이',
    group: g,
    bodyGroup,
    headPivot,
    bellPivot,
    legFL,
    legFR,
    legBL,
    legBR,
    basePos: new THREE.Vector3(x, gy, z),
    baseYaw: initYaw,
    bellRingUntilMs: 0,
    patrol: {
      waypoints,
      wpIdx: 0,
      phase: 'pause',
      pauseLeft: 2.2,
      walkSpeed: 1.48,
      walkPhase: 0
    }
  };
}

// ===================================================================
// 3D Sky Midnight Countdown & New Year Message Sprite (Single Reused Sprite)
// ===================================================================
export function createSkyCountdownSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    fog: false
  });
  const sprite = new THREE.Sprite(mat);
  sprite.position.set(0, 26.5, -54);
  sprite.scale.set(44, 22, 1);
  sprite.renderOrder = 20;
  sprite.visible = false;

  let lastKey = '';

  function setContent(headline = '', subline = '', styleMode = 'normal') {
    const key = `${styleMode}::${headline}::${subline}`;
    if (key === lastKey) return;
    lastKey = key;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!headline && !subline) {
      tex.needsUpdate = true;
      return;
    }

    const cx = canvas.width / 2;
    const cy = subline ? 232 : 254;
    const isNewYear = styleMode === 'newyear';
    const isFinal3 = styleMode === 'final3';
    const isMessage = styleMode === 'message' || styleMode === 'newyear_message';
    const isGrand = isNewYear || isFinal3 || styleMode === 'newyear_message';

    // 1. Soft Feathered Sky-Contrast Mist (invisible edge, ensures crisp readability in Day/Sunset/Night without text strokes)
    ctx.save();
    if (isMessage) {
      ctx.translate(cx, cy);
      ctx.scale(1.65, 0.92);
      const msgMist = ctx.createRadialGradient(0, 0, 12, 0, 0, 290);
      msgMist.addColorStop(0, 'rgba(8, 10, 28, 0.44)');
      msgMist.addColorStop(0.45, 'rgba(10, 12, 32, 0.22)');
      msgMist.addColorStop(0.8, 'rgba(10, 12, 32, 0.06)');
      msgMist.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = msgMist;
      ctx.beginPath();
      ctx.arc(0, 0, 290, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const mistR = isGrand ? 300 : 250;
      const numMist = ctx.createRadialGradient(cx, cy, 10, cx, cy, mistR);
      numMist.addColorStop(0, 'rgba(8, 10, 28, 0.46)');
      numMist.addColorStop(0.42, 'rgba(10, 12, 32, 0.22)');
      numMist.addColorStop(0.78, 'rgba(10, 12, 32, 0.05)');
      numMist.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = numMist;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.restore();

    // 2. Wide Celestial Sky Halo + Monumental Golden Starburst Rays (zero frame box!)
    const radialRadius = isNewYear || styleMode === 'newyear_message' ? 440 : (isFinal3 ? 395 : 335);
    const radial = ctx.createRadialGradient(cx, cy, 18, cx, cy, radialRadius);
    if (styleMode === 'newyear' || styleMode === 'newyear_message') {
      radial.addColorStop(0, 'rgba(255, 228, 138, 0.36)');
      radial.addColorStop(0.42, 'rgba(255, 194, 72, 0.16)');
      radial.addColorStop(0.75, 'rgba(255, 146, 86, 0.05)');
      radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (isFinal3) {
      radial.addColorStop(0, 'rgba(255, 232, 156, 0.32)');
      radial.addColorStop(0.5, 'rgba(255, 206, 98, 0.12)');
      radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      radial.addColorStop(0, 'rgba(255, 240, 198, 0.22)');
      radial.addColorStop(0.55, 'rgba(246, 212, 130, 0.07)');
      radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!isMessage) {
      // Subtle radial celestial rays & dual fine astrolabe rings around countdown numerals
      ctx.save();
      const rayCount = isGrand ? 16 : 12;
      const rayInner = isFinal3 || isNewYear ? 92 : 82;
      const rayOuter = isNewYear ? 248 : (isFinal3 ? 228 : 196);
      for (let i = 0; i < rayCount; i++) {
        const ang = (i / rayCount) * Math.PI * 2;
        const rEnd = i % 2 === 0 ? rayOuter : rayOuter * 0.78;
        const rayGrad = ctx.createLinearGradient(
          cx + Math.cos(ang) * rayInner,
          cy + Math.sin(ang) * rayInner,
          cx + Math.cos(ang) * rEnd,
          cy + Math.sin(ang) * rEnd
        );
        rayGrad.addColorStop(0, isGrand ? 'rgba(255, 230, 148, 0.32)' : 'rgba(255, 240, 195, 0.18)');
        rayGrad.addColorStop(1, 'rgba(255, 220, 130, 0)');
        ctx.strokeStyle = rayGrad;
        ctx.lineWidth = i % 2 === 0 ? 2.8 : 1.5;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * rayInner, cy + Math.sin(ang) * rayInner);
        ctx.lineTo(cx + Math.cos(ang) * rEnd, cy + Math.sin(ang) * rEnd);
        ctx.stroke();
      }

      // Fine golden outer & inner celestial halo rings
      ctx.strokeStyle = isGrand ? 'rgba(255, 224, 132, 0.42)' : 'rgba(255, 236, 184, 0.26)';
      ctx.lineWidth = isGrand ? 2.2 : 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, isNewYear ? 172 : 158, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = isGrand ? 'rgba(255, 244, 200, 0.22)' : 'rgba(255, 245, 214, 0.15)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, isNewYear ? 190 : 174, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Helper: Borderless Dual-Pass Shadow + Luminous Aura + Crisp Fill (zero strokeText!)
    function fillLuminousText(text, x, y, fillStyle, glowColor, glowBlur, depthBlur = 22) {
      // Pass 1: Soft ambient dark elevation shadow for crisp Day/Sunset contrast without any hard border
      ctx.save();
      ctx.shadowColor = 'rgba(6, 8, 22, 0.72)';
      ctx.shadowBlur = depthBlur;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 5;
      ctx.fillStyle = 'rgba(10, 12, 28, 0.36)';
      ctx.fillText(text, x, y);
      ctx.restore();

      // Pass 2: Warm celestial outer glow
      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = glowBlur;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = fillStyle;
      ctx.fillText(text, x, y);
      ctx.restore();

      // Pass 3: Razor-sharp foreground fill
      ctx.fillStyle = fillStyle;
      ctx.fillText(text, x, y);
    }

    if (!isMessage) {
      const fontSize = isNewYear ? 236 : (isFinal3 ? 216 : 190);
      ctx.font = `900 ${fontSize}px Cinzel, "Gowun Batang", serif`;

      // Rich metallic champagne-gold linear gradient fill
      const numGrad = ctx.createLinearGradient(0, cy - fontSize * 0.45, 0, cy + fontSize * 0.48);
      if (isNewYear) {
        numGrad.addColorStop(0, '#ffffff');
        numGrad.addColorStop(0.45, '#ffe694');
        numGrad.addColorStop(1, '#f0aa35');
      } else if (isFinal3) {
        numGrad.addColorStop(0, '#ffffff');
        numGrad.addColorStop(0.48, '#ffedb0');
        numGrad.addColorStop(1, '#f3bf52');
      } else {
        numGrad.addColorStop(0, '#ffffff');
        numGrad.addColorStop(0.55, '#fff5d8');
        numGrad.addColorStop(1, '#f4d386');
      }
      const glowColor = isNewYear
        ? 'rgba(255, 206, 76, 0.85)'
        : (isFinal3 ? 'rgba(255, 224, 128, 0.78)' : 'rgba(255, 232, 170, 0.62)');
      const glowBlur = isNewYear ? 34 : (isFinal3 ? 28 : 20);
      fillLuminousText(headline, cx, cy, numGrad, glowColor, glowBlur, 26);

      if (subline) {
        ctx.font = '700 32px Cinzel, "Gowun Batang", serif';
        fillLuminousText(
          subline,
          cx,
          405,
          isNewYear ? '#fff4d1' : '#faecc8',
          'rgba(255, 220, 128, 0.65)',
          14,
          16
        );
      }

      if (isGrand) {
        ctx.fillStyle = '#fff9e6';
        const pts = [[256, 132], [768, 128], [218, 286], [806, 276], [320, 380], [704, 376]];
        pts.forEach(([sx, sy], idx) => {
          ctx.beginPath();
          ctx.arc(sx, sy, idx % 2 === 0 ? 4.8 : 3.2, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    } else {
      const lines = String(headline).split('\n').filter(Boolean);
      const isGrandMsg = styleMode === 'newyear_message';
      const glowColor = isGrandMsg ? 'rgba(255, 209, 102, 0.82)' : 'rgba(255, 236, 185, 0.64)';
      const glowBlur = isGrandMsg ? 24 : 16;

      const startY = 256 - ((lines.length - 1) * (isGrandMsg ? 68 : 62)) / 2;
      lines.forEach((line, idx) => {
        if (isGrandMsg && idx === 0) {
          ctx.font = '900 58px Cinzel, "Gowun Batang", serif';
        } else {
          ctx.font = `700 ${isGrandMsg ? 38 : 44}px "Gowun Batang", serif`;
        }
        const ly = startY + idx * (isGrandMsg ? 68 : 62);
        const textFill = isGrandMsg && idx === 0 ? '#ffe99c' : '#fffaf0';
        fillLuminousText(line, cx, ly, textFill, glowColor, glowBlur, 20);
      });
    }

    tex.needsUpdate = true;
  }

  return { sprite, mat, setContent };
}

// ===================================================================
// Hidden Golden Ticket Treasure & Pooled Player Gold Spark Swirl
// ===================================================================
export function createGoldenTicket(glowTexture) {
  const g = new THREE.Group();

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 128, 64);
  grad.addColorStop(0, '#d49a2a');
  grad.addColorStop(0.5, '#ffe694');
  grad.addColorStop(1, '#c7891d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 64);
  ctx.strokeStyle = '#73480b';
  ctx.lineWidth = 4;
  ctx.strokeRect(7, 7, 114, 50);
  ctx.fillStyle = '#6c4208';
  ctx.font = '700 18px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★ TICKET ★', 64, 33);

  const ticketTex = new THREE.CanvasTexture(canvas);
  ticketTex.colorSpace = THREE.SRGBColorSpace;

  const mat = new THREE.MeshStandardMaterial({
    map: ticketTex,
    color: 0xf5d67f,
    emissive: 0xa6741b,
    emissiveIntensity: 0.32,
    roughness: 0.3,
    metalness: 0.72
  });

  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.028, 0.18), mat);
  mesh.castShadow = true;
  g.add(mesh);

  const shimmerMat = new THREE.SpriteMaterial({
    map: glowTexture,
    color: 0xffe38f,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const shimmer = new THREE.Sprite(shimmerMat);
  shimmer.position.y = 0.065;
  shimmer.scale.set(0.54, 0.54, 1);
  g.add(shimmer);

  g.userData.shimmerMat = shimmerMat;
  g.userData.ticketMesh = mesh;
  return g;
}

export function createGoldenSparkPool(glowTexture, count = 18) {
  const group = new THREE.Group();
  group.visible = false;

  const sparks = [];
  for (let i = 0; i < count; i++) {
    const mat = new THREE.SpriteMaterial({
      map: glowTexture,
      color: i % 2 === 0 ? 0xffe494 : 0xffc857,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.setScalar(0.24 + (i % 3) * 0.06);
    group.add(sprite);
    sparks.push({
      sprite,
      mat,
      angleOffset: (i / count) * Math.PI * 2 + (i % 3) * 0.25,
      radius: 0.65 + (i % 4) * 0.14,
      speed: 1.7 + (i % 5) * 0.28,
      baseY: 0.45 + (i % 6) * 0.2,
      fadeOutStart: 3.6 + (i % 6) * 0.45
    });
  }

  let active = false;
  let elapsed = 0;
  const totalDuration = 6.2;

  function trigger() {
    active = true;
    elapsed = 0;
    group.visible = true;
  }

  function update(dt, playerPos) {
    if (!active) return;
    elapsed += dt;
    if (elapsed >= totalDuration) {
      active = false;
      group.visible = false;
      return;
    }

    group.position.copy(playerPos);
    const fadeIn = Math.min(1, elapsed / 0.55);

    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const ang = s.angleOffset + elapsed * s.speed;
      const r = s.radius + Math.sin(elapsed * 2.1 + i) * 0.1;
      const y = s.baseY + Math.sin(elapsed * 2.4 + s.angleOffset) * 0.22 + (elapsed / totalDuration) * 0.4;
      s.sprite.position.set(Math.cos(ang) * r, y, Math.sin(ang) * r);

      let alpha = fadeIn;
      if (elapsed > s.fadeOutStart) {
        const rem = Math.max(0, 1 - (elapsed - s.fadeOutStart) / (totalDuration - s.fadeOutStart));
        alpha *= rem;
      }
      s.mat.opacity = 0.62 * alpha;
    }
  }

  function stop() {
    active = false;
    group.visible = false;
  }

  return { group, trigger, update, stop, isActive: () => active };
}

// ===================================================================
// Cozy Hill Additions (Ultra-Low Draw Call & Zero Per-Frame Allocation)
// ===================================================================

// 1. Winding Slate Stepping Stones Connecting Key Spots (1 InstancedMesh Draw Call!)
export function createHillSteppingStones(spots = {}) {
  const stonePoints = [];
  function addPath(x0, z0, x1, z1, count, arcX = 0, arcZ = 0) {
    for (let i = 1; i <= count; i++) {
      const t = i / (count + 1);
      const sx = THREE.MathUtils.lerp(x0, x1, t) + Math.sin(t * Math.PI) * arcX;
      const sz = THREE.MathUtils.lerp(z0, z1, t) + Math.sin(t * Math.PI) * arcZ;
      stonePoints.push({ x: sx, z: sz, yaw: (i * 0.8 + sx) % Math.PI });
    }
  }

  const stall = spots.stall || { x: -10.2, z: 2.8 };
  const tree = spots.tree || { x: 10.2, z: -0.8 };
  const pavilion = spots.pavilion || { x: 7.4, z: 8.4 };
  const firepit = spots.firepit || { x: -4.8, z: 4.4 };

  // Center plaza -> cliff overlook, stall, tree, firepit, and Bosingak steps
  addPath(0.2, -1.6, 0.2, -8.2, 5, 0.35, 0);
  addPath(-0.4, -0.8, stall.x + 2.2, stall.z - 0.6, 7, -0.6, 0.5);
  addPath(0.6, -1.2, tree.x - 1.8, tree.z - 0.2, 7, 0.3, -0.7);
  addPath(0.4, -0.4, pavilion.x, pavilion.z - 3.1, 7, 0.7, 0);
  addPath(-1.2, 0.6, firepit.x + 1.1, firepit.z - 0.8, 4, -0.35, 0.35);

  const stoneGeo = new THREE.CylinderGeometry(0.32, 0.38, 0.07, 7);
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x4b4757, roughness: 0.92, metalness: 0.04 });
  const mesh = new THREE.InstancedMesh(stoneGeo, stoneMat, stonePoints.length);
  mesh.receiveShadow = true;

  const dummy = new THREE.Object3D();
  stonePoints.forEach((pt, idx) => {
    const sy = groundHeightAt(pt.x, pt.z);
    dummy.position.set(pt.x, sy + 0.025, pt.z);
    dummy.rotation.set(0, pt.yaw, 0);
    const sx = 0.85 + ((idx * 17) % 5) * 0.07;
    const sz = 0.78 + ((idx * 13) % 4) * 0.08;
    dummy.scale.set(sx, 1, sz);
    dummy.updateMatrix();
    mesh.setMatrixAt(idx, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  return mesh;
}

// 2. Cozy Stone Campfire / Brazier with Glowing Logs & Pooled Rising Ember Sprites
export function createCozyFirepit(x, z, glowTexture, withLight = true) {
  const g = new THREE.Group();
  const baseY = groundHeightAt(x, z);
  g.position.set(x, baseY, z);

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x4f4959, roughness: 0.9 });
  const logMat = new THREE.MeshStandardMaterial({ color: 0x3b2316, roughness: 0.88 });
  const emberMat = new THREE.MeshStandardMaterial({
    color: 0xff8a3d,
    emissive: 0xff6b21,
    emissiveIntensity: 1.9,
    roughness: 0.35
  });

  // Ring of 8 rounded hearth stones (shared geometry)
  const stoneGeo = new THREE.DodecahedronGeometry(0.16, 0);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const s = new THREE.Mesh(stoneGeo, stoneMat);
    s.position.set(Math.cos(a) * 0.56, 0.1, Math.sin(a) * 0.56);
    s.scale.set(1.25, 0.75, 1.0);
    s.rotation.y = a;
    s.castShadow = true;
    g.add(s);
  }

  // Glowing ember bed + crossed firewood logs
  const ashBed = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.07, 10), emberMat);
  ashBed.position.y = 0.05;
  g.add(ashBed);

  const logGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.72, 7);
  [0.25, -0.75, 1.3].forEach((ang, idx) => {
    const log = new THREE.Mesh(logGeo, logMat);
    log.position.set(Math.cos(ang) * 0.06, 0.14 + idx * 0.025, Math.sin(ang) * 0.06);
    log.rotation.z = Math.PI / 2 - 0.18;
    log.rotation.y = ang;
    g.add(log);
  });

  // Two rustic fallen-log seats flanking the firepit (zero dynamic lights, cozy gathering nook)
  const seatLogGeo = new THREE.CylinderGeometry(0.14, 0.155, 1.18, 9);
  [
    { sx: -1.18, sz: 0.35, ry: 0.45 },
    { sx: 1.15, sz: 0.48, ry: -0.52 }
  ].forEach((seat) => {
    const seatLog = new THREE.Mesh(seatLogGeo, logMat);
    seatLog.rotation.z = Math.PI / 2;
    seatLog.rotation.y = seat.ry;
    seatLog.position.set(seat.sx, 0.14, seat.sz);
    seatLog.castShadow = true;
    seatLog.receiveShadow = true;
    g.add(seatLog);
  });

  // Flame warm core glow + 4 pooled rising warm ember sparks
  const flameGlowMat = new THREE.SpriteMaterial({
    map: glowTexture,
    color: 0xffaa4c,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const flameGlow = new THREE.Sprite(flameGlowMat);
  flameGlow.position.y = 0.34;
  flameGlow.scale.set(1.35, 1.35, 1);
  g.add(flameGlow);

  const embers = [];
  for (let i = 0; i < 4; i++) {
    const em = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: i % 2 === 0 ? 0xffbb55 : 0xff7b36,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    em.scale.set(0.14, 0.14, 1);
    g.add(em);
    embers.push({ sprite: em, phase: i * 1.55 });
  }

  let fireLight = null;
  if (withLight) {
    fireLight = new THREE.PointLight(0xff9642, 1.85, 8.5, 1.7);
    fireLight.position.y = 0.48;
    g.add(fireLight);
  }

  function update(timeSec) {
    const flicker = 0.86 + Math.sin(timeSec * 8.4) * 0.09 + Math.cos(timeSec * 13.2) * 0.05;
    emberMat.emissiveIntensity = 1.75 * flicker;
    flameGlowMat.opacity = 0.68 * flicker;
    flameGlow.scale.set(1.28 * flicker, 1.35 * flicker, 1);
    if (fireLight) {
      fireLight.intensity = 1.85 * flicker;
    }
    for (let i = 0; i < embers.length; i++) {
      const e = embers[i];
      const cyc = ((timeSec * 0.58 + e.phase * 0.25) % 1 + 1) % 1;
      e.sprite.position.set(
        Math.sin(timeSec * 2.6 + e.phase) * 0.14,
        0.22 + cyc * 0.92,
        Math.cos(timeSec * 2.2 + e.phase) * 0.14
      );
      e.sprite.material.opacity = Math.sin(cyc * Math.PI) * 0.65;
    }
  }

  return { group: g, update };
}

// 3. Pooled Ambient Floating Sky Wish Lanterns (Shared Geometries, Zero PointLights, Paused in Snow Mode)
export function createAmbientSkyLanterns(glowTexture, count = 28) {
  const group = new THREE.Group();
  const bodyGeo = new THREE.CylinderGeometry(0.32, 0.21, 0.58, 7);
  const rimGeo = new THREE.TorusGeometry(0.21, 0.018, 5, 10);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.85 });
  const warmHexes = ['#ffd166', '#ffb347', '#ffbe76', '#ffe49e'];

  const pool = [];
  for (let i = 0; i < count; i++) {
    const col = warmHexes[i % warmHexes.length];
    const shellMat = new THREE.MeshStandardMaterial({
      color: col,
      emissive: col,
      emissiveIntensity: 1.48,
      roughness: 0.45,
      transparent: true,
      opacity: 0.92,
      fog: false
    });
    const haloMat = new THREE.SpriteMaterial({
      map: glowTexture,
      color: col,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    });

    const item = new THREE.Group();
    const depthScale = 0.78 + (i % 5) * 0.11;
    item.scale.setScalar(depthScale);
    const body = new THREE.Mesh(bodyGeo, shellMat);
    item.add(body);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = -0.29;
    item.add(rim);
    const halo = new THREE.Sprite(haloMat);
    halo.scale.set(2.25, 2.25, 1);
    item.add(halo);

    group.add(item);

    const frac = count > 1 ? i / (count - 1) : 0.5;
    const startX = -56 + frac * 112 + Math.sin(i * 2.7) * 5.5;
    const startZ = -18 - (i % 6) * 10 - (i % 2) * 3;
    const minY = 4.5 + (i % 4) * 2.2;
    const maxY = 42 + (i % 4) * 4.5;
    pool.push({
      mesh: item,
      shellMat,
      haloMat,
      baseX: startX,
      baseZ: startZ,
      minY,
      maxY,
      y: minY + ((i * 0.6180339887) % 1) * (maxY - minY),
      speed: 0.36 + (i % 5) * 0.085,
      driftX: (i % 2 === 0 ? 1 : -1) * (0.12 + (i % 3) * 0.05),
      phase: i * 1.37
    });
  }

  function update(dt, elapsed, dayDimFactor = 1.0) {
    if (!group.visible) return;
    for (let i = 0; i < pool.length; i++) {
      const l = pool[i];
      l.y += l.speed * dt;
      if (l.y > l.maxY) {
        l.y = l.minY;
      }
      const progress = (l.y - l.minY) / (l.maxY - l.minY);
      const fade = Math.min(1, progress * 5.2) * Math.min(1, (1 - progress) * 4.2);
      const wx = l.baseX + Math.sin(elapsed * 0.42 + l.phase) * 2.4 + progress * l.driftX * 16;
      const wz = l.baseZ - progress * 9.5 + Math.cos(elapsed * 0.35 + l.phase) * 1.6;
      l.mesh.position.set(wx, l.y, wz);
      l.mesh.rotation.y = elapsed * 0.25 + l.phase;
      l.mesh.rotation.z = Math.sin(elapsed * 0.9 + l.phase) * 0.06;
      l.shellMat.opacity = 0.9 * fade;
      l.shellMat.emissiveIntensity = 0.72 + 0.96 * dayDimFactor;
      l.haloMat.opacity = 0.64 * fade * dayDimFactor;
    }
  }

  return { group, update };
}

// 4. Gentle Evening Starlight Fireflies (THREE.Points, zero per-frame allocations)
export function createEveningFireflies(glowTexture, count = 28) {
  const positions = new Float32Array(count * 3);
  const baseCoords = new Float32Array(count * 3);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2 + (i % 3) * 0.3;
    const rad = 6.5 + (i % 5) * 2.4;
    const fx = Math.cos(ang) * rad;
    const fz = Math.sin(ang) * rad - 0.5;
    const fy = groundHeightAt(fx, fz) + 0.75 + (i % 4) * 0.42;
    baseCoords[i * 3] = fx;
    baseCoords[i * 3 + 1] = fy;
    baseCoords[i * 3 + 2] = fz;
    positions[i * 3] = fx;
    positions[i * 3 + 1] = fy;
    positions[i * 3 + 2] = fz;
    phases[i] = i * 0.93;
  }

  const geo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(positions, 3);
  geo.setAttribute('position', posAttr);

  const mat = new THREE.PointsMaterial({
    map: glowTexture,
    color: 0xffdf7e,
    size: 0.34,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;

  function update(elapsed, nightStrength = 1.0) {
    const targetOpacity = 0.72 * nightStrength;
    points.visible = targetOpacity > 0.04;
    if (!points.visible) return;
    mat.opacity = targetOpacity * (0.75 + 0.25 * Math.sin(elapsed * 2.1));

    const arr = posAttr.array;
    for (let i = 0; i < count; i++) {
      const p = phases[i];
      const idx = i * 3;
      arr[idx] = baseCoords[idx] + Math.sin(elapsed * 0.65 + p) * 0.55;
      arr[idx + 1] = baseCoords[idx + 1] + Math.sin(elapsed * 1.15 + p * 1.4) * 0.28;
      arr[idx + 2] = baseCoords[idx + 2] + Math.cos(elapsed * 0.55 + p) * 0.55;
    }
    posAttr.needsUpdate = true;
  }

  return { points, update };
}

// 5. Zero-PointLight Warm Ground Light Pools (1 shared PlaneGeometry, huge night warmth boost)
export function createGroundLightPools(glowTexture, spots = []) {
  const group = new THREE.Group();
  const quadGeo = new THREE.PlaneGeometry(1, 1);
  quadGeo.rotateX(-Math.PI / 2);

  const pools = spots.map((s) => {
    const mat = new THREE.MeshBasicMaterial({
      map: glowTexture,
      color: s.color || 0xffb85c,
      transparent: true,
      opacity: s.opacity ?? 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1
    });
    const mesh = new THREE.Mesh(quadGeo, mat);
    const y = groundHeightAt(s.x, s.z) + 0.045;
    mesh.position.set(s.x, y, s.z);
    mesh.scale.set(s.radius, 1, s.radius);
    group.add(mesh);
    return { mat, baseOpacity: s.opacity ?? 0.32, flicker: Boolean(s.flicker) };
  });

  function update(elapsed, lampScale = 1.0) {
    const glowFactor = 0.12 + 0.88 * lampScale;
    for (let i = 0; i < pools.length; i++) {
      const p = pools[i];
      const pulse = p.flicker ? (0.9 + 0.1 * Math.sin(elapsed * 7.8 + i)) : 1;
      p.mat.opacity = p.baseOpacity * glowFactor * pulse;
    }
  }

  return { group, update };
}

// 6. Single Pooled Golden Interaction Ripple Ring (Zero runtime allocations)
export function createClickRippleRing() {
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffe08a,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const mesh = new THREE.Mesh(new THREE.RingGeometry(0.24, 0.35, 24), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.visible = false;

  let active = false;
  let age = 0;
  const duration = 0.52;

  function trigger(x, z, colorHex = 0xffe08a) {
    const gy = groundHeightAt(x, z) + 0.05;
    mesh.position.set(x, gy, z);
    mat.color.setHex(colorHex);
    mesh.scale.setScalar(0.8);
    mat.opacity = 0.72;
    mesh.visible = true;
    active = true;
    age = 0;
  }

  function update(dt) {
    if (!active) return;
    age += dt;
    if (age >= duration) {
      active = false;
      mesh.visible = false;
      return;
    }
    const p = age / duration;
    const ease = 1 - Math.pow(1 - p, 2);
    mesh.scale.setScalar(0.8 + ease * 2.2);
    mat.opacity = 0.72 * (1 - p);
  }

  return { mesh, trigger, update };
}

// 7. Cozy Vintage Hilltop Mailbox near Left Lantern Post (Zero dynamic PointLights)
export function createCozyMailbox(x, z, yaw = 0.55, glowTexture) {
  const g = new THREE.Group();
  const baseY = groundHeightAt(x, z);
  g.position.set(x, baseY, z);
  g.rotation.y = yaw;

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x4b4657, roughness: 0.88, metalness: 0.06 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x523524, roughness: 0.84 });
  const boxRedMat = new THREE.MeshStandardMaterial({ color: 0xa6373f, roughness: 0.58, metalness: 0.12 });
  const trimGoldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.34, metalness: 0.72 });
  const slotDarkMat = new THREE.MeshStandardMaterial({ color: 0x1a1420, roughness: 0.85 });
  const creamLetterMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d9,
    emissive: 0xffe09e,
    emissiveIntensity: 0.25,
    roughness: 0.5
  });

  // Stone footing pad + wooden post + mounting bracket
  const footing = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.14, 10), stoneMat);
  footing.position.y = 0.07;
  footing.receiveShadow = true;
  g.add(footing);

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, 0.88, 8), woodMat);
  post.position.y = 0.54;
  post.castShadow = true;
  g.add(post);

  const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.52), woodMat);
  bracket.position.y = 0.96;
  g.add(bracket);

  // Classic curved-top red mailbox body
  const lowerBox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 0.56), boxRedMat);
  lowerBox.position.set(0, 1.12, 0);
  lowerBox.castShadow = true;
  g.add(lowerBox);

  const roofArch = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.56, 14), boxRedMat);
  roofArch.rotation.x = Math.PI / 2;
  roofArch.position.set(0, 1.25, 0);
  roofArch.castShadow = true;
  g.add(roofArch);

  // Brass front door lip, letter slot & small peeking envelope corner
  const frontLip = new THREE.Mesh(new THREE.BoxGeometry(0.435, 0.045, 0.05), trimGoldMat);
  frontLip.position.set(0, 1.02, 0.275);
  g.add(frontLip);

  const mailSlot = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.042, 0.03), slotDarkMat);
  mailSlot.position.set(0, 1.21, 0.275);
  g.add(mailSlot);

  const peekingLetter = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.018, 0.09), creamLetterMat);
  peekingLetter.position.set(0.01, 1.21, 0.3);
  peekingLetter.rotation.y = 0.12;
  g.add(peekingLetter);

  const emblemPlate = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.085, 0.022), trimGoldMat);
  emblemPlate.position.set(0, 1.11, 0.28);
  g.add(emblemPlate);

  // Classic right-side Brass Semaphore Flag Arm Pivot
  const flagPivot = new THREE.Group();
  flagPivot.position.set(0.225, 1.12, 0.08);
  const flagStem = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.24, 6), trimGoldMat);
  flagStem.position.y = 0.11;
  flagPivot.add(flagStem);
  const flagHead = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.08, 0.11), trimGoldMat);
  flagHead.position.set(0, 0.21, -0.045);
  flagPivot.add(flagHead);
  flagPivot.rotation.x = -0.22;
  g.add(flagPivot);

  // Very gentle soft warm aura sprite (harmonizes with nearby lantern without excess glare)
  if (glowTexture) {
    const auraMat = new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xffd78c,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const aura = new THREE.Sprite(auraMat);
    aura.position.set(0, 1.24, 0.24);
    aura.scale.set(0.9, 0.9, 1);
    g.add(aura);
    g.userData.auraMat = auraMat;
  }

  g.userData.flagPivot = flagPivot;
  g.userData.worldCenter = new THREE.Vector3(x, baseY + 1.35, z);
  return g;
}

// 8. Night-Only Irregular Shooting Star (Zero Particles / Zero Lights / Zero Per-Frame Allocations)
function createShootingStarTailTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 128, 0);
  grad.addColorStop(0, 'rgba(255, 252, 232, 0)');
  grad.addColorStop(0.55, 'rgba(255, 245, 205, 0.42)');
  grad.addColorStop(0.92, 'rgba(255, 250, 235, 0.92)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 1)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 2, 128, 12);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createShootingStar(scene, glowTexture) {
  const group = new THREE.Group();
  group.visible = false;

  const tailTex = createShootingStarTailTexture();
  const tailGeo = new THREE.PlaneGeometry(1, 0.24);
  // Shift plane so x=0 is at the star head and x=-1 extends behind into tail
  tailGeo.translate(-0.5, 0, 0);

  const tailMat = new THREE.MeshBasicMaterial({
    map: tailTex,
    color: 0xfff6d8,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false
  });
  const tailPlaneA = new THREE.Mesh(tailGeo, tailMat);
  const tailPlaneB = new THREE.Mesh(tailGeo, tailMat);
  tailPlaneB.rotation.x = Math.PI / 2;
  group.add(tailPlaneA, tailPlaneB);

  const headMat = new THREE.SpriteMaterial({
    map: glowTexture,
    color: 0xfffaf0,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false
  });
  const headSprite = new THREE.Sprite(headMat);
  headSprite.scale.set(1.15, 1.15, 1);
  group.add(headSprite);

  scene.add(group);

  const startPos = new THREE.Vector3();
  const endPos = new THREE.Vector3();
  const dirVec = new THREE.Vector3();
  const xAxis = new THREE.Vector3(1, 0, 0);
  const rotQuat = new THREE.Quaternion();

  let active = false;
  let elapsed = 0;
  let duration = 1.05;
  let tailLength = 12;
  let nextWait = 6 + Math.random() * 7;

  function hideImmediate() {
    active = false;
    group.visible = false;
    tailMat.opacity = 0;
    headMat.opacity = 0;
  }

  function spawn() {
    const leftToRight = Math.random() < 0.52;
    const sx = (leftToRight ? -1 : 1) * (24 + Math.random() * 26);
    const sy = 36 + Math.random() * 14;
    const sz = -82 - Math.random() * 26;
    const dx = (leftToRight ? 1 : -1) * (26 + Math.random() * 18);
    const dy = -(7 + Math.random() * 7);
    const dz = (Math.random() - 0.5) * 10;

    startPos.set(sx, sy, sz);
    endPos.set(sx + dx, sy + dy, sz + dz);
    dirVec.copy(endPos).sub(startPos).normalize();
    rotQuat.setFromUnitVectors(xAxis, dirVec);

    tailPlaneA.quaternion.copy(rotQuat);
    tailPlaneB.quaternion.copy(rotQuat);
    const perp = new THREE.Vector3(0, 0, 1).applyQuaternion(rotQuat);
    tailPlaneB.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(xAxis, Math.PI / 2));
    void perp;

    duration = 0.85 + Math.random() * 0.45;
    tailLength = 9.5 + Math.random() * 5.0;
    elapsed = 0;
    active = true;
    group.position.copy(startPos);
    group.visible = true;
  }

  function update(dt, isNightMode) {
    if (!isNightMode) {
      if (active) hideImmediate();
      return;
    }

    if (!active) {
      nextWait -= dt;
      if (nextWait <= 0) {
        spawn();
      }
      return;
    }

    elapsed += dt;
    const p = elapsed / duration;
    if (p >= 1) {
      hideImmediate();
      nextWait = 10 + Math.random() * 16;
      return;
    }

    group.position.lerpVectors(startPos, endPos, p);
    const alphaEnv = Math.sin(p * Math.PI);
    const tailScale = tailLength * (0.35 + 0.65 * Math.sin(Math.min(1, p * 1.15) * Math.PI));
    tailPlaneA.scale.set(tailScale, 1, 1);
    tailPlaneB.scale.set(tailScale, 1, 1);
    tailMat.opacity = 0.62 * alphaEnv;
    headMat.opacity = 0.88 * alphaEnv;
  }

  function dispose() {
    hideImmediate();
    scene.remove(group);
    tailGeo.dispose();
    tailTex.dispose();
    tailMat.dispose();
    headMat.dispose();
  }

  return { update, hideImmediate, dispose };
}

// ===================================================================
// 9. Cozy Stacked Firewood Pile & Chopping Stump (Zero Dynamic Lights)
// ===================================================================
export function createFirewoodStack(x, z, yaw = 0.72) {
  const g = new THREE.Group();
  const baseY = groundHeightAt(x, z);
  g.position.set(x, baseY, z);
  g.rotation.y = yaw;

  const barkMat = new THREE.MeshStandardMaterial({ color: 0x4a2f20, roughness: 0.92 });
  const darkBarkMat = new THREE.MeshStandardMaterial({ color: 0x382318, roughness: 0.94 });
  const cutEndMat = new THREE.MeshStandardMaterial({ color: 0xcfa168, roughness: 0.72 });
  const logMultiMat = [barkMat, cutEndMat, cutEndMat];
  const stumpMultiMat = [darkBarkMat, cutEndMat, darkBarkMat];
  const handleMat = new THREE.MeshStandardMaterial({ color: 0x7a4e2d, roughness: 0.78 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x8e99a6, roughness: 0.28, metalness: 0.84 });

  // Ground timber skids so firewood rests cleanly above terrain
  const skidGeo = new THREE.BoxGeometry(0.085, 0.075, 0.76);
  [-0.36, 0.36].forEach((sx) => {
    const skid = new THREE.Mesh(skidGeo, darkBarkMat);
    skid.position.set(sx, 0.038, 0);
    skid.castShadow = true;
    skid.receiveShadow = true;
    g.add(skid);
  });

  // Crossed side cradle stakes holding the stack neatly
  const stakeGeo = new THREE.CylinderGeometry(0.028, 0.036, 0.76, 6);
  [-0.56, 0.56].forEach((sx) => {
    [-0.22, 0.22].forEach((sz, idx) => {
      const stake = new THREE.Mesh(stakeGeo, darkBarkMat);
      stake.position.set(sx, 0.36, sz);
      stake.rotation.x = idx === 0 ? 0.14 : -0.14;
      stake.rotation.z = sx < 0 ? 0.08 : -0.08;
      stake.castShadow = true;
      g.add(stake);
    });
  });

  // 3-tier stacked firewood logs with distinct bark sides and pale cut-wood end faces
  const logSpecs = [
    // Bottom tier (4 logs)
    { z: -0.27, y: 0.155, r: 0.09, len: 1.02, ry: 0.02 },
    { z: -0.09, y: 0.16,  r: 0.095, len: 1.06, ry: -0.015 },
    { z: 0.1,   y: 0.155, r: 0.088, len: 1.0, ry: 0.018 },
    { z: 0.28,  y: 0.152, r: 0.086, len: 1.04, ry: -0.02 },
    // Middle tier (3 logs)
    { z: -0.18, y: 0.315, r: 0.088, len: 0.98, ry: -0.01 },
    { z: 0.005, y: 0.322, r: 0.092, len: 1.02, ry: 0.015 },
    { z: 0.19,  y: 0.31,  r: 0.085, len: 0.96, ry: -0.016 },
    // Top tier (2 logs + 1 cap)
    { z: -0.09, y: 0.468, r: 0.082, len: 0.94, ry: 0.02 },
    { z: 0.09,  y: 0.462, r: 0.08,  len: 0.92, ry: -0.018 },
    { z: 0.0,   y: 0.60,  r: 0.074, len: 0.86, ry: 0.012 }
  ];

  logSpecs.forEach((ls) => {
    const logGeo = new THREE.CylinderGeometry(ls.r, ls.r * 1.03, ls.len, 9);
    const log = new THREE.Mesh(logGeo, logMultiMat);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = ls.ry;
    log.position.set(0, ls.y, ls.z);
    log.castShadow = true;
    log.receiveShadow = true;
    g.add(log);
  });

  // Adjacent chopping stump + camp hatchet + freshly split side pieces
  const stumpGroup = new THREE.Group();
  stumpGroup.position.set(0.92, 0, 0.2);

  const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.275, 0.44, 11), stumpMultiMat);
  stump.position.y = 0.22;
  stump.castShadow = true;
  stump.receiveShadow = true;
  stumpGroup.add(stump);

  const hatchetGroup = new THREE.Group();
  hatchetGroup.position.set(0.02, 0.44, -0.02);
  hatchetGroup.rotation.set(0.22, 0.48, -0.42);

  const axeBlade = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.105, 0.026), steelMat);
  axeBlade.position.set(0, 0.02, 0);
  hatchetGroup.add(axeBlade);

  const axeHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.44, 7), handleMat);
  axeHandle.position.set(-0.04, 0.23, 0);
  axeHandle.rotation.z = 0.14;
  hatchetGroup.add(axeHandle);
  stumpGroup.add(hatchetGroup);

  const splitA = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.075, 0.46, 6, 1, false, 0, Math.PI), logMultiMat);
  splitA.position.set(-0.28, 0.18, 0.18);
  splitA.rotation.set(0.32, 0.4, 0.36);
  splitA.castShadow = true;
  stumpGroup.add(splitA);

  const splitB = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.07, 0.42, 6, 1, false, 0, Math.PI), logMultiMat);
  splitB.position.set(-0.18, 0.068, 0.32);
  splitB.rotation.set(Math.PI / 2, 0.15, 0.85);
  splitB.castShadow = true;
  stumpGroup.add(splitB);

  g.add(stumpGroup);
  return g;
}

// ===================================================================
// 10. Animal Crossing-Style Wooden Signpost ("은하재 작은 순간들이 머무는 곳")
// ===================================================================
function createSignpostPlaqueTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 576;
  const ctx = canvas.getContext('2d');

  // Warm honey-oak plank base gradient for crisp dark lettering contrast
  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, '#dcb278');
  bg.addColorStop(0.5, '#cfa064');
  bg.addColorStop(1, '#bc8b4e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle horizontal plank seams & organic wood grain lines
  ctx.strokeStyle = 'rgba(72, 40, 18, 0.2)';
  ctx.lineWidth = 4;
  [192, 384].forEach((py) => {
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(canvas.width, py);
    ctx.stroke();
  });

  ctx.strokeStyle = 'rgba(92, 54, 24, 0.1)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 24; i++) {
    const gy = 18 + i * 23;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.bezierCurveTo(
      320, gy + Math.sin(i * 1.4) * 7,
      680, gy - Math.cos(i * 0.9) * 7,
      canvas.width, gy + Math.sin(i * 0.7) * 4
    );
    ctx.stroke();
  }

  // Carved inner wooden border + brass corner nails
  ctx.strokeStyle = '#5a341b';
  ctx.lineWidth = 10;
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);
  ctx.strokeStyle = 'rgba(255, 240, 204, 0.34)';
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);

  [
    [56, 56],
    [canvas.width - 56, 56],
    [56, canvas.height - 56],
    [canvas.width - 56, canvas.height - 56]
  ].forEach(([nx, ny]) => {
    ctx.fillStyle = '#3b2414';
    ctx.beginPath();
    ctx.arc(nx, ny, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e0b76e';
    ctx.beginPath();
    ctx.arc(nx - 2, ny - 2, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Top decorative little star crest
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff5d6';
  ctx.font = '700 34px "Gowun Batang", serif';
  ctx.fillText('✦  •  ✦', canvas.width / 2, 92);

  // Prominent main title: 은하재 (much larger & crisp carved dark woodburned feel)
  ctx.font = '800 148px "Gowun Batang", serif';
  ctx.fillStyle = 'rgba(255, 242, 210, 0.45)';
  ctx.fillText('은하재', canvas.width / 2, 248);
  ctx.fillStyle = '#210f05';
  ctx.fillText('은하재', canvas.width / 2, 244);

  // Clean horizontal divider
  ctx.strokeStyle = 'rgba(72, 40, 18, 0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(220, 352);
  ctx.lineTo(canvas.width - 220, 352);
  ctx.stroke();

  // Subtitle: 작은 순간들이 머무는 곳
  ctx.font = '700 46px "Gowun Batang", serif';
  ctx.fillStyle = 'rgba(255, 244, 214, 0.42)';
  ctx.fillText('작은 순간들이 머무는 곳', canvas.width / 2, 434);
  ctx.fillStyle = '#2d1609';
  ctx.fillText('작은 순간들이 머무는 곳', canvas.width / 2, 430);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createEunhajaeSignpost(x, z, yaw = Math.PI - 0.15, glowTexture, maxAnisotropy = 4) {
  const g = new THREE.Group();
  const baseY = groundHeightAt(x, z);
  g.position.set(x, baseY, z);
  g.rotation.y = yaw;

  const postWoodMat = new THREE.MeshStandardMaterial({ color: 0x563723, roughness: 0.88 });
  const roofWoodMat = new THREE.MeshStandardMaterial({ color: 0x42291a, roughness: 0.86 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x4c4756, roughness: 0.9 });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x2a2732, roughness: 0.55, metalness: 0.55 });

  // Grounded stone collar + 3 river pebbles so post sits firmly on hill turf
  const baseCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.12, 9), stoneMat);
  baseCollar.position.y = 0.06;
  baseCollar.receiveShadow = true;
  g.add(baseCollar);

  [
    { px: -0.26, pz: 0.14, r: 0.08 },
    { px: 0.24, pz: 0.16, r: 0.065 },
    { px: 0.18, pz: -0.2, r: 0.072 }
  ].forEach((p) => {
    const pebble = new THREE.Mesh(new THREE.DodecahedronGeometry(p.r, 0), stoneMat);
    pebble.scale.set(1.2, 0.65, 1.0);
    pebble.position.set(p.px, p.r * 0.42, p.pz);
    pebble.receiveShadow = true;
    g.add(pebble);
  });

  // Main cedar signpost pole terminating cleanly inside bottom of board (never overlaps plaque faces)
  const mainPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.102, 0.84, 10), postWoodMat);
  mainPost.position.y = 0.42;
  mainPost.castShadow = true;
  g.add(mainPost);

  // Thick dark walnut frame board backing
  const boardBack = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.94, 0.16), roofWoodMat);
  boardBack.position.y = 1.24;
  boardBack.castShadow = true;
  boardBack.receiveShadow = true;
  g.add(boardBack);

  // Double-sided high-res carved wooden plaque texture mounted cleanly outside boardBack
  const signTex = createSignpostPlaqueTexture();
  signTex.anisotropy = maxAnisotropy;
  const plaqueMat = new THREE.MeshStandardMaterial({
    map: signTex,
    emissive: 0xffe4ad,
    emissiveMap: signTex,
    emissiveIntensity: 0.28,
    roughness: 0.76,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });
  const plaqueGeo = new THREE.PlaneGeometry(1.42, 0.8);

  const frontPlaque = new THREE.Mesh(plaqueGeo, plaqueMat);
  frontPlaque.position.set(0, 1.24, 0.084);
  g.add(frontPlaque);

  const backPlaque = new THREE.Mesh(plaqueGeo, plaqueMat);
  backPlaque.position.set(0, 1.24, -0.084);
  backPlaque.rotation.y = Math.PI;
  g.add(backPlaque);

  // Animal Crossing pitched wooden shingle hood + ridge beam + rounded end pegs
  const roofPlankGeo = new THREE.BoxGeometry(0.92, 0.065, 0.46);
  const leftRoof = new THREE.Mesh(roofPlankGeo, roofWoodMat);
  leftRoof.position.set(-0.42, 1.81, 0);
  leftRoof.rotation.z = 0.24;
  leftRoof.castShadow = true;
  g.add(leftRoof);

  const rightRoof = new THREE.Mesh(roofPlankGeo, roofWoodMat);
  rightRoof.position.set(0.42, 1.81, 0);
  rightRoof.rotation.z = -0.24;
  rightRoof.castShadow = true;
  g.add(rightRoof);

  const ridgeBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 1.76, 8), postWoodMat);
  ridgeBeam.rotation.z = Math.PI / 2;
  ridgeBeam.position.set(0, 1.91, 0);
  ridgeBeam.castShadow = true;
  g.add(ridgeBeam);

  // Side lantern peg + cozy warm glowing mini glass trail lantern
  const armBracket = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.055, 0.055), postWoodMat);
  armBracket.position.set(0.92, 1.56, 0);
  g.add(armBracket);

  const hookStem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 6), ironMat);
  hookStem.position.set(1.03, 1.47, 0);
  g.add(hookStem);

  const lanternCap = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.075, 6), ironMat);
  lanternCap.position.set(1.03, 1.39, 0);
  g.add(lanternCap);

  const lanternGlassMat = new THREE.MeshStandardMaterial({
    color: 0xffe49e,
    emissive: 0xffc663,
    emissiveIntensity: 1.4,
    roughness: 0.35
  });
  const lanternGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.12, 6), lanternGlassMat);
  lanternGlass.position.set(1.03, 1.30, 0);
  g.add(lanternGlass);

  if (glowTexture) {
    const aura = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: 0xffd584,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    aura.position.set(1.03, 1.30, 0);
    aura.scale.set(0.95, 0.95, 1);
    g.add(aura);
  }

  g.userData.worldCenter = new THREE.Vector3(x, baseY + 1.24, z);
  return g;
}
