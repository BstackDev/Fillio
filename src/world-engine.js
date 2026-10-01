(() => {
  'use strict';

  const canvas = document.getElementById('world-canvas');
  if (!canvas) return;

  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const narrowScreen = window.matchMedia('(max-width: 760px)');
  const pointer = { x: 0.5, y: 0.45 };
  const random = (() => {
    let seed = 72341;
    return () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  })();

  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let frame = 0;
  let previousFrame = 0;
  let scrollPosition = 0;
  let targetScrollPosition = 0;
  let cameraX = 0;
  let cameraY = 0;
  let cameraImpulse = 0;
  let eventStrength = 0;
  let eventUntil = 0;
  let nextEventTimer = 0;
  let dust = [];
  let farRidges = [];
  let structures = [];

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    pixelRatio = Math.min(window.devicePixelRatio || 1, narrowScreen.matches ? 1 : 1.35);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const density = narrowScreen.matches ? 0.000018 : 0.000031;
    dust = Array.from({ length: Math.min(68, Math.max(22, Math.round(width * height * density))) }, () => ({
      x: random() * width,
      y: random() * height,
      depth: 0.15 + random() * 0.85,
      radius: 0.35 + random() * 1.5,
      phase: random() * Math.PI * 2,
      drift: 0.12 + random() * 0.5
    }));

    farRidges = Array.from({ length: 4 }, (_, layer) => {
      const points = [];
      const step = width / 11;
      for (let index = -1; index <= 12; index += 1) {
        points.push({
          x: index * step,
          y: height * (0.48 + layer * 0.075) + (random() - 0.5) * height * (0.045 + layer * 0.012)
        });
      }
      return { points, layer };
    });

    structures = Array.from({ length: 19 }, (_, index) => {
      const scale = 0.32 + random() * 0.95;
      const side = index % 2 === 0 ? -1 : 1;
      const lane = random();
      return {
        x: width * (0.08 + lane * 0.84),
        base: height * (0.55 + random() * 0.22),
        w: (15 + random() * 38) * scale,
        h: (65 + random() * 190) * scale,
        lean: side * (random() * 0.11),
        depth: 0.25 + random() * 0.7,
        seed: random()
      };
    });
  }

  function fillPolygon(points, fill, stroke, lineWidth = 1) {
    context.beginPath();
    points.forEach((point, index) => {
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
    context.closePath();
    context.fillStyle = fill;
    context.fill();
    if (stroke) {
      context.strokeStyle = stroke;
      context.lineWidth = lineWidth;
      context.stroke();
    }
  }

  function drawSky(time, cameraX, cameraY) {
    const worldShift = Math.min(1, scrollPosition / Math.max(height * 2.2, 1));
    const sky = context.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, 'rgba(3, 3, 7, 0.98)');
    sky.addColorStop(0.38, 'rgba(12, 5, 17, 0.78)');
    sky.addColorStop(0.69, 'rgba(34, 5, 15, 0.52)');
    sky.addColorStop(1, 'rgba(4, 3, 5, 0.86)');
    context.fillStyle = sky;
    context.fillRect(0, 0, width, height);

    const coreX = width * (0.53 + cameraX * 0.008);
    const coreY = height * (0.38 + cameraY * 0.008);
    const bloomRadius = Math.max(width, height) * 0.62;
    const bloom = context.createRadialGradient(coreX, coreY, 0, coreX, coreY, bloomRadius);
    const pulse = 0.82 + Math.sin(time * 0.00021) * 0.08;
    bloom.addColorStop(0, `rgba(${112 - worldShift * 41}, ${24 + worldShift * 9}, ${79 + worldShift * 66}, ${0.11 * pulse})`);
    bloom.addColorStop(0.24, `rgba(${62 - worldShift * 16}, ${16 + worldShift * 10}, ${74 + worldShift * 38}, 0.13)`);
    bloom.addColorStop(0.56, `rgba(${38 - worldShift * 12}, ${6 + worldShift * 3}, ${22 + worldShift * 20}, 0.09)`);
    bloom.addColorStop(1, 'rgba(4, 3, 6, 0)');
    context.fillStyle = bloom;
    context.fillRect(0, 0, width, height);

    const wound = context.createRadialGradient(width * 0.54, height * 0.43, 0, width * 0.54, height * 0.43, height * 0.35);
    wound.addColorStop(0, `rgba(255, 57, 64, ${0.17 - worldShift * 0.1})`);
    wound.addColorStop(0.08, `rgba(${188 - worldShift * 50}, 14, ${43 + worldShift * 52}, ${0.13 - worldShift * 0.075})`);
    wound.addColorStop(0.34, `rgba(${83 - worldShift * 22}, 4, ${24 + worldShift * 26}, 0.055)`);
    wound.addColorStop(1, 'rgba(5, 2, 6, 0)');
    context.fillStyle = wound;
    context.fillRect(0, 0, width, height);

    for (let index = 0; index < 42; index += 1) {
      const x = (index * 193.7 + 31) % width;
      const y = (index * 97.3 + 23) % (height * 0.66);
      const twinkle = 0.15 + (Math.sin(time * 0.0005 + index * 1.7) + 1) * 0.13;
      context.fillStyle = `rgba(213, 195, 214, ${twinkle})`;
      context.fillRect(x + cameraX * 0.1, y + cameraY * 0.1, index % 11 === 0 ? 1.4 : 0.7, index % 11 === 0 ? 1.4 : 0.7);
    }
  }

  function drawDimensionalTear(time, cameraX, cameraY) {
    const centerX = width * (0.54 + Math.sin(time * 0.00017) * 0.014) + cameraX * 0.18;
    const centerY = height * 0.37 + cameraY * 0.1;
    const pulse = 0.72 + Math.sin(time * 0.0008) * 0.13 + eventStrength * 0.65;
    const heightTear = height * 0.92;
    const widthTear = Math.max(44, width * 0.075);
    const halo = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, width * 0.39);
    halo.addColorStop(0, `rgba(169, 23, 72, ${0.12 * pulse})`);
    halo.addColorStop(0.18, `rgba(92, 26, 126, ${0.08 * pulse})`);
    halo.addColorStop(1, 'rgba(7, 3, 11, 0)');
    context.fillStyle = halo;
    context.fillRect(centerX - width * 0.4, centerY - height * 0.5, width * 0.8, height);

    const tear = context.createLinearGradient(centerX - widthTear, 0, centerX + widthTear, 0);
    tear.addColorStop(0, 'rgba(52, 13, 67, 0)');
    tear.addColorStop(0.35, `rgba(111, 25, 137, ${0.09 * pulse})`);
    tear.addColorStop(0.49, `rgba(251, 54, 87, ${0.17 * pulse})`);
    tear.addColorStop(0.51, `rgba(255, 181, 185, ${0.24 * pulse})`);
    tear.addColorStop(0.54, `rgba(114, 15, 55, ${0.14 * pulse})`);
    tear.addColorStop(1, 'rgba(44, 8, 55, 0)');
    context.save();
    context.translate(centerX, centerY);
    context.rotate(-0.09 + Math.sin(time * 0.00012) * 0.018);
    context.fillStyle = tear;
    context.beginPath();
    context.moveTo(-widthTear * 0.22, -heightTear * 0.57);
    context.bezierCurveTo(widthTear * 0.15, -heightTear * 0.39, -widthTear * 0.46, -heightTear * 0.25, widthTear * 0.08, -heightTear * 0.08);
    context.bezierCurveTo(widthTear * 0.44, heightTear * 0.09, -widthTear * 0.2, heightTear * 0.19, widthTear * 0.19, heightTear * 0.36);
    context.bezierCurveTo(widthTear * 0.34, heightTear * 0.46, -widthTear * 0.2, heightTear * 0.51, widthTear * 0.02, heightTear * 0.57);
    context.lineTo(widthTear * 0.54, heightTear * 0.57);
    context.bezierCurveTo(widthTear * 0.18, heightTear * 0.39, widthTear * 0.59, heightTear * 0.23, widthTear * 0.2, heightTear * 0.08);
    context.bezierCurveTo(-widthTear * 0.13, -heightTear * 0.08, widthTear * 0.46, -heightTear * 0.22, widthTear * 0.12, -heightTear * 0.39);
    context.lineTo(widthTear * 0.3, -heightTear * 0.57);
    context.closePath();
    context.shadowColor = `rgba(255, 30, 72, ${0.3 + eventStrength * 0.42})`;
    context.shadowBlur = 22 + eventStrength * 28;
    context.fill();
    context.shadowBlur = 0;

    context.beginPath();
    context.moveTo(0, -heightTear * 0.53);
    context.lineTo(-widthTear * 0.13, -heightTear * 0.22);
    context.lineTo(widthTear * 0.12, -heightTear * 0.04);
    context.lineTo(-widthTear * 0.08, heightTear * 0.16);
    context.lineTo(widthTear * 0.07, heightTear * 0.49);
    context.strokeStyle = `rgba(255, 147, 163, ${0.2 + pulse * 0.12})`;
    context.lineWidth = 1.2;
    context.shadowColor = 'rgba(255, 34, 74, 0.8)';
    context.shadowBlur = 11;
    context.stroke();
    context.restore();
  }

  function drawRidges(cameraX, cameraY) {
    farRidges.forEach(({ points, layer }) => {
      const depth = 0.08 + layer * 0.045;
      const baseline = height * (0.77 + layer * 0.035) + scrollPosition * depth;
      const silhouette = points.map((point) => ({
        x: point.x + cameraX * depth * 0.25,
        y: point.y + (baseline - height * (0.48 + layer * 0.075)) + cameraY * depth * 0.15
      }));
      silhouette.push({ x: width + 30, y: height + 20 }, { x: -30, y: height + 20 });

      const shade = 8 + layer * 3;
      const gradient = context.createLinearGradient(0, height * 0.45, 0, height);
      gradient.addColorStop(0, `rgba(${shade + 22}, ${shade + 9}, ${shade + 31}, ${0.36 + layer * 0.08})`);
      gradient.addColorStop(0.35, `rgba(${shade + 8}, ${shade + 3}, ${shade + 11}, 0.94)`);
      gradient.addColorStop(1, 'rgba(3, 3, 5, 0.98)');
      fillPolygon(silhouette, gradient, `rgba(165, 76, 97, ${0.045 + layer * 0.012})`);

      context.beginPath();
      points.forEach((point, index) => {
        const y = point.y + (baseline - height * (0.48 + layer * 0.075)) + cameraY * depth * 0.15;
        if (index === 0) context.moveTo(point.x + cameraX * depth * 0.25, y);
        else context.lineTo(point.x + cameraX * depth * 0.25, y);
      });
      context.strokeStyle = `rgba(177, 115, 133, ${0.035 + layer * 0.018})`;
      context.lineWidth = 1;
      context.stroke();
    });
  }

  function drawCity(cameraX, cameraY, time) {
    structures.forEach((building, index) => {
      const x = building.x + cameraX * building.depth * 0.55;
      const base = building.base + scrollPosition * building.depth * 0.48 + cameraY * building.depth * 0.16;
      const top = base - building.h;
      const lean = building.lean * building.h;
      const front = [
        { x: x - building.w * 0.5, y: base },
        { x: x - building.w * 0.38 + lean, y: top + building.h * 0.13 },
        { x: x - building.w * 0.18 + lean * 0.7, y: top },
        { x: x + building.w * 0.46 + lean, y: top + building.h * 0.09 },
        { x: x + building.w * 0.36, y: base }
      ];
      const shade = 7 + Math.round(building.depth * 15);
      const stone = context.createLinearGradient(x - building.w / 2, top, x + building.w / 2, base);
      stone.addColorStop(0, `rgba(${shade + 13}, ${shade + 8}, ${shade + 20}, 0.82)`);
      stone.addColorStop(0.2, `rgba(${shade + 5}, ${shade + 3}, ${shade + 8}, 0.95)`);
      stone.addColorStop(1, 'rgba(3, 3, 5, 0.98)');
      fillPolygon(front, stone, 'rgba(188, 143, 161, 0.11)', 0.7);

      const sideShade = context.createLinearGradient(x + building.w * 0.1, top, x + building.w * 0.6, base);
      sideShade.addColorStop(0, 'rgba(1, 1, 3, 0.18)');
      sideShade.addColorStop(1, 'rgba(1, 1, 3, 0.82)');
      fillPolygon([
        { x: x + building.w * 0.18 + lean * 0.7, y: top },
        { x: x + building.w * 0.46 + lean, y: top + building.h * 0.09 },
        { x: x + building.w * 0.36, y: base },
        { x: x + building.w * 0.02, y: base }
      ], sideShade);

      context.save();
      context.beginPath();
      front.forEach((point, pointIndex) => pointIndex ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
      context.closePath();
      context.clip();
      const courses = Math.max(3, Math.floor(building.h / 19));
      for (let course = 1; course < courses; course += 1) {
        const y = top + course * (building.h / courses);
        context.beginPath();
        context.moveTo(x - building.w, y);
        context.lineTo(x + building.w, y - course * 0.7);
        context.strokeStyle = `rgba(190, 148, 162, ${0.045 + building.depth * 0.02})`;
        context.lineWidth = 0.65;
        context.stroke();
      }

      const windows = Math.max(1, Math.floor(building.w / 12));
      for (let row = 0; row < Math.max(2, Math.floor(building.h / 29)); row += 1) {
        for (let column = 0; column < windows; column += 1) {
          const windowX = x - building.w * 0.28 + column * (building.w * 0.47 / Math.max(windows, 1));
          const windowY = top + 16 + row * 27;
          if (windowY > base - 9) continue;
          const active = (Math.floor(building.seed * 100) + row * 5 + column * 3) % 13 === 0;
          context.fillStyle = active ? 'rgba(255, 75, 83, 0.42)' : 'rgba(164, 74, 106, 0.13)';
          context.fillRect(windowX, windowY, Math.max(1, building.w * 0.035), 5 + building.depth * 3);
        }
      }

      if (building.seed > 0.55) {
        context.beginPath();
        context.moveTo(x + building.w * 0.12, top + building.h * 0.18);
        context.lineTo(x + building.w * 0.01, top + building.h * 0.39);
        context.lineTo(x + building.w * 0.16, top + building.h * 0.57);
        context.lineTo(x - building.w * 0.05, top + building.h * 0.82);
        context.strokeStyle = `rgba(255, 31, 64, ${0.12 + Math.sin(time * 0.001 + index) * 0.045})`;
        context.lineWidth = Math.max(0.8, building.depth * 1.5);
        context.shadowColor = 'rgba(255, 18, 54, 0.56)';
        context.shadowBlur = 9 * building.depth;
        context.stroke();
        context.shadowBlur = 0;
      }
      context.restore();

      if (building.depth > 0.68) {
        context.beginPath();
        context.moveTo(x - building.w * 0.3, base - 3);
        context.lineTo(x - building.w * 0.62, base + 18 * building.depth);
        context.moveTo(x + building.w * 0.23, base - 2);
        context.lineTo(x + building.w * 0.6, base + 14 * building.depth);
        context.strokeStyle = 'rgba(128, 103, 113, 0.17)';
        context.lineWidth = Math.max(1, building.depth * 3);
        context.stroke();
      }
    });
  }

  function drawFallenTower(cameraX, cameraY, time) {
    const centerX = width * (0.52 + pointer.x * 0.014 + cameraX * 0.0015);
    const base = height * 0.84 + scrollPosition * 0.2 + cameraY * 0.08;
    const scale = Math.max(0.72, Math.min(width / 1200, height / 760));
    const towerHeight = Math.min(height * 0.79, 650 * scale);
    const top = base - towerHeight;
    const shaftW = Math.max(74, width * 0.095) * scale;
    const sway = Math.sin(time * 0.00016) * 4;

    const aura = context.createRadialGradient(centerX + sway, top + towerHeight * 0.44, 0, centerX + sway, top + towerHeight * 0.44, towerHeight * 0.74);
    aura.addColorStop(0, 'rgba(215, 17, 54, 0.15)');
    aura.addColorStop(0.22, 'rgba(104, 17, 91, 0.09)');
    aura.addColorStop(1, 'rgba(9, 3, 11, 0)');
    context.fillStyle = aura;
    context.fillRect(centerX - towerHeight, top - towerHeight * 0.24, towerHeight * 2, towerHeight * 1.55);

    context.save();
    context.translate(centerX + sway, 0);
    const left = -shaftW * 0.52;
    const right = shaftW * 0.48;
    const towerFace = context.createLinearGradient(left, 0, right, 0);
    towerFace.addColorStop(0, 'rgba(2, 2, 5, 0.98)');
    towerFace.addColorStop(0.15, 'rgba(19, 12, 24, 0.97)');
    towerFace.addColorStop(0.46, 'rgba(7, 6, 12, 0.99)');
    towerFace.addColorStop(0.72, 'rgba(23, 7, 17, 0.98)');
    towerFace.addColorStop(1, 'rgba(1, 2, 4, 1)');
    fillPolygon([
      { x: left * 0.58, y: base },
      { x: left * 0.7, y: top + towerHeight * 0.11 },
      { x: left * 0.3, y: top + towerHeight * 0.025 },
      { x: left * 0.06, y: top },
      { x: right * 0.46, y: top + towerHeight * 0.045 },
      { x: right * 0.61, y: top + towerHeight * 0.19 },
      { x: right * 0.48, y: base }
    ], towerFace, 'rgba(198, 166, 180, 0.21)', 1.15);

    const side = context.createLinearGradient(right * 0.22, top, right, base);
    side.addColorStop(0, 'rgba(56, 9, 26, 0.64)');
    side.addColorStop(0.35, 'rgba(18, 5, 13, 0.93)');
    side.addColorStop(1, 'rgba(2, 2, 4, 1)');
    fillPolygon([
      { x: right * 0.42, y: top + towerHeight * 0.045 },
      { x: right * 0.61, y: top + towerHeight * 0.19 },
      { x: right * 0.48, y: base },
      { x: right * 0.18, y: base }
    ], side);

    for (let rib = 0; rib < 7; rib += 1) {
      const ratio = rib / 6;
      const x = left * 0.46 + (right * 0.32 - left * 0.46) * ratio;
      const ribGradient = context.createLinearGradient(x - 3, 0, x + 5, 0);
      ribGradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      ribGradient.addColorStop(0.45, 'rgba(133, 105, 125, 0.25)');
      ribGradient.addColorStop(1, 'rgba(1, 1, 3, 0.88)');
      context.fillStyle = ribGradient;
      context.beginPath();
      context.moveTo(x - 5, base);
      context.lineTo(x - 4 + ratio * 10, top + towerHeight * (0.06 + ratio * 0.04));
      context.lineTo(x + 3 + ratio * 12, top + towerHeight * (0.1 + ratio * 0.05));
      context.lineTo(x + 6, base);
      context.fill();
    }

    for (let floor = 0; floor < 22; floor += 1) {
      const y = top + towerHeight * (0.12 + floor * 0.036);
      const inset = Math.sin(floor * 0.75) * 5;
      context.beginPath();
      context.moveTo(left * 0.53 + inset, y);
      context.lineTo(right * 0.43 - inset, y + (floor % 3 === 0 ? 2.5 : 0));
      context.strokeStyle = `rgba(182, 149, 162, ${floor % 3 === 0 ? 0.12 : 0.052})`;
      context.lineWidth = floor % 4 === 0 ? 1.2 : 0.55;
      context.stroke();

      if (floor % 2 === 0) {
        const lightX = left * 0.18 + Math.sin(floor * 2.1) * shaftW * 0.17;
        context.fillStyle = floor % 6 === 0 ? 'rgba(255, 69, 75, 0.58)' : 'rgba(171, 51, 74, 0.22)';
        context.fillRect(lightX, y - 12, Math.max(2, shaftW * 0.018), 7 + floor % 3);
      }
    }

    const crackPoints = [
      [left * 0.04, top + towerHeight * 0.18],
      [left * 0.22, top + towerHeight * 0.29],
      [left * 0.08, top + towerHeight * 0.34],
      [left * 0.27, top + towerHeight * 0.49],
      [left * 0.08, top + towerHeight * 0.58],
      [left * 0.19, top + towerHeight * 0.71],
      [left * 0.02, top + towerHeight * 0.82]
    ];
    context.beginPath();
    crackPoints.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y));
    context.strokeStyle = `rgba(255, 28, 60, ${0.31 + Math.sin(time * 0.0011) * 0.11})`;
    context.lineWidth = Math.max(1, 2.2 * scale);
    context.shadowColor = 'rgba(255, 11, 52, 0.9)';
    context.shadowBlur = 18 * scale;
    context.stroke();
    context.shadowBlur = 0;

    context.beginPath();
    context.moveTo(left * 0.1, top + towerHeight * 0.015);
    context.lineTo(left * 0.03, top - height * 0.06);
    context.lineTo(right * 0.1, top + towerHeight * 0.025);
    context.moveTo(right * 0.25, top + towerHeight * 0.06);
    context.lineTo(right * 0.32, top - height * 0.08);
    context.lineTo(right * 0.41, top + towerHeight * 0.1);
    context.strokeStyle = 'rgba(115, 104, 126, 0.34)';
    context.lineWidth = 2 * scale;
    context.stroke();
    context.restore();
  }

  function drawFloatingDebris(cameraX, cameraY, time) {
    for (let index = 0; index < 20; index += 1) {
      const depth = 0.2 + (index % 5) * 0.15;
      const x = ((index * 227 + 43 + cameraX * depth * 0.5 + width) % (width + 100)) - 50;
      const bob = Math.sin(time * 0.00048 + index * 1.37) * 25 * depth;
      const y = height * (0.16 + ((index * 53) % 65) / 100) + bob + cameraY * depth * 0.3;
      const size = 5 + (index % 5) * 5;
      context.save();
      context.translate(x, y);
      context.rotate(Math.sin(time * 0.00031 + index) * 0.38);
      fillPolygon([
        { x: -size * 0.5, y: -size * 0.2 },
        { x: size * 0.1, y: -size * 0.65 },
        { x: size * 0.72, y: -size * 0.1 },
        { x: size * 0.26, y: size * 0.64 },
        { x: -size * 0.68, y: size * 0.3 }
      ], `rgba(15, 12, 22, ${0.24 + depth * 0.35})`, `rgba(187, 137, 163, ${0.1 + depth * 0.12})`);
      context.restore();
    }

    for (let index = 0; index < 6; index += 1) {
      const side = index % 2 === 0 ? -1 : 1;
      const size = 36 + (index % 3) * 24;
      const x = side < 0 ? width * (0.04 + (index % 3) * 0.055) : width * (0.96 - (index % 3) * 0.055);
      const y = height * (0.52 + Math.sin(time * 0.0002 + index * 2) * 0.11) + cameraY * 0.55;
      context.save();
      context.translate(x + cameraX * 0.5, y);
      context.rotate(side * (-0.2 + Math.sin(time * 0.00019 + index) * 0.08));
      const nearStone = context.createLinearGradient(-size, -size, size, size);
      nearStone.addColorStop(0, 'rgba(79, 49, 63, 0.24)');
      nearStone.addColorStop(0.28, 'rgba(24, 18, 27, 0.83)');
      nearStone.addColorStop(1, 'rgba(2, 3, 5, 0.98)');
      fillPolygon([
        { x: -size * 0.78, y: size * 0.28 },
        { x: -size * 0.35, y: -size * 0.72 },
        { x: size * 0.22, y: -size * 0.52 },
        { x: size * 0.78, y: size * 0.17 },
        { x: size * 0.34, y: size * 0.68 },
        { x: -size * 0.5, y: size * 0.61 }
      ], nearStone, 'rgba(183, 142, 159, 0.15)', 1);
      context.beginPath();
      context.moveTo(-size * 0.35, -size * 0.72);
      context.lineTo(size * 0.22, -size * 0.52);
      context.lineTo(size * 0.12, size * 0.15);
      context.strokeStyle = 'rgba(255, 71, 94, 0.18)';
      context.lineWidth = 1.2;
      context.stroke();
      context.restore();
    }
  }

  function drawFog(time, cameraX, cameraY) {
    context.save();
    context.globalCompositeOperation = 'screen';
    for (let layer = 0; layer < 5; layer += 1) {
      const depth = 0.13 + layer * 0.12;
      const wave = Math.sin(time * 0.00029 + layer * 1.8);
      const x = width * (0.08 + layer * 0.22) + cameraX * depth + wave * width * 0.085;
      const y = height * (0.56 + layer * 0.065) + cameraY * depth + Math.cos(time * 0.00024 + layer) * 23;
      const radius = width * (0.34 + layer * 0.055);
      const fog = context.createRadialGradient(x, y, 0, x, y, radius);
      const alpha = 0.034 + (layer % 2) * 0.014 + eventStrength * 0.012;
      fog.addColorStop(0, `rgba(${layer % 2 ? '81, 45, 112' : '135, 37, 66'}, ${alpha})`);
      fog.addColorStop(0.36, `rgba(${layer % 2 ? '52, 25, 73' : '84, 22, 46'}, ${alpha * 0.62})`);
      fog.addColorStop(1, 'rgba(4, 3, 6, 0)');
      context.fillStyle = fog;
      context.fillRect(0, y - radius, width, radius * 2);
    }

    for (let layer = 0; layer < 4; layer += 1) {
      const phase = time * (0.00018 + layer * 0.000025) + layer * 2.3;
      const flow = ((time * (0.018 + layer * 0.004) + layer * width * 0.37) % (width * 1.8)) - width * 0.4;
      const bandY = height * (0.62 + layer * 0.06) + Math.sin(phase) * 21 + cameraY * (0.1 + layer * 0.05);
      const bandHeight = height * (0.035 + layer * 0.006);
      const ribbon = context.createLinearGradient(0, bandY - bandHeight, 0, bandY + bandHeight);
      ribbon.addColorStop(0, 'rgba(107, 63, 126, 0)');
      ribbon.addColorStop(0.48, `rgba(${layer % 2 ? '126, 56, 111' : '151, 57, 74'}, ${0.035 + eventStrength * 0.02})`);
      ribbon.addColorStop(1, 'rgba(36, 20, 49, 0)');
      context.fillStyle = ribbon;
      context.beginPath();
      context.moveTo(-width * 0.2, bandY + bandHeight);
      context.bezierCurveTo(flow - width * 0.24, bandY - bandHeight * 0.9, flow + width * 0.22, bandY + bandHeight * 0.86, width * 1.2, bandY - bandHeight * 0.34);
      context.lineTo(width * 1.2, bandY + bandHeight * 1.1);
      context.bezierCurveTo(flow + width * 0.25, bandY + bandHeight * 2, flow - width * 0.18, bandY + bandHeight * 0.05, -width * 0.2, bandY + bandHeight);
      context.fill();
    }
    context.restore();
  }

  function drawDust(time, cameraX, cameraY) {
    dust.forEach((particle) => {
      const gust = eventStrength * Math.sin(particle.phase * 3) * 1.8;
      const x = (particle.x + Math.sin(time * 0.00034 + particle.phase) * 38 * particle.depth + cameraX * particle.depth * 0.22 + gust * time * 0.0004 + width) % width;
      const y = (particle.y - time * particle.drift * 0.043 + Math.cos(time * 0.00026 + particle.phase) * 12 + cameraY * particle.depth * 0.16 + height * 10) % height;
      const shimmer = 0.13 + (Math.sin(time * 0.0011 + particle.phase) + 1) * 0.13 + eventStrength * 0.12;
      const red = particle.phase > 3.1;
      context.beginPath();
      context.arc(x, y, particle.radius * particle.depth, 0, Math.PI * 2);
      context.fillStyle = red ? `rgba(255, 92, 92, ${shimmer})` : `rgba(205, 193, 222, ${shimmer * 0.68})`;
      context.shadowColor = red ? 'rgba(255, 26, 57, 0.6)' : 'rgba(128, 91, 172, 0.3)';
      context.shadowBlur = particle.radius * (red ? 6 : 3);
      context.fill();

      if (particle.depth > 0.7 && particle.radius > 1.1) {
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x - gust * 1.8 - 1.5, y + particle.drift * 5);
        context.strokeStyle = red ? `rgba(255, 74, 91, ${shimmer * 0.34})` : `rgba(203, 182, 219, ${shimmer * 0.2})`;
        context.lineWidth = 0.6;
        context.stroke();
      }
    });
    context.shadowBlur = 0;
  }

  function drawDistantWatcher(time, strength) {
    if (strength < 0.02) return;
    const x = width * 0.77;
    const y = height * 0.48;
    const scale = Math.min(width, height) * 0.04;
    context.save();
    context.globalAlpha = strength * 0.42;
    fillPolygon([
      { x: x - scale * 0.5, y: y + scale * 2.9 },
      { x: x - scale * 0.38, y: y + scale * 0.6 },
      { x: x - scale * 0.72, y: y - scale * 0.05 },
      { x: x - scale * 0.34, y: y - scale * 2.2 },
      { x, y: y - scale * 2.8 },
      { x: x + scale * 0.38, y: y - scale * 1.9 },
      { x: x + scale * 0.28, y: y + scale * 0.7 },
      { x: x + scale * 0.68, y: y + scale * 2.9 }
    ], 'rgba(3, 2, 6, 0.94)', 'rgba(186, 95, 128, 0.24)');
    const eye = context.createRadialGradient(x, y - scale * 1.7, 0, x, y - scale * 1.7, scale * 0.55);
    eye.addColorStop(0, `rgba(255, 197, 205, ${0.78 + Math.sin(time * 0.01) * 0.18})`);
    eye.addColorStop(0.2, 'rgba(255, 32, 75, 0.72)');
    eye.addColorStop(1, 'rgba(255, 24, 74, 0)');
    context.fillStyle = eye;
    context.fillRect(x - scale, y - scale * 2.5, scale * 2, scale * 1.5);
    context.restore();
  }

  function draw(time, forceStatic = false) {
    frame = 0;
    const staticFrame = forceStatic || (document.hidden && reducedMotion.matches);
    if (document.hidden && !staticFrame) return;
    if (!forceStatic && time - previousFrame < 32) {
      frame = window.requestAnimationFrame(draw);
      return;
    }
    previousFrame = time;

    const motionScale = narrowScreen.matches ? 0.55 : 1;
    const targetX = (pointer.x - 0.5) * 48 * motionScale + Math.sin(time * 0.00012) * 6;
    const targetY = (pointer.y - 0.45) * 32 * motionScale + Math.sin(time * 0.00016) * 4;
    cameraX += (targetX - cameraX) * 0.045;
    cameraY += (targetY - cameraY) * 0.04;
    cameraImpulse *= 0.88;
    cameraX += Math.sin(time * 0.035) * cameraImpulse * 2.2;
    cameraY += Math.cos(time * 0.029) * cameraImpulse * 1.1;
    scrollPosition += (targetScrollPosition - scrollPosition) * 0.065;
    const eventTarget = time < eventUntil ? 1 : 0;
    eventStrength += (eventTarget - eventStrength) * (eventTarget ? 0.12 : 0.035);
    context.clearRect(0, 0, width, height);
    drawSky(time, cameraX, cameraY);
    drawDimensionalTear(time, cameraX, cameraY);
    drawRidges(cameraX, cameraY);
    drawCity(cameraX, cameraY, time);
    drawDistantWatcher(time, eventStrength);
    drawFallenTower(cameraX, cameraY, time);
    drawFloatingDebris(cameraX, cameraY, time);
    drawFog(time, cameraX, cameraY);
    drawDust(time, cameraX, cameraY);

    const edge = context.createRadialGradient(width * 0.5, height * 0.44, height * 0.2, width * 0.5, height * 0.44, Math.max(width, height) * 0.74);
    edge.addColorStop(0, 'rgba(0, 0, 0, 0)');
    edge.addColorStop(0.72, 'rgba(0, 0, 0, 0.12)');
    edge.addColorStop(1, 'rgba(0, 0, 0, 0.58)');
    context.fillStyle = edge;
    context.fillRect(0, 0, width, height);

    if (!staticFrame) frame = window.requestAnimationFrame(draw);
  }

  function scheduleWorldEvent() {
    window.clearTimeout(nextEventTimer);
    if (reducedMotion.matches || document.hidden) return;
    nextEventTimer = window.setTimeout(() => {
      eventUntil = performance.now() + 1850;
      window.dispatchEvent(new CustomEvent('fillio:worldbeat', {
        detail: { type: random() > 0.46 ? 'watcher' : 'shift' }
      }));
      scheduleWorldEvent();
    }, 21000 + random() * 26000);
  }

  function start() {
    if (reducedMotion.matches || document.hidden || frame) return;
    previousFrame = 0;
    frame = window.requestAnimationFrame(draw);
    scheduleWorldEvent();
  }

  function stop() {
    if (!frame) return;
    window.cancelAnimationFrame(frame);
    frame = 0;
    window.clearTimeout(nextEventTimer);
    nextEventTimer = 0;
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', () => {
    targetScrollPosition = Math.min(window.scrollY, document.documentElement.scrollHeight) * 0.36;
  }, { passive: true });
  window.addEventListener('pointermove', (event) => {
    pointer.x = event.clientX / Math.max(window.innerWidth, 1);
    pointer.y = event.clientY / Math.max(window.innerHeight, 1);
  }, { passive: true });
  window.addEventListener('fillio:attune', () => {
    eventUntil = performance.now() + 2250;
    eventStrength = Math.max(eventStrength, 0.78);
    cameraImpulse = reducedMotion.matches ? 0 : 1;
    dust.forEach((particle, index) => {
      particle.phase += index % 2 ? 0.72 : -0.72;
      particle.drift = Math.min(1.15, particle.drift + 0.018);
    });
  });
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  reducedMotion.addEventListener?.('change', () => reducedMotion.matches ? stop() : start());
  resize();

  draw(performance.now(), true);
  start();
})();