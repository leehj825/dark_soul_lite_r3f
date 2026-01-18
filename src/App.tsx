import { Canvas } from '@react-three/fiber';
import { KeyboardControls, KeyboardControlsEntry } from '@react-three/drei';
import { Suspense, useMemo, useRef } from 'react';
import { Group } from 'three';
import { PlayerController } from './game/PlayerController';
import { ThirdPersonCamera } from './game/ThirdPersonCamera';
import { useAssetLoader } from './hooks/useAssetLoader';

// Define input map
enum Controls {
  forward = 'forward',
  backward = 'backward',
  left = 'left',
  right = 'right',
  run = 'run',
}

function GameScene() {
  const { projectData, loading, error } = useAssetLoader();

  // Ref to track player position for camera to follow.
  // We need to pass this ref to PlayerController to attach to the mesh/group,
  // and to ThirdPersonCamera to read from.
  // Note: PlayerController in my previous step created its own ref.
  // I need to update PlayerController to accept a forwarded ref or I can wrap it.
  // Actually, I can just change PlayerController to forwardRef or accept a ref prop.
  // For now, let's assume I'll update PlayerController to take a `ref` prop or `groupRef` prop.

  // Wait, I can't easily change PlayerController signature without editing the file I just wrote.
  // I should check `PlayerController.tsx` again.
  // It uses `const group = useRef<Group>(null);` internally.

  // Strategy: I will modify `PlayerController.tsx` to accept a `onLoad` or just `ref` is cleaner.
  // But since I can't pass a ref to a functional component without `forwardRef`,
  // and I didn't wrap it.

  // New plan for linking:
  // I will make `PlayerController` export a ref, or better,
  // I'll update `PlayerController.tsx` to use `forwardRef`.

  // Let's create a temporary component here to hold the state? No.
  // I'll just rewrite PlayerController.tsx quickly to use forwardRef, it's cleaner.
  // OR simpler: Pass a mutable object `targetObject` to PlayerController that it updates?
  // OR just lift the ref up.

  // I will assume I will fix `PlayerController.tsx` in the next step (Self-Correction).
  // For now, I'll write App.tsx assuming PlayerController accepts `ref`.

  const playerRef = useRef<Group>(null);

  if (loading) return <group><mesh><boxGeometry /><meshStandardMaterial color="yellow" /></mesh></group>;
  if (error) return <group><mesh><boxGeometry /><meshStandardMaterial color="red" /></mesh></group>;

  return (
    <>
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <ambientLight intensity={0.5} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="green" />
      </mesh>

      {/* Player */}
      <PlayerController ref={playerRef} projectData={projectData} />

      {/* Camera */}
      <ThirdPersonCamera target={playerRef} />
    </>
  );
}

function App() {
  const map = useMemo<KeyboardControlsEntry<Controls>[]>(()=>[
    { name: Controls.forward, keys: ['ArrowUp', 'KeyW'] },
    { name: Controls.backward, keys: ['ArrowDown', 'KeyS'] },
    { name: Controls.left, keys: ['ArrowLeft', 'KeyA'] },
    { name: Controls.right, keys: ['ArrowRight', 'KeyD'] },
    { name: Controls.run, keys: ['Shift'] },
  ], [])

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <KeyboardControls map={map}>
        <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
          <Suspense fallback={null}>
            <GameScene />
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </div>
  );
}

export default App;
