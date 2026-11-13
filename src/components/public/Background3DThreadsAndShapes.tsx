import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Background3DProps {
  className?: string;
  opacity?: number;
}

export const Background3DThreadsAndShapes: React.FC<Background3DProps> = ({
  className = 'fixed inset-0 pointer-events-none z-0',
  opacity = 0.92
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera & WebGL Renderer
    const scene = new THREE.Scene();

    let width = window.innerWidth;
    let height = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 18);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    container.appendChild(renderer.domElement);

    // 2. Dynamic Studio Lights (Key, Fill, and Radiant Colored Rim Lights)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(8, 12, 10);
    scene.add(dirLight);

    const indigoLight = new THREE.PointLight(0x6366f1, 4.0, 35);
    indigoLight.position.set(-10, 8, 6);
    scene.add(indigoLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 4.0, 35);
    cyanLight.position.set(10, -6, 6);
    scene.add(cyanLight);

    const pinkLight = new THREE.PointLight(0xec4899, 3.2, 30);
    pinkLight.position.set(0, 10, -4);
    scene.add(pinkLight);

    // 3. Volumetric 3D Floating Geometric Objects
    interface FloatingMesh {
      mesh: THREE.Object3D;
      rotSpeedX: number;
      rotSpeedY: number;
      rotSpeedZ: number;
      baseX: number;
      baseY: number;
      baseZ: number;
      floatPhase: number;
      floatSpeed: number;
      floatAmp: number;
    }

    const floatingObjects: FloatingMesh[] = [];

    // Helper: Create high-polish glossy material with transmission and iridescent luster
    const createGlossMaterial = (color: number, roughness = 0.18, metalness = 0.65, emissive = 0x000000) => {
      return new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness,
        emissive,
        emissiveIntensity: 0.25,
        transparent: true,
        opacity: 0.88 * opacity
      });
    };

    // Object 1: The Grand Torus Knot (Twisted 3D Chrome Ribbon) — Upper Right
    const knotGeom = new THREE.TorusKnotGeometry(1.65, 0.42, 120, 24, 2, 3);
    const knotMat = createGlossMaterial(0x7c3aed, 0.15, 0.75, 0x4c1d95); // Deep Violet
    const knotMesh = new THREE.Mesh(knotGeom, knotMat);
    knotMesh.position.set(9.5, 4.2, -2.5);
    scene.add(knotMesh);

    // Inner wireframe lattice for high-tech holographic texture
    const knotWireMat = new THREE.MeshBasicMaterial({
      color: 0xc4b5fd,
      wireframe: true,
      transparent: true,
      opacity: 0.18
    });
    const knotWireMesh = new THREE.Mesh(knotGeom, knotWireMat);
    knotMesh.add(knotWireMesh);

    floatingObjects.push({
      mesh: knotMesh,
      rotSpeedX: 0.005,
      rotSpeedY: 0.008,
      rotSpeedZ: 0.003,
      baseX: 9.5,
      baseY: 4.2,
      baseZ: -2.5,
      floatPhase: 0,
      floatSpeed: 0.0018,
      floatAmp: 0.6
    });

    // Object 2: Multi-Faceted Octahedron Gem (Diamond Prism) — Mid Left
    const octaGeom = new THREE.OctahedronGeometry(1.85, 0);
    const octaMat = createGlossMaterial(0xec4899, 0.12, 0.85, 0x9d174d); // Pink/Rose
    const octaMesh = new THREE.Mesh(octaGeom, octaMat);
    octaMesh.position.set(-10.2, 0.5, -1.0);
    scene.add(octaMesh);

    const octaWireMat = new THREE.MeshBasicMaterial({
      color: 0xfbcfe8,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    octaMesh.add(new THREE.Mesh(octaGeom, octaWireMat));

    floatingObjects.push({
      mesh: octaMesh,
      rotSpeedX: 0.007,
      rotSpeedY: 0.006,
      rotSpeedZ: 0.004,
      baseX: -10.2,
      baseY: 0.5,
      baseZ: -1.0,
      floatPhase: 1.5,
      floatSpeed: 0.002,
      floatAmp: 0.7
    });

    // Object 3: Celestial Icosahedron Crystal — Upper Left
    const icoGeom = new THREE.IcosahedronGeometry(1.6, 0);
    const icoMat = createGlossMaterial(0x06b6d4, 0.2, 0.7, 0x155e75); // Electric Cyan
    const icoMesh = new THREE.Mesh(icoGeom, icoMat);
    icoMesh.position.set(-8.5, 6.2, -3.0);
    scene.add(icoMesh);

    const icoWireMat = new THREE.MeshBasicMaterial({
      color: 0xa5f3fc,
      wireframe: true,
      transparent: true,
      opacity: 0.22
    });
    icoMesh.add(new THREE.Mesh(icoGeom, icoWireMat));

    floatingObjects.push({
      mesh: icoMesh,
      rotSpeedX: 0.006,
      rotSpeedY: 0.005,
      rotSpeedZ: 0.006,
      baseX: -8.5,
      baseY: 6.2,
      baseZ: -3.0,
      floatPhase: 3.0,
      floatSpeed: 0.0016,
      floatAmp: 0.55
    });

    // Object 4: Gyroscopic Dual Orbital Rings — Lower Left
    const gyroGroup = new THREE.Group();
    const ring1Geom = new THREE.TorusGeometry(1.9, 0.08, 16, 80);
    const ring1Mat = createGlossMaterial(0x6366f1, 0.15, 0.9, 0x3730a3);
    const ring1Mesh = new THREE.Mesh(ring1Geom, ring1Mat);

    const ring2Geom = new THREE.TorusGeometry(1.4, 0.08, 16, 80);
    const ring2Mat = createGlossMaterial(0xf59e0b, 0.15, 0.9, 0x92400e); // Amber Gold
    const ring2Mesh = new THREE.Mesh(ring2Geom, ring2Mat);
    ring2Mesh.rotation.x = Math.PI / 2.5;

    // Central glowing energy pearl inside the gyroscope
    const coreGeom = new THREE.SphereGeometry(0.55, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x6366f1,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.5,
      transparent: true,
      opacity: 0.9
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);

    gyroGroup.add(ring1Mesh);
    gyroGroup.add(ring2Mesh);
    gyroGroup.add(coreMesh);
    gyroGroup.position.set(-8.8, -5.5, -2.0);
    scene.add(gyroGroup);

    floatingObjects.push({
      mesh: gyroGroup,
      rotSpeedX: 0.008,
      rotSpeedY: 0.012,
      rotSpeedZ: 0.005,
      baseX: -8.8,
      baseY: -5.5,
      baseZ: -2.0,
      floatPhase: 4.5,
      floatSpeed: 0.0017,
      floatAmp: 0.65
    });

    // Object 5: Dodecahedron Emerald Monolith — Lower Right
    const dodecGeom = new THREE.DodecahedronGeometry(1.5, 0);
    const dodecMat = createGlossMaterial(0x10b981, 0.2, 0.8, 0x064e3b); // Emerald
    const dodecMesh = new THREE.Mesh(dodecGeom, dodecMat);
    dodecMesh.position.set(9.0, -5.8, -2.0);
    scene.add(dodecMesh);

    const dodecWireMat = new THREE.MeshBasicMaterial({
      color: 0x6ee7b7,
      wireframe: true,
      transparent: true,
      opacity: 0.2
    });
    dodecMesh.add(new THREE.Mesh(dodecGeom, dodecWireMat));

    floatingObjects.push({
      mesh: dodecMesh,
      rotSpeedX: 0.005,
      rotSpeedY: 0.007,
      rotSpeedZ: 0.004,
      baseX: 9.0,
      baseY: -5.8,
      baseZ: -2.0,
      floatPhase: 2.2,
      floatSpeed: 0.0019,
      floatAmp: 0.6
    });

    // Object 6 & 7: Zero-G Iridescent Spheres (Mercury beads floating in depth)
    const sphereCoords = [
      { x: 3.5, y: 7.0, z: -4.0, r: 0.75, c: 0x8b5cf6 },
      { x: -3.5, y: -7.5, z: -3.5, r: 0.85, c: 0xec4899 },
      { x: 7.2, y: 1.0, z: -5.0, r: 0.55, c: 0x06b6d4 },
      { x: -5.5, y: 2.8, z: -4.5, r: 0.6, c: 0x10b981 }
    ];

    sphereCoords.forEach((s, idx) => {
      const sGeom = new THREE.SphereGeometry(s.r, 32, 32);
      const sMat = createGlossMaterial(s.c, 0.1, 0.9, s.c);
      const sMesh = new THREE.Mesh(sGeom, sMat);
      sMesh.position.set(s.x, s.y, s.z);
      scene.add(sMesh);

      floatingObjects.push({
        mesh: sMesh,
        rotSpeedX: 0.004,
        rotSpeedY: 0.005,
        rotSpeedZ: 0.003,
        baseX: s.x,
        baseY: s.y,
        baseZ: s.z,
        floatPhase: idx * 1.3,
        floatSpeed: 0.0022,
        floatAmp: 0.45
      });
    });

    // ========================================================================
    // 4. VOLUMETRIC 3D FLOWING THREADS (TUBULAR BEZIER ENERGY RIBBONS)
    // ========================================================================

    interface DynamicThread {
      curve: THREE.CatmullRomCurve3;
      tubeMesh: THREE.Mesh;
      basePoints: THREE.Vector3[];
      speed: number;
      frequency: number;
      amplitude: number;
      phase: number;
    }

    interface LightPacket {
      mesh: THREE.Mesh;
      trailMesh: THREE.Line;
      threadIndex: number;
      progress: number;
      speed: number;
      trailLength: number;
    }

    const threadsData: DynamicThread[] = [];
    const lightPackets: LightPacket[] = [];

    // Helper: Build 3D undulated spline curve across the viewport
    const createThread = (
      yBase: number,
      zBase: number,
      colorHex: number,
      speed: number,
      amp: number,
      phase: number
    ): DynamicThread => {
      const basePoints: THREE.Vector3[] = [];
      const numPoints = 12;
      const xStart = -20;
      const xEnd = 20;
      const xStep = (xEnd - xStart) / (numPoints - 1);

      for (let i = 0; i < numPoints; i++) {
        const x = xStart + i * xStep;
        const y = yBase + Math.sin(i * 0.7 + phase) * amp;
        const z = zBase + Math.cos(i * 0.6 + phase) * (amp * 0.8);
        basePoints.push(new THREE.Vector3(x, y, z));
      }

      const curve = new THREE.CatmullRomCurve3(basePoints);
      curve.curveType = 'centripetal';

      // Tube radius 0.09 for physical volumetric look
      const tubeGeom = new THREE.TubeGeometry(curve, 90, 0.085, 12, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.45,
        roughness: 0.2,
        metalness: 0.75,
        transparent: true,
        opacity: 0.82 * opacity
      });

      const tubeMesh = new THREE.Mesh(tubeGeom, tubeMat);
      scene.add(tubeMesh);

      return {
        curve,
        tubeMesh,
        basePoints,
        speed,
        frequency: 0.8,
        amplitude: amp,
        phase
      };
    };

    // 4 Distinct Volumetric 3D Threads flowing across the scene
    threadsData.push(createThread(4.2, -1.5, 0x6366f1, 0.0012, 1.8, 0.0)); // Violet/Indigo Thread
    threadsData.push(createThread(1.0, -3.0, 0x06b6d4, -0.0010, 2.2, 1.8)); // Cyan Thread
    threadsData.push(createThread(-2.5, -1.0, 0xec4899, 0.0014, 2.0, 3.4)); // Magenta/Pink Thread
    threadsData.push(createThread(-5.5, -2.5, 0x10b981, -0.0011, 1.9, 4.8)); // Emerald Thread

    // Traveling Energy Pulses (Moving from one place to another along the 3D threads)
    const packetColors = [0xa5b4fc, 0xf472b6, 0x67e8f9, 0x6ee7b7, 0xfde047, 0xc084fc];

    for (let p = 0; p < 8; p++) {
      const threadIdx = p % threadsData.length;
      const color = packetColors[p % packetColors.length];

      // Radiant energy orb head
      const orbGeom = new THREE.SphereGeometry(0.24, 16, 16);
      const orbMat = new THREE.MeshBasicMaterial({
        color: 0xffffff
      });
      const orbMesh = new THREE.Mesh(orbGeom, orbMat);

      // Outer glowing halo
      const glowOrbGeom = new THREE.SphereGeometry(0.48, 16, 16);
      const glowOrbMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.65
      });
      orbMesh.add(new THREE.Mesh(glowOrbGeom, glowOrbMat));

      // Trailing laser light streak
      const trailPoints: THREE.Vector3[] = [];
      const trailCount = 14;
      for (let j = 0; j < trailCount; j++) {
        trailPoints.push(new THREE.Vector3(0, 0, 0));
      }
      const trailGeom = new THREE.BufferGeometry().setFromPoints(trailPoints);
      const trailMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.75,
        linewidth: 2
      });
      const trailMesh = new THREE.Line(trailGeom, trailMat);
      scene.add(trailMesh);

      scene.add(orbMesh);

      lightPackets.push({
        mesh: orbMesh,
        trailMesh,
        threadIndex: threadIdx,
        progress: (p * 0.125) % 1.0,
        speed: 0.0018 + (p % 3) * 0.0006,
        trailLength: 0.045
      });
    }

    // 5. Ambient 3D Energy Particle Dust Constellation (120 particles)
    const particleCount = 120;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const colorPalette = [
      new THREE.Color(0x6366f1),
      new THREE.Color(0x06b6d4),
      new THREE.Color(0xec4899),
      new THREE.Color(0x10b981),
      new THREE.Color(0xf59e0b)
    ];

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 36;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 24;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 16 - 2;

      const c = colorPalette[i % colorPalette.length];
      particleColors[i * 3] = c.r;
      particleColors[i * 3 + 1] = c.g;
      particleColors[i * 3 + 2] = c.b;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeom.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particleGeom, particleMat);
    scene.add(particleSystem);

    // ========================================================================
    // 6. INTERACTIVE MOUSE PARALLAX & ANIMATION LOOP
    // ========================================================================

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = (e.clientY / window.innerHeight) * 2 - 1;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };

    window.addEventListener('resize', onResize);

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Fluid mouse parallax interpolation (lerp)
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Parallax camera tilt
      camera.position.x = mouseX * 2.2;
      camera.position.y = -mouseY * 1.8;
      camera.lookAt(0, 0, 0);

      // Shift dynamic point lights subtly for dynamic specular gleams
      indigoLight.position.x = -10 + mouseX * 4;
      cyanLight.position.x = 10 + mouseX * 4;
      pinkLight.position.y = 10 - mouseY * 4;

      // 1. Animate 3D Floating Objects
      floatingObjects.forEach((obj) => {
        obj.mesh.rotation.x += obj.rotSpeedX;
        obj.mesh.rotation.y += obj.rotSpeedY;
        obj.mesh.rotation.z += obj.rotSpeedZ;

        // Vertical harmonic float bobbing + mouse parallax
        const bob = Math.sin(elapsedTime * obj.floatSpeed * 1000 + obj.floatPhase) * obj.floatAmp;
        obj.mesh.position.y = obj.baseY + bob - mouseY * 0.8;
        obj.mesh.position.x = obj.baseX + mouseX * 0.8;
      });

      // 2. Animate and Deform 3D Spline Threads
      threadsData.forEach((t) => {
        const points = t.basePoints;
        for (let i = 0; i < points.length; i++) {
          const pt = points[i];
          const wave = Math.sin(elapsedTime * 1.5 + i * 0.6 + t.phase) * t.amplitude;
          const waveZ = Math.cos(elapsedTime * 1.2 + i * 0.5 + t.phase) * (t.amplitude * 0.6);
          pt.y = pt.y + (wave - pt.y + t.basePoints[i].y) * 0.04;
          pt.z = pt.z + (waveZ - pt.z + t.basePoints[i].z) * 0.04;
        }

        t.curve.points = points;
        // Regenerate tube geometry with updated deformed curve points
        t.tubeMesh.geometry.dispose();
        t.tubeMesh.geometry = new THREE.TubeGeometry(t.curve, 90, 0.085, 12, false);
      });

      // 3. Animate Light Packets Moving Along the 3D Threads (one place to another)
      lightPackets.forEach((lp) => {
        lp.progress += lp.speed * (delta * 60);
        if (lp.progress > 1.0) {
          lp.progress = 0.0;
        }

        const parentThread = threadsData[lp.threadIndex];
        const headPos = parentThread.curve.getPointAt(lp.progress);
        lp.mesh.position.copy(headPos);

        // Update trailing tail line behind packet
        const trailPositions: THREE.Vector3[] = [];
        const steps = 14;
        for (let s = 0; s < steps; s++) {
          const trailT = Math.max(0, lp.progress - (s / steps) * lp.trailLength);
          trailPositions.push(parentThread.curve.getPointAt(trailT));
        }

        lp.trailMesh.geometry.setFromPoints(trailPositions);
      });

      // 4. Subtle rotation of background ambient particle stars
      particleSystem.rotation.y = elapsedTime * 0.02;
      particleSystem.rotation.x = elapsedTime * 0.01;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    // Pause when page is hidden to preserve GPU/battery
    const onVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        clock.start();
        animId = requestAnimationFrame(animate);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    animId = requestAnimationFrame(animate);

    // Cleanup on component unmount
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      // Dispose 3D geometries and materials
      floatingObjects.forEach((obj) => {
        if (obj.mesh instanceof THREE.Mesh) {
          obj.mesh.geometry.dispose();
          if (Array.isArray(obj.mesh.material)) {
            obj.mesh.material.forEach((m) => m.dispose());
          } else {
            obj.mesh.material.dispose();
          }
        }
      });

      threadsData.forEach((t) => {
        t.tubeMesh.geometry.dispose();
        (t.tubeMesh.material as THREE.Material).dispose();
      });

      lightPackets.forEach((lp) => {
        lp.mesh.geometry.dispose();
        (lp.mesh.material as THREE.Material).dispose();
        lp.trailMesh.geometry.dispose();
        (lp.trailMesh.material as THREE.Material).dispose();
      });

      particleGeom.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, [opacity]);

  return (
    <div
      ref={mountRef}
      className={className}
      aria-hidden="true"
      style={{
        pointerEvents: 'none',
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden'
      }}
    />
  );
};
