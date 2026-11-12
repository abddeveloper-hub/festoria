import React, { useEffect, useRef } from 'react';

interface Background3DProps {
  className?: string;
  opacity?: number;
}

// 3D Point & Edge Interfaces
interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Edge3D {
  a: number;
  b: number;
}

interface Shape3D {
  id: string;
  type: 'icosahedron' | 'cube' | 'octahedron' | 'tetrahedron' | 'rings';
  xRel: number; // 0 to 1 relative to viewport width
  yRel: number; // 0 to 1 relative to viewport height
  radius: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  speedX: number;
  speedY: number;
  speedZ: number;
  color: string;
  glowColor: string;
  vertices: Point3D[];
  edges: Edge3D[];
  floatPhase: number;
  floatSpeed: number;
  floatAmp: number;
}

interface ThreadParticle {
  t: number; // 0 to 1 progress along width
  speed: number;
  threadIndex: number;
  size: number;
  color: string;
}

interface AmbientNode3D {
  xRel: number;
  yRel: number;
  z: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

export const Background3DThreadsAndShapes: React.FC<Background3DProps> = ({
  className = 'fixed inset-0 pointer-events-none z-0',
  opacity = 0.9
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let time = 0;

    // Mouse tracking for fluid 3D parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = (e.clientY / window.innerHeight) * 2 - 1;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Responsive Canvas Resize with High-DPI Support
    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    // ========================================================================
    // 1. GENERATE 3D MATHEMATICAL WIREFRAME SHAPES
    // ========================================================================

    // 1A. Icosahedron (20-sided celestial polyhedron)
    const createIcosahedron = (r: number): { vertices: Point3D[]; edges: Edge3D[] } => {
      const phi = (1 + Math.sqrt(5)) / 2;
      const rawVerts = [
        [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
        [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
        [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
      ];

      const vertices: Point3D[] = rawVerts.map(([x, y, z]) => {
        const len = Math.hypot(x, y, z);
        return { x: (x / len) * r, y: (y / len) * r, z: (z / len) * r };
      });

      const edges: Edge3D[] = [];
      const distThreshold = (2 / Math.sqrt(1 + phi * phi)) * r * 1.15;

      for (let i = 0; i < vertices.length; i++) {
        for (let j = i + 1; j < vertices.length; j++) {
          const d = Math.hypot(
            vertices[i].x - vertices[j].x,
            vertices[i].y - vertices[j].y,
            vertices[i].z - vertices[j].z
          );
          if (d <= distThreshold) {
            edges.push({ a: i, b: j });
          }
        }
      }
      return { vertices, edges };
    };

    // 1B. Cube (Hexahedron)
    const createCube = (s: number): { vertices: Point3D[]; edges: Edge3D[] } => {
      const h = s / 2;
      const vertices: Point3D[] = [
        { x: -h, y: -h, z: -h },
        { x: h, y: -h, z: -h },
        { x: h, y: h, z: -h },
        { x: -h, y: h, z: -h },
        { x: -h, y: -h, z: h },
        { x: h, y: -h, z: h },
        { x: h, y: h, z: h },
        { x: -h, y: h, z: h }
      ];
      const edges: Edge3D[] = [
        { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 3 }, { a: 3, b: 0 },
        { a: 4, b: 5 }, { a: 5, b: 6 }, { a: 6, b: 7 }, { a: 7, b: 4 },
        { a: 0, b: 4 }, { a: 1, b: 5 }, { a: 2, b: 6 }, { a: 3, b: 7 }
      ];
      return { vertices, edges };
    };

    // 1C. Octahedron (Diamond / Double Pyramid)
    const createOctahedron = (r: number): { vertices: Point3D[]; edges: Edge3D[] } => {
      const vertices: Point3D[] = [
        { x: 0, y: -r, z: 0 },
        { x: 0, y: r, z: 0 },
        { x: -r, y: 0, z: 0 },
        { x: r, y: 0, z: 0 },
        { x: 0, y: 0, z: -r },
        { x: 0, y: 0, z: r }
      ];
      const edges: Edge3D[] = [
        { a: 0, b: 2 }, { a: 0, b: 3 }, { a: 0, b: 4 }, { a: 0, b: 5 },
        { a: 1, b: 2 }, { a: 1, b: 3 }, { a: 1, b: 4 }, { a: 1, b: 5 },
        { a: 2, b: 4 }, { a: 4, b: 3 }, { a: 3, b: 5 }, { a: 5, b: 2 }
      ];
      return { vertices, edges };
    };

    // 1D. Tetrahedron (3D Triangular Prism)
    const createTetrahedron = (r: number): { vertices: Point3D[]; edges: Edge3D[] } => {
      const a = r / Math.sqrt(3);
      const vertices: Point3D[] = [
        { x: a, y: a, z: a },
        { x: -a, y: -a, z: a },
        { x: -a, y: a, z: -a },
        { x: a, y: -a, z: -a }
      ];
      const edges: Edge3D[] = [
        { a: 0, b: 1 }, { a: 0, b: 2 }, { a: 0, b: 3 },
        { a: 1, b: 2 }, { a: 2, b: 3 }, { a: 3, b: 1 }
      ];
      return { vertices, edges };
    };

    // 1E. Gyroscope Dual Rings
    const createGyroscopeRings = (r: number): { vertices: Point3D[]; edges: Edge3D[] } => {
      const segments = 18;
      const vertices: Point3D[] = [];
      const edges: Edge3D[] = [];

      // Ring 1 (XY plane)
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        vertices.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r, z: 0 });
        edges.push({ a: i, b: (i + 1) % segments });
      }

      // Ring 2 (YZ plane)
      const offset = segments;
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        vertices.push({ x: 0, y: Math.cos(angle) * (r * 0.88), z: Math.sin(angle) * (r * 0.88) });
        edges.push({ a: offset + i, b: offset + ((i + 1) % segments) });
      }

      return { vertices, edges };
    };

    // 5 Unique Floating 3D Shapes positioned across the layout
    const shapes: Shape3D[] = [
      // Shape 1: Celestial Icosahedron in top-right
      {
        id: 'ico-top-right',
        type: 'icosahedron',
        xRel: 0.84,
        yRel: 0.16,
        radius: 48,
        rotX: 0.3,
        rotY: 0.6,
        rotZ: 0.1,
        speedX: 0.0035,
        speedY: 0.005,
        speedZ: 0.002,
        color: '#6366f1', // Indigo
        glowColor: 'rgba(99, 102, 241, 0.25)',
        ...createIcosahedron(48),
        floatPhase: 0,
        floatSpeed: 0.0016,
        floatAmp: 16
      },
      // Shape 2: Rotating Cube in upper-left
      {
        id: 'cube-top-left',
        type: 'cube',
        xRel: 0.12,
        yRel: 0.22,
        radius: 42,
        rotX: 0.5,
        rotY: 0.3,
        rotZ: 0.2,
        speedX: 0.004,
        speedY: 0.003,
        speedZ: 0.0025,
        color: '#a855f7', // Purple
        glowColor: 'rgba(168, 85, 247, 0.22)',
        ...createCube(42),
        floatPhase: 1.8,
        floatSpeed: 0.0014,
        floatAmp: 14
      },
      // Shape 3: Octahedron (Diamond) mid-right
      {
        id: 'octa-mid-right',
        type: 'octahedron',
        xRel: 0.9,
        yRel: 0.54,
        radius: 44,
        rotX: 0.2,
        rotY: 0.4,
        rotZ: 0.3,
        speedX: 0.0045,
        speedY: 0.004,
        speedZ: 0.003,
        color: '#ec4899', // Pink
        glowColor: 'rgba(236, 72, 153, 0.22)',
        ...createOctahedron(44),
        floatPhase: 3.2,
        floatSpeed: 0.0018,
        floatAmp: 18
      },
      // Shape 4: Gyroscope Dual Rings mid-left
      {
        id: 'rings-mid-left',
        type: 'rings',
        xRel: 0.08,
        yRel: 0.68,
        radius: 46,
        rotX: 0.4,
        rotY: 0.2,
        rotZ: 0.5,
        speedX: 0.003,
        speedY: 0.0055,
        speedZ: 0.002,
        color: '#06b6d4', // Cyan
        glowColor: 'rgba(6, 182, 212, 0.22)',
        ...createGyroscopeRings(46),
        floatPhase: 4.6,
        floatSpeed: 0.0015,
        floatAmp: 15
      },
      // Shape 5: Tetrahedron lower-right
      {
        id: 'tetra-bottom-right',
        type: 'tetrahedron',
        xRel: 0.82,
        yRel: 0.84,
        radius: 40,
        rotX: 0.4,
        rotY: 0.5,
        rotZ: 0.3,
        speedX: 0.004,
        speedY: 0.0035,
        speedZ: 0.0045,
        color: '#10b981', // Emerald
        glowColor: 'rgba(16, 185, 129, 0.22)',
        ...createTetrahedron(40),
        floatPhase: 2.4,
        floatSpeed: 0.0017,
        floatAmp: 14
      }
    ];

    // ========================================================================
    // 2. FLOWING 3D BEZIER THREADS & TRAVELING ENERGY PACKETS
    // ========================================================================

    interface ThreadDef {
      yBaseRel: number;
      amplitude: number;
      frequency: number;
      speed: number;
      zDepth: number;
      gradient: [string, string, string];
    }

    const threads: ThreadDef[] = [
      {
        yBaseRel: 0.18,
        amplitude: 55,
        frequency: 0.0018,
        speed: 0.0011,
        zDepth: 60,
        gradient: ['rgba(99, 102, 241, 0.35)', 'rgba(168, 85, 247, 0.45)', 'rgba(236, 72, 153, 0.35)']
      },
      {
        yBaseRel: 0.36,
        amplitude: 75,
        frequency: 0.0014,
        speed: -0.00085,
        zDepth: -40,
        gradient: ['rgba(6, 182, 212, 0.35)', 'rgba(99, 102, 241, 0.45)', 'rgba(147, 51, 234, 0.35)']
      },
      {
        yBaseRel: 0.6,
        amplitude: 65,
        frequency: 0.002,
        speed: 0.0014,
        zDepth: 30,
        gradient: ['rgba(168, 85, 247, 0.35)', 'rgba(236, 72, 153, 0.45)', 'rgba(245, 158, 11, 0.35)']
      },
      {
        yBaseRel: 0.8,
        amplitude: 70,
        frequency: 0.0016,
        speed: -0.001,
        zDepth: -50,
        gradient: ['rgba(16, 185, 129, 0.35)', 'rgba(6, 182, 212, 0.45)', 'rgba(99, 102, 241, 0.35)']
      }
    ];

    // Traveling light pulses / particles moving along threads (one place to another)
    const particles: ThreadParticle[] = [
      { t: 0.08, speed: 0.0008, threadIndex: 0, size: 4.5, color: '#818cf8' },
      { t: 0.58, speed: 0.001, threadIndex: 0, size: 3.5, color: '#f472b6' },
      { t: 0.22, speed: 0.0009, threadIndex: 1, size: 5.0, color: '#38bdf8' },
      { t: 0.78, speed: 0.0007, threadIndex: 1, size: 3.5, color: '#a855f7' },
      { t: 0.12, speed: 0.0011, threadIndex: 2, size: 4.5, color: '#fb7185' },
      { t: 0.64, speed: 0.0008, threadIndex: 2, size: 4.0, color: '#c084fc' },
      { t: 0.32, speed: 0.0009, threadIndex: 3, size: 4.5, color: '#34d399' },
      { t: 0.88, speed: 0.0007, threadIndex: 3, size: 3.5, color: '#38bdf8' }
    ];

    // Ambient floating 3D dust / stars
    const ambientNodes: AmbientNode3D[] = Array.from({ length: 24 }).map((_, i) => ({
      xRel: Math.random(),
      yRel: Math.random(),
      z: (Math.random() - 0.5) * 120,
      vx: (Math.random() - 0.5) * 0.0002,
      vy: (Math.random() - 0.5) * 0.0002,
      size: 1.5 + Math.random() * 2.0,
      color: i % 4 === 0 ? '#818cf8' : i % 4 === 1 ? '#a855f7' : i % 4 === 2 ? '#38bdf8' : '#34d399'
    }));

    // ========================================================================
    // 3. 3D MATH PROJECTION ENGINE
    // ========================================================================

    const project3D = (
      p: Point3D,
      cx: number,
      cy: number,
      rx: number,
      ry: number,
      rz: number,
      fov: number = 420
    ) => {
      // Rotation Y
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const x1 = p.x * cosY + p.z * sinY;
      const z1 = -p.x * sinY + p.z * cosY;

      // Rotation X
      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const y2 = p.y * cosX - z1 * sinX;
      const z2 = p.y * sinX + z1 * cosX;

      // Rotation Z
      const cosZ = Math.cos(rz);
      const sinZ = Math.sin(rz);
      const x3 = x1 * cosZ - y2 * sinZ;
      const y3 = x1 * sinZ + y2 * cosZ;

      // Perspective Scale
      const scale = fov / (fov + z2);
      return {
        x: cx + x3 * scale,
        y: cy + y3 * scale,
        z: z2,
        scale
      };
    };

    // Calculate thread Y position at specific X and time
    const getThreadPoint = (thread: ThreadDef, x: number, t: number) => {
      const baseY = thread.yBaseRel * height;
      const wave1 = Math.sin(x * thread.frequency + t * thread.speed) * thread.amplitude;
      const wave2 = Math.cos(x * (thread.frequency * 0.65) - t * (thread.speed * 0.75)) * (thread.amplitude * 0.45);
      const mouseOffset = mouseX * 28 * (thread.zDepth / 100);
      return baseY + wave1 + wave2 + mouseOffset;
    };

    // ========================================================================
    // 4. ANIMATION RENDER LOOP
    // ========================================================================

    let lastTimestamp = performance.now();

    const render = (timestamp: number) => {
      const delta = Math.min((timestamp - lastTimestamp) / 16.66, 2.0);
      lastTimestamp = timestamp;
      time += 1.0 * delta;

      // Smooth mouse parallax easing (lerp)
      mouseX += (targetMouseX - mouseX) * 0.05 * delta;
      mouseY += (targetMouseY - mouseY) * 0.05 * delta;

      ctx.clearRect(0, 0, width, height);

      // ----------------------------------------------------------------------
      // Draw Ambient 3D Constellation Nodes (Depth Dust)
      // ----------------------------------------------------------------------
      ambientNodes.forEach((node) => {
        node.xRel += node.vx * delta;
        node.yRel += node.vy * delta;
        if (node.xRel < 0) node.xRel = 1;
        if (node.xRel > 1) node.xRel = 0;
        if (node.yRel < 0) node.yRel = 1;
        if (node.yRel > 1) node.yRel = 0;

        const posX = node.xRel * width + mouseX * 20 * (node.z / 100);
        const posY = node.yRel * height + mouseY * 20 * (node.z / 100);
        const depthScale = 400 / (400 + node.z);
        const alpha = Math.max(0.15, Math.min(0.5, 0.3 + node.z / 300)) * opacity;

        ctx.save();
        ctx.fillStyle = node.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(posX, posY, node.size * depthScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // ----------------------------------------------------------------------
      // Draw Flowing 3D Threads (Multi-Strand Ribbon Bundles)
      // ----------------------------------------------------------------------
      threads.forEach((thread) => {
        const step = 20;
        const pts: { x: number; y: number }[] = [];

        for (let x = -50; x <= width + 50; x += step) {
          const y = getThreadPoint(thread, x, time * 10);
          pts.push({ x, y });
        }

        if (pts.length < 2) return;

        // Render main thread line with horizontal gradient
        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, thread.gradient[0]);
        grad.addColorStop(0.5, thread.gradient[1]);
        grad.addColorStop(1, thread.gradient[2]);

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.9;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          const xc = (pts[i - 1].x + pts[i].x) / 2;
          const yc = (pts[i - 1].y + pts[i].y) / 2;
          ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, xc, yc);
        }
        ctx.stroke();

        // Render parallel secondary micro-strand for 3D ribbon volume
        ctx.strokeStyle = thread.gradient[1];
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y + 7);
        for (let i = 1; i < pts.length; i++) {
          const xc = (pts[i - 1].x + pts[i].x) / 2;
          const yc = (pts[i - 1].y + pts[i].y) / 2 + 7;
          ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y + 7, xc, yc);
        }
        ctx.stroke();

        ctx.restore();
      });

      // ----------------------------------------------------------------------
      // Draw Traveling Particles Moving Along Threads (One place to another)
      // ----------------------------------------------------------------------
      particles.forEach((p) => {
        p.t += p.speed * delta;
        if (p.t > 1) p.t = 0;

        const currentThread = threads[p.threadIndex];
        const currentX = p.t * width;
        const currentY = getThreadPoint(currentThread, currentX, time * 10);

        ctx.save();
        ctx.globalAlpha = opacity;

        // Radiant glowing halo
        const haloGrad = ctx.createRadialGradient(
          currentX,
          currentY,
          0,
          currentX,
          currentY,
          p.size * 4.5
        );
        haloGrad.addColorStop(0, p.color);
        haloGrad.addColorStop(0.4, p.color + '77');
        haloGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(currentX, currentY, p.size * 4.5, 0, Math.PI * 2);
        ctx.fill();

        // High-energy core nucleus
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(currentX, currentY, p.size * 0.75, 0, Math.PI * 2);
        ctx.fill();

        // Trailing luminous energy tail
        const tailLength = 40;
        const prevX = Math.max(0, currentX - tailLength);
        const prevY = getThreadPoint(currentThread, prevX, time * 10);

        const tailGrad = ctx.createLinearGradient(prevX, prevY, currentX, currentY);
        tailGrad.addColorStop(0, 'transparent');
        tailGrad.addColorStop(1, p.color);

        ctx.strokeStyle = tailGrad;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();

        ctx.restore();
      });

      // ----------------------------------------------------------------------
      // Draw 3D Polyhedra Shapes (Wireframes with glowing nodes & specular depth)
      // ----------------------------------------------------------------------
      shapes.forEach((shape) => {
        // Continuous 3D rotation on multiple axes
        shape.rotX += shape.speedX * delta;
        shape.rotY += shape.speedY * delta;
        shape.rotZ += shape.speedZ * delta;

        // Harmonic vertical float bobbing
        const floatOffset = Math.sin(time * shape.floatSpeed + shape.floatPhase) * shape.floatAmp;
        const mouseParallaxX = mouseX * 40;
        const mouseParallaxY = mouseY * 40;

        const centerX = shape.xRel * width + mouseParallaxX;
        const centerY = shape.yRel * height + floatOffset + mouseParallaxY;

        // Project 3D vertices into 2D viewport with perspective
        const projectedVerts = shape.vertices.map((v) =>
          project3D(v, centerX, centerY, shape.rotX, shape.rotY, shape.rotZ)
        );

        ctx.save();

        // Ambient radial light bloom behind shape
        const radialGlow = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          shape.radius * 1.6
        );
        radialGlow.addColorStop(0, shape.glowColor);
        radialGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = radialGlow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, shape.radius * 1.6, 0, Math.PI * 2);
        ctx.fill();

        // Draw 3D Wireframe Edges
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = 1.35;
        ctx.lineCap = 'round';

        shape.edges.forEach((edge) => {
          const vA = projectedVerts[edge.a];
          const vB = projectedVerts[edge.b];
          if (!vA || !vB) return;

          // Depth-based opacity shading (closer edges are brighter)
          const avgZ = (vA.z + vB.z) / 2;
          const depthAlpha = Math.max(0.2, Math.min(0.9, 0.55 + avgZ / 100));
          ctx.globalAlpha = depthAlpha * opacity;

          ctx.beginPath();
          ctx.moveTo(vA.x, vA.y);
          ctx.lineTo(vB.x, vB.y);
          ctx.stroke();
        });

        // Draw 3D Vertices (Glowing Nodes)
        projectedVerts.forEach((v) => {
          const nodeAlpha = Math.max(0.3, Math.min(1.0, 0.65 + v.z / 80));
          ctx.globalAlpha = nodeAlpha * opacity;

          // Outer colored glow ring
          ctx.fillStyle = shape.color;
          ctx.beginPath();
          ctx.arc(v.x, v.y, 2.8 * v.scale, 0, Math.PI * 2);
          ctx.fill();

          // Core bright white specular dot
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(v.x, v.y, 1.3 * v.scale, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    // Pause rendering when document is hidden to optimize performance
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else {
        lastTimestamp = performance.now();
        animationFrameId = requestAnimationFrame(render);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [opacity]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{
        pointerEvents: 'none',
        position: 'fixed',
        inset: 0,
        zIndex: 0
      }}
    />
  );
};
