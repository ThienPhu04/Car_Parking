export const generateThreeJSHTML = parkingData => {
  const layoutJSON = JSON.stringify(parkingData || {});

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
  />
  <title>Parking Map</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: linear-gradient(180deg, #edf2f8 0%, #dce6f2 100%);
      color: #334155;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    canvas {
      display: block;
      width: 100% !important;
      height: 100% !important;
      touch-action: none;
    }
    #tooltip {
      position: absolute;
      display: none;
      z-index: 20;
      pointer-events: none;
      min-width: 180px;
    }
    #tooltip .tooltip-inner {
      border-radius: 12px;
      padding: 12px 14px;
      background: rgba(5, 10, 18, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 14px 40px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(10px);
    }
    #tooltip .tooltip-title {
      font-size: 14px;
      font-weight: 700;
      color: #334155;
      margin-bottom: 6px;
    }
    #tooltip .tooltip-meta {
      font-size: 11px;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    #tooltip .tooltip-status {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
<div id="tooltip"><div class="tooltip-inner"></div></div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
  <script>
    (function () {
      const LAYOUT = ${layoutJSON};
      const SCALE = 0.01;
      const FLOOR_THICKNESS = 0.18;
      const SLOT_THICKNESS = 0.12;
      const bounds = LAYOUT.bounds || {
        minX: -500,
        maxX: 500,
        minY: -500,
        maxY: 500,
        width: 1000,
        height: 1000,
        centerX: 0,
        centerY: 0
      };
      const slots = Array.isArray(LAYOUT.slots) ? LAYOUT.slots : [];
      const zones = Array.isArray(LAYOUT.zones) ? LAYOUT.zones : [];
      const lanes = Array.isArray(LAYOUT.lanes) ? LAYOUT.lanes : [];
      const gates = Array.isArray(LAYOUT.gates) ? LAYOUT.gates : [];
      const boundary = Array.isArray(LAYOUT.floor && LAYOUT.floor.boundary)
        ? LAYOUT.floor.boundary
        : [];
      const selectedSlotId = LAYOUT.selectedSlotId || null;
      const route = Array.isArray(LAYOUT.route) ? LAYOUT.route : [];

      function drawRoundRect(ctx, x, y, w, h, r) {
        if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      }

      function createTextSprite(text, bgColor, textColor, fontSize, spriteWidth, spriteHeight) {
        var canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 512, 128);
        // Background pill
        var pillW = Math.min(text.length * (fontSize || 28) * 0.65 + 32, 480);
        var pillH = 56;
        var px = (512 - pillW) / 2;
        var py = (128 - pillH) / 2;
        ctx.beginPath();
        drawRoundRect(ctx, px, py, pillW, pillH, 14);
        ctx.fillStyle = bgColor || 'rgba(0,0,0,0.72)';
        ctx.fill();
        ctx.strokeStyle = textColor || '#e70606ff';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Text
        ctx.font = 'bold ' + (fontSize || 28) + 'px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = textColor || '#3b0606ff';
        ctx.fillText(text, 256, 64);
        var tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
        var sprite = new THREE.Sprite(mat);
        sprite.scale.set(spriteWidth || 3.2, spriteHeight || 0.8, 1);
        sprite.renderOrder = 100;
        return sprite;
      }
      const statusPalette = {
        empty: { fill: 0x1a4731, line: 0x68d391, accent: '#68d391', label: 'Empty' },
        occupied: { fill: 0x4a1515, line: 0xfc8149, accent: '#fc8149', label: 'Occupied' },
        reserved: { fill: 0xc79210, line: 0xffdd57, accent: '#ffdd57', label: 'Reserved' },
        inactive: { fill: 0x1f2937, line: 0x94a3b8, accent: '#94a3b8', label: 'Inactive' },
        unknown: { fill: 0x0f2744, line: 0x60a5fa, accent: '#60a5fa', label: 'Unknown' }
      };

      const worldSize = Math.max(bounds.width || 0, bounds.height || 0) * SCALE;
      const fitDistance = Math.max(worldSize * 1.45, 18);
      const minCameraRadius = Math.max(4.5, fitDistance * 0.28);
      const maxCameraRadius = Math.max(minCameraRadius + 6, fitDistance * 2.2);
      const panBounds = {
        minX: (bounds.minX - bounds.centerX) * SCALE,
        maxX: (bounds.maxX - bounds.centerX) * SCALE,
        minZ: (bounds.minY - bounds.centerY) * SCALE,
        maxZ: (bounds.maxY - bounds.centerY) * SCALE
      };
      function toWorldPoint(point) {
        return new THREE.Vector2(
          (Number(point.x) - bounds.centerX) * SCALE,
          (Number(point.y) - bounds.centerY) * SCALE
        );
      }

      function toWorldVector3(point, y) {
        const worldPoint = toWorldPoint(point);
        return new THREE.Vector3(worldPoint.x, y || 0, worldPoint.y);
      }

      function getRotationY(rotationDegrees) {
        return -(Number(rotationDegrees) || 0) * Math.PI / 180;
      }

      function hexToColor(hex, fallback) {
        try {
          return new THREE.Color(hex || fallback || '#3b82f6');
        } catch (error) {
          return new THREE.Color(fallback || '#3b82f6');
        }
      }

      function makeShape(points) {
        const worldPoints = points.map(toWorldPoint);
        if (!worldPoints.length) {
          return null;
        }

        const reversed = [...worldPoints].reverse();

        const shape = new THREE.Shape();
        shape.moveTo(reversed[0].x, -reversed[0].y);
        for (let index = 1; index < reversed.length; index += 1) {
          shape.lineTo(reversed[index].x, -reversed[index].y);
        }
        shape.lineTo(reversed[0].x, -reversed[0].y);
        return shape;
      }

      function makeClosedLine(points, color, y, opacity) {
        if (!points.length) {
          return null;
        }

        const worldPoints = points.map(point => {
          const worldPoint = toWorldPoint(point);
          return new THREE.Vector3(worldPoint.x, y, worldPoint.y);
        });
        worldPoints.push(worldPoints[0].clone());

        const geometry = new THREE.BufferGeometry().setFromPoints(worldPoints);
        const material = new THREE.LineBasicMaterial({
          color: color,
          transparent: true,
          opacity: opacity
        });
        material.depthTest = false;
        material.depthWrite = false;

        const line = new THREE.Line(geometry, material);
        line.renderOrder = 20;
        return line;
      }

      function makeLaneDashLine(start, end, y) {
        const worldStart = toWorldVector3(start, y);
        const worldEnd = toWorldVector3(end, y);
        const distance = worldStart.distanceTo(worldEnd);
        
        const group = new THREE.Group();
        const dashLength = 0.45;
        const gapLength = 0.35;
        const dashWidth = 0.10;
        
        const dashCount = Math.floor(distance / (dashLength + gapLength));
        if (dashCount === 0) return group;
        
        const dx = (worldEnd.x - worldStart.x) / distance;
        const dz = (worldEnd.z - worldStart.z) / distance;
        
        for (let i = 0; i < dashCount; i++) {
          const t = ((i + 0.5) * (dashLength + gapLength)) / distance;
          const px = worldStart.x + dx * (t * distance);
          const pz = worldStart.z + dz * (t * distance);
          
          const dashMesh = new THREE.Mesh(
            new THREE.BoxGeometry(dashLength, 0.015, dashWidth),
            new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.52 })
          );
          dashMesh.position.set(px, y, pz);
          dashMesh.rotation.y = -Math.atan2(dz, dx);
          group.add(dashMesh);
        }
        
        return group;
      }

      function buildCarTopView(slotWidth, slotDepth, palette, status) {
        const carGroup = new THREE.Group();
        const carWidth = slotWidth * 0.72;
        const carDepth = slotDepth * 0.78;
        const carHeight = status === 'occupied' || status === 'reserved' ? 0.18 : 0.11;
        const shellColor = status === 'reserved' ? 0xf6c453 : palette.line;
        const bodyMaterial = new THREE.MeshStandardMaterial({
          color: shellColor,
          roughness: status === 'occupied' || status === 'reserved' ? 0.3 : 0.48,
          metalness: status === 'occupied' || status === 'reserved' ? 0.4 : 0.12,
          transparent: status === 'occupied' || status === 'reserved' ? false : true,
          opacity: status === 'occupied' || status === 'reserved' ? 1 : 0.44
        });

        const body = new THREE.Mesh(
          new THREE.BoxGeometry(carWidth, carHeight, carDepth * 0.74),
          bodyMaterial
        );
        body.position.y = carHeight * 0.55;
        body.castShadow = true;
        carGroup.add(body);

        const hood = new THREE.Mesh(
          new THREE.BoxGeometry(carWidth * 0.88, carHeight * 0.92, carDepth * 0.18),
          bodyMaterial.clone()
        );
        hood.position.set(0, carHeight * 0.52, carDepth * 0.36);
        carGroup.add(hood);

        const trunk = new THREE.Mesh(
          new THREE.BoxGeometry(carWidth * 0.9, carHeight * 0.92, carDepth * 0.14),
          bodyMaterial.clone()
        );
        trunk.position.set(0, carHeight * 0.52, -carDepth * 0.34);
        carGroup.add(trunk);

        const roof = new THREE.Mesh(
          new THREE.BoxGeometry(carWidth * 0.58, carHeight * 0.72, carDepth * 0.32),
          new THREE.MeshStandardMaterial({
            color: 0xa5d8ff,
            roughness: 0.14,
            metalness: 0.82,
            transparent: true,
            opacity: status === 'occupied' || status === 'reserved' ? 0.78 : 0.34
          })
        );
        roof.position.y = carHeight + 0.02;
        carGroup.add(roof);

        const wheelMaterial = new THREE.MeshStandardMaterial({
          color: 0x111827,
          roughness: 0.9,
          metalness: 0.08,
          transparent: status === 'occupied' || status === 'reserved' ? false : true,
          opacity: status === 'occupied' || status === 'reserved' ? 1 : 0.55
        });

        [
          [-carWidth * 0.42, -carDepth * 0.22],
          [carWidth * 0.42, -carDepth * 0.22],
          [-carWidth * 0.42, carDepth * 0.2],
          [carWidth * 0.42, carDepth * 0.2]
        ].forEach(position => {
          const wheel = new THREE.Mesh(
            new THREE.BoxGeometry(carWidth * 0.14, 0.07, carDepth * 0.18),
            wheelMaterial
          );
          wheel.position.set(position[0], 0.045, position[1]);
          carGroup.add(wheel);
        });

        if (status !== 'occupied' && status !== 'reserved') {
          const outline = new THREE.LineSegments(
            new THREE.EdgesGeometry(
              new THREE.BoxGeometry(carWidth, carHeight, carDepth * 0.74)
            ),
            new THREE.LineBasicMaterial({
              color: palette.line,
              transparent: true,
              opacity: 0.8
            })
          );
          outline.position.copy(body.position);
          carGroup.add(outline);
        }

        return carGroup;
      }

      const scene = new THREE.Scene();
      scene.background = null;
      scene.fog = null;

      const camera = new THREE.PerspectiveCamera(
        46,
        window.innerWidth / window.innerHeight,
        0.1,
        Math.max(250, fitDistance * 12)
      );

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.94;
      document.body.appendChild(renderer.domElement);

      const root = new THREE.Group();
      scene.add(root);

      scene.add(new THREE.AmbientLight(0xffffff, 1.15));
      scene.add(new THREE.HemisphereLight(0xf6f9fd, 0xcbd5e1, 0.78));

      const mainLight = new THREE.DirectionalLight(0xffffff, 1.18);
      mainLight.position.set(18, 26, 14);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.set(2048, 2048);
      mainLight.shadow.camera.left = -26;
      mainLight.shadow.camera.right = 26;
      mainLight.shadow.camera.top = 26;
      mainLight.shadow.camera.bottom = -26;
      mainLight.shadow.camera.near = 1;
      mainLight.shadow.camera.far = 80;
      scene.add(mainLight);

      const accentLight = new THREE.PointLight(0x38bdf8, 1.5, fitDistance * 1.3);
      accentLight.position.set(0, 8, 0);
      scene.add(accentLight);

      const backLight = new THREE.PointLight(0xa78bfa, 0.55, fitDistance * 1.6);
      backLight.position.set(-fitDistance * 0.3, 6, fitDistance * 0.45);
      scene.add(backLight);

      const groundSize = Math.max(worldSize * 1.4, 40);
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(groundSize, groundSize),
        new THREE.MeshLambertMaterial({
          color: 0xcfd8e3,
          transparent: true,
          opacity: 0.22
        })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.06;
      ground.receiveShadow = true;
      scene.add(ground);

      const grid = new THREE.GridHelper(
        Math.max(worldSize * 1.15, 26),
        Math.max(Math.round(worldSize * 2), 20),
        0x14304c,
        0x10243a
      );
      grid.position.y = -0.04;
      grid.material.opacity = 0.16;
      grid.material.transparent = true;
      scene.add(grid);

      if (boundary.length >= 3) {
        const boundaryShape = makeShape(boundary);
        if (boundaryShape) {
          const floorMesh = new THREE.Mesh(
            new THREE.ExtrudeGeometry(boundaryShape, {
              depth: FLOOR_THICKNESS,
              bevelEnabled: false
            }),
            new THREE.MeshStandardMaterial({
              color: 0xd8e2ee,
              roughness: 0.96,
              metalness: 0.01
            })
          );
          floorMesh.rotation.x = -Math.PI / 2;
          floorMesh.castShadow = true;
          floorMesh.receiveShadow = true;
          root.add(floorMesh);

          const outline = makeClosedLine(boundary, 0x7aa2d6, FLOOR_THICKNESS + 0.02, 0.9);
          if (outline) {
            root.add(outline);
          }
        }
      }

      function getPolygonCenter(points) {
        if (!points || !points.length) return {x: 0, y: 0};
        // Use signed area centroid for accurate centering inside polygons
        let area = 0;
        let cx = 0;
        let cy = 0;
        const n = points.length;
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n;
          const xi = Number(points[i].x);
          const yi = Number(points[i].y);
          const xj = Number(points[j].x);
          const yj = Number(points[j].y);
          const cross = xi * yj - xj * yi;
          area += cross;
          cx += (xi + xj) * cross;
          cy += (yi + yj) * cross;
        }
        area *= 0.5;
        if (Math.abs(area) < 1e-6) {
          // Fallback to bounding box center
          let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
          points.forEach(p => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
          });
          return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
        }
        cx /= (6 * area);
        cy /= (6 * area);
        return { x: cx, y: cy };
      }

      zones.forEach((zone, index) => {
        if (!zone.points || zone.points.length < 3) {
          return;
        }

        const zoneShape = makeShape(zone.points);
        if (!zoneShape) {
          return;
        }

        const zoneColor = hexToColor(zone.displayColor || zone.color, '#3b82f6');
        const zoneFillColor = zoneColor.clone().lerp(new THREE.Color('#ffffff'), 0.72);
        const zoneMaterial = new THREE.MeshStandardMaterial({
          color: zoneFillColor,
          transparent: true,
          opacity: 0.2,
          roughness: 0.84,
          metalness: 0.06,
          emissive: zoneColor.clone().multiplyScalar(0.03),
          emissiveIntensity: 0.08,
          side: THREE.DoubleSide,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1
        });
        const zoneMesh = new THREE.Mesh(
          new THREE.ShapeGeometry(zoneShape),
          zoneMaterial
        );
        zoneMesh.rotation.x = -Math.PI / 2;
        zoneMesh.position.y = FLOOR_THICKNESS + 0.025;
        zoneMesh.renderOrder = 2;
        root.add(zoneMesh);

        // Zone outline — thicker colored border
        const outlinePoints = zone.points.map(function(point) {
          var wp = toWorldPoint(point);
          return new THREE.Vector3(wp.x, FLOOR_THICKNESS + 0.035, wp.y);
        });
        outlinePoints.push(outlinePoints[0].clone());
        var outlineGeo = new THREE.BufferGeometry().setFromPoints(outlinePoints);
        var outlineMat = new THREE.LineBasicMaterial({
          color: zoneColor.getHex(),
          transparent: true,
          opacity: 0.95,
          linewidth: 2
        });
        outlineMat.depthTest = false;
        outlineMat.depthWrite = false;
        var outlineLine = new THREE.Line(outlineGeo, outlineMat);
        outlineLine.renderOrder = 25;
        root.add(outlineLine);
      });

      lanes.forEach(lane => {
        if (!lane.points || lane.points.length < 2) {
          return;
        }

        for (let index = 0; index < lane.points.length - 1; index += 1) {
          const start = lane.points[index];
          const end = lane.points[index + 1];
          const dx = Number(end.x) - Number(start.x);
          const dy = Number(end.y) - Number(start.y);
          const segmentLength = Math.hypot(dx, dy) * SCALE;
          if (segmentLength <= 0.02) {
            continue;
          }

          const center = {
            x: (Number(start.x) + Number(end.x)) / 2,
            y: (Number(start.y) + Number(end.y)) / 2
          };

          const laneW = Math.max((lane.width || 60) * SCALE, 0.55);

          const laneSegment = new THREE.Mesh(
            new THREE.BoxGeometry(segmentLength, 0.06, laneW),
            new THREE.MeshStandardMaterial({
              color: 0xb7c3d1,
              roughness: 0.92,
              metalness: 0.04,
              transparent: true,
              opacity: 0.72
            })
          );
          laneSegment.position.copy(toWorldVector3(center, FLOOR_THICKNESS + 0.028));
          laneSegment.rotation.y = -Math.atan2(dy, dx);
          laneSegment.receiveShadow = true;
          root.add(laneSegment);

          // Add side edge lines for road markings (yellow lane borders)
          const halfW = laneW / 2 - 0.02;
          
          for (let side = -1; side <= 1; side += 2) {
            const edgeMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.42 });
            const edgeMesh = new THREE.Mesh(
              new THREE.BoxGeometry(segmentLength, 0.018, 0.06),
              edgeMat
            );
            edgeMesh.position.copy(toWorldVector3(center, FLOOR_THICKNESS + 0.065));
            edgeMesh.position.x += Math.sin(Math.atan2(dy, dx)) * halfW * side;
            edgeMesh.position.z -= Math.cos(Math.atan2(dy, dx)) * halfW * side;
            edgeMesh.rotation.y = -Math.atan2(dy, dx);
            root.add(edgeMesh);
          }

          // White dashed center line
          const dashLine = makeLaneDashLine(
            start,
            end,
            FLOOR_THICKNESS + 0.075
          );
          root.add(dashLine);
        }
      });

      gates.forEach(gate => {
        const isEntrance = gate.kind === 'entrance';
        const gateColor = isEntrance ? 0x22c55e : 0xef4444;
        const gateMesh = new THREE.Mesh(
          new THREE.BoxGeometry(
            Math.max((gate.width || 60) * SCALE, 0.4),
            0.32,
            Math.max((gate.depth || 40) * SCALE, 0.25)
          ),
          new THREE.MeshStandardMaterial({
            color: gateColor,
            emissive: gateColor,
            emissiveIntensity: 0.25,
            roughness: 0.35,
            metalness: 0.3
          })
        );
        gateMesh.position.copy(
          toWorldVector3({ x: gate.positionX, y: gate.positionY }, FLOOR_THICKNESS + 0.22)
        );
        gateMesh.rotation.y = getRotationY(gate.rotation);
        gateMesh.castShadow = true;
        root.add(gateMesh);

        const gateLabel = createTextSprite(
          isEntrance ? 'IN' : 'OUT',
          'rgba(15, 23, 42, 0.88)',
          isEntrance ? '#86efac' : '#fca5a5',
          56,
          isEntrance ? 3.8 : 4.4,
          1.2
        );
        gateLabel.position.copy(
          toWorldVector3({ x: gate.positionX, y: gate.positionY }, FLOOR_THICKNESS + 0.95)
        );
        root.add(gateLabel);
      });

      const slotHitboxes = [];
      let selectedEntry = null;
      let selectedSlotHitbox = null;
      let routeGroup = null;

      slots.forEach(slot => {
        const palette = statusPalette[slot.status] || statusPalette.unknown;
        const group = new THREE.Group();
        group.position.copy(
          toWorldVector3(
            { x: slot.position2d.x, y: slot.position2d.y },
            FLOOR_THICKNESS + SLOT_THICKNESS * 0.5
          )
        );
        group.rotation.y = getRotationY(slot.rotation);

        const slotWidth = Math.max((slot.size && slot.size.width || 40) * SCALE, 0.3);
        const slotDepth = Math.max((slot.size && slot.size.depth || 24) * SCALE, 0.22);

        const baseMaterial = new THREE.MeshStandardMaterial({
          color: palette.fill,
          roughness: 0.8,
          metalness: 0.08
        });
        const baseMesh = new THREE.Mesh(
          new THREE.BoxGeometry(slotWidth, SLOT_THICKNESS, slotDepth),
          baseMaterial
        );
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        group.add(baseMesh);

        const outlineMaterial = new THREE.LineBasicMaterial({
          color: palette.line,
          transparent: true,
          opacity: 0.75
        });
        const outlineMesh = new THREE.LineSegments(
          new THREE.EdgesGeometry(
            new THREE.BoxGeometry(slotWidth, SLOT_THICKNESS, slotDepth)
          ),
          outlineMaterial
        );
        group.add(outlineMesh);

        const carTopView = buildCarTopView(
          slotWidth,
          slotDepth,
          palette,
          slot.status
        );
        carTopView.position.y = 0.02;
        group.add(carTopView);

        const hitbox = new THREE.Mesh(
          new THREE.BoxGeometry(slotWidth, 0.6, slotDepth),
          new THREE.MeshBasicMaterial({ visible: false })
        );
        hitbox.position.y = 0.28;
        hitbox.userData = {
          slot: slot,
          group: group,
          baseMaterial: baseMaterial,
          outlineMaterial: outlineMaterial,
          palette: palette
        };
        slotHitboxes.push(hitbox);
        group.add(hitbox);
        root.add(group);
      });

      
      function renderRoutePath(points) {
        if (routeGroup) {
          root.remove(routeGroup);
          routeGroup = null;
        }

        if (!Array.isArray(points) || points.length < 2) {
          return;
        }

        const routePoints = points.map(point => toWorldVector3(point, FLOOR_THICKNESS + 0.12));
        routeGroup = new THREE.Group();
        const curve = new THREE.CatmullRomCurve3(routePoints);
        const tubularSegments = Math.max(routePoints.length * 8, 48);

        const glowTube = new THREE.Mesh(
          new THREE.TubeGeometry(curve, tubularSegments, 0.16, 14, false),
          new THREE.MeshBasicMaterial({
            color: 0x0ea5e9,
            transparent: true,
            opacity: 0.2
          })
        );
        glowTube.renderOrder = 80;
        routeGroup.add(glowTube);

        const outerTube = new THREE.Mesh(
          new THREE.TubeGeometry(curve, tubularSegments, 0.1, 14, false),
          new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            emissive: 0x38bdf8,
            emissiveIntensity: 0.35,
            roughness: 0.24,
            metalness: 0.12
          })
        );
        outerTube.renderOrder = 81;
        routeGroup.add(outerTube);

        const coreTube = new THREE.Mesh(
          new THREE.TubeGeometry(curve, tubularSegments, 0.058, 12, false),
          new THREE.MeshStandardMaterial({
            color: 0xfef08a,
            emissive: 0xfacc15,
            emissiveIntensity: 0.85,
            roughness: 0.18,
            metalness: 0.22
          })
        );
        coreTube.renderOrder = 82;
        routeGroup.add(coreTube);

        const startMarker = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 20, 20),
          new THREE.MeshStandardMaterial({ color: 0x4caf50, emissive: 0x4caf50, emissiveIntensity: 0.35 })
        );
        startMarker.position.copy(routePoints[0]);
        startMarker.renderOrder = 83;
        routeGroup.add(startMarker);

        const endMarker = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 20, 20),
          new THREE.MeshStandardMaterial({ color: 0xff5722, emissive: 0xff5722, emissiveIntensity: 0.35 })
        );
        endMarker.position.copy(routePoints[routePoints.length - 1]);
        endMarker.renderOrder = 83;
        routeGroup.add(endMarker);

        root.add(routeGroup);
      }

      function applyMapState(nextState) {
        const nextSelectedSlotId = nextState && nextState.selectedSlotId ? nextState.selectedSlotId : null;
        const nextRoute = nextState && Array.isArray(nextState.route) ? nextState.route : [];

        if (nextSelectedSlotId) {
          selectedSlotHitbox = slotHitboxes.find(hitbox => hitbox.userData.slot.id === nextSelectedSlotId) || null;
          if (selectedSlotHitbox) {
            highlightSlot(selectedSlotHitbox);
            hideTooltip();
          }
        } else {
          resetSelection();
          hideTooltip();
        }

        renderRoutePath(nextRoute);
      }

      window.__updateParkingMapState = function (nextState) {
        applyMapState(nextState || {});
      };

      applyMapState({ selectedSlotId: selectedSlotId, route: route });

      const target = new THREE.Vector3(0, 0.3, 0);
      const spherical = {
        radius: fitDistance,
        theta: -0.72,
        phi: 1.05
      };
      const worldUp = new THREE.Vector3(0, 1, 0);
      const panPlane = new THREE.Plane(worldUp.clone(), -FLOOR_THICKNESS);

      function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
      }

      function clampTargetToBounds() {
        target.x = clamp(target.x, panBounds.minX, panBounds.maxX);
        target.z = clamp(target.z, panBounds.minZ, panBounds.maxZ);
      }

      function getScreenIntersection(clientX, clientY) {
        pointer.x = (clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);

        const intersection = new THREE.Vector3();
        const hit = raycaster.ray.intersectPlane(panPlane, intersection);
        return hit ? intersection : null;
      }

      function updateCamera() {
        const sinPhiRadius = Math.sin(spherical.phi) * spherical.radius;
        camera.position.set(
          target.x + sinPhiRadius * Math.sin(spherical.theta),
          target.y + Math.cos(spherical.phi) * spherical.radius,
          target.z + sinPhiRadius * Math.cos(spherical.theta)
        );
        camera.lookAt(target);
      }

      updateCamera();

      function showTooltip() {
        return;
      }

      function hideTooltip() {
        return;
      }

      function resetSelection() {
        if (!selectedEntry) {
          return;
        }

        selectedEntry.baseMaterial.emissive.setHex(0x000000);
        selectedEntry.baseMaterial.emissiveIntensity = 0;
        selectedEntry.outlineMaterial.color.setHex(selectedEntry.palette.line);
        selectedEntry = null;
      }

      function highlightSlot(hitbox) {
        resetSelection();

        const entry = hitbox.userData;
        entry.baseMaterial.emissive.setHex(0xfbbf24);
        entry.baseMaterial.emissiveIntensity = 0.42;
        entry.outlineMaterial.color.setHex(0xfbbf24);
        selectedEntry = entry;
        return entry;
      }

      function selectSlot(hitbox, clientX, clientY) {
        const entry = highlightSlot(hitbox);
        showTooltip(clientX, clientY, entry.slot);

        try {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SLOT_SELECTED',
              slotId: entry.slot.id,
              status: entry.slot.status
            }));
          }
        } catch (error) {
          // Ignore bridge errors inside WebView.
        }
      }

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();

      function runRaycast(clientX, clientY) {
        pointer.x = (clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);

        const intersections = raycaster.intersectObjects(slotHitboxes);
        if (intersections.length) {
          selectSlot(intersections[0].object, clientX, clientY);
        } else {
          resetSelection();
          hideTooltip();
        }
      }

      let isDragging = false;
      let interactionMode = null;
      let lastPointerX = 0;
      let lastPointerY = 0;
      let movedDuringGesture = false;
      let pinchDistance = 0;
      let lastPanIntersection = null;
      let lastPinchCenterIntersection = null;
      let touchStart = null;

      function getDistance(a, b) {
        const dx = a.clientX - b.clientX;
        const dy = a.clientY - b.clientY;
        return Math.hypot(dx, dy);
      }

      function getTouchCenter(touchA, touchB) {
        return {
          clientX: (touchA.clientX + touchB.clientX) / 2,
          clientY: (touchA.clientY + touchB.clientY) / 2
        };
      }

      function applyPanFromScreenPoint(clientX, clientY) {
        const nextIntersection = getScreenIntersection(clientX, clientY);
        if (!nextIntersection) {
          lastPanIntersection = null;
          return;
        }

        if (!lastPanIntersection) {
          lastPanIntersection = nextIntersection;
          return;
        }

        const delta = lastPanIntersection.clone().sub(nextIntersection);
        if (delta.lengthSq() <= 0) {
          lastPanIntersection = nextIntersection;
          return;
        }

        target.add(delta);
        clampTargetToBounds();
        lastPanIntersection = nextIntersection;
        updateCamera();
      }

      function applyRotation(dx, dy) {
        spherical.theta -= dx * 0.005;
        spherical.phi = Math.max(0.42, Math.min(Math.PI * 0.48, spherical.phi + dy * 0.0045));
        updateCamera();
      }

      function applyZoom(delta) {
        spherical.radius = clamp(spherical.radius + delta, minCameraRadius, maxCameraRadius);
        updateCamera();
      }

      renderer.domElement.addEventListener('contextmenu', function (event) {
        event.preventDefault();
      });

      renderer.domElement.addEventListener('mousedown', function (event) {
        isDragging = true;
        movedDuringGesture = false;
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
        interactionMode = event.button === 2 ? 'pan' : 'rotate';
        lastPanIntersection = interactionMode === 'pan'
          ? getScreenIntersection(event.clientX, event.clientY)
          : null;
      });

      renderer.domElement.addEventListener('mousemove', function (event) {
        if (!isDragging) {
          return;
        }

        const dx = event.clientX - lastPointerX;
        const dy = event.clientY - lastPointerY;
        movedDuringGesture = movedDuringGesture || Math.abs(dx) > 2 || Math.abs(dy) > 2;

        if (interactionMode === 'rotate') {
          applyRotation(dx, dy);
        } else {
          applyPanFromScreenPoint(event.clientX, event.clientY);
        }

        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
      });

      renderer.domElement.addEventListener('mouseup', function () {
        isDragging = false;
        interactionMode = null;
        lastPanIntersection = null;
      });

      renderer.domElement.addEventListener('mouseleave', function () {
        isDragging = false;
        interactionMode = null;
        lastPanIntersection = null;
      });

      renderer.domElement.addEventListener('click', function (event) {
        if (!movedDuringGesture) {
          runRaycast(event.clientX, event.clientY);
        }
      });

      renderer.domElement.addEventListener('wheel', function (event) {
        applyZoom(event.deltaY * 0.015);
      }, { passive: true });

      renderer.domElement.addEventListener('touchstart', function (event) {
        if (event.touches.length === 1) {
          const touch = event.touches[0];
          isDragging = true;
          interactionMode = 'rotate';
          movedDuringGesture = false;
          lastPointerX = touch.clientX;
          lastPointerY = touch.clientY;
          lastPanIntersection = null;
          touchStart = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
          };
        }

        if (event.touches.length === 2) {
          interactionMode = 'pinch';
          isDragging = false;
          pinchDistance = getDistance(event.touches[0], event.touches[1]);
          const center = getTouchCenter(event.touches[0], event.touches[1]);
          lastPinchCenterIntersection = getScreenIntersection(center.clientX, center.clientY);
          lastPanIntersection = null;
        }
      }, { passive: true });

      renderer.domElement.addEventListener('touchmove', function (event) {
        if (event.touches.length === 1 && interactionMode === 'rotate' && isDragging) {
          const touch = event.touches[0];
          const dx = touch.clientX - lastPointerX;
          const dy = touch.clientY - lastPointerY;

          movedDuringGesture = movedDuringGesture || Math.abs(dx) > 2 || Math.abs(dy) > 2;
          applyRotation(dx, dy);

          lastPointerX = touch.clientX;
          lastPointerY = touch.clientY;
        }

        if (event.touches.length === 2) {
          interactionMode = 'pinch';
          const nextDistance = getDistance(event.touches[0], event.touches[1]);
          const center = getTouchCenter(event.touches[0], event.touches[1]);
          const nextCenterIntersection = getScreenIntersection(center.clientX, center.clientY);
          applyZoom(-(nextDistance - pinchDistance) * 0.03);

          if (lastPinchCenterIntersection && nextCenterIntersection) {
            const delta = lastPinchCenterIntersection.clone().sub(nextCenterIntersection);
            target.add(delta);
            clampTargetToBounds();
            updateCamera();
          }

          lastPinchCenterIntersection = nextCenterIntersection;
          pinchDistance = nextDistance;
        }
      }, { passive: true });

      renderer.domElement.addEventListener('touchend', function (event) {
        isDragging = false;
        interactionMode = null;
        lastPanIntersection = null;
        lastPinchCenterIntersection = null;

        if (
          touchStart &&
          Date.now() - touchStart.time < 220 &&
          !movedDuringGesture &&
          event.changedTouches &&
          event.changedTouches[0]
        ) {
          runRaycast(
            event.changedTouches[0].clientX,
            event.changedTouches[0].clientY
          );
        }

        touchStart = null;
      });

      window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);
      });

      let frame = 0;
      function animate() {
        window.requestAnimationFrame(animate);
        frame += 1;

        accentLight.intensity = 1.45 + Math.sin(frame * 0.018) * 0.18;
        backLight.intensity = 0.55 + Math.cos(frame * 0.012) * 0.08;

        renderer.render(scene, camera);
      }

      animate();
    })();
  </script>
</body>
</html>
  `;
};








