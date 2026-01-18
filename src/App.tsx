import { Canvas } from '@react-three/fiber';
import { KeyboardControls, KeyboardControlsEntry } from '@react-three/drei';
import { Suspense, useMemo, useRef } from 'react';
import { Group } from 'three';
import { PlayerController } from './game/PlayerController';
import { ThirdPersonCamera } from './game/ThirdPersonCamera';
import { useAssetLoader } from './hooks/useAssetLoader';
import { Joystick, JoystickState } from './game/Joystick';
import { TouchLook, LookState } from './game/TouchLook';

enum Controls {
  forward = 'forward',
  backward = 'backward',
  left = 'left',
  right = 'right',
  run = 'run',
}

function GameScene({ joystickState, lookState }: { joystickState: JoystickState; lookState: LookState; }) {
  const { projectData, loading, error } = useAssetLoader();
  const playerRef = useRef<Group>(null);

  if (loading) return null;
  if (error) return null;

  return (
    <>
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
      <ambientLight intensity={0.5} />
      <gridHelper args={[100, 100]} position={[0, 0, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      <PlayerController 
        ref={playerRef} 
        projectData={projectData} 
        inputState={joystickState} 
        lookState={lookState}
      />
      <ThirdPersonCamera target={playerRef} lookState={lookState} />
    </>
  );
}

function App() {
  const map = useMemo<KeyboardControlsEntry<Controls>[]>(() => [
    { name: Controls.forward, keys: ['ArrowUp', 'KeyW'] },
    { name: Controls.backward, keys: ['ArrowDown', 'KeyS'] },
    { name: Controls.left, keys: ['ArrowLeft', 'KeyA'] },
    { name: Controls.right, keys: ['ArrowRight', 'KeyD'] },
    { name: Controls.run, keys: ['Shift'] },
  ], []);

  const joystickState = useMemo<JoystickState>(() => ({ x: 0, y: 0, active: false, magnitude: 0 }), []);
  const lookState = useMemo<LookState>(() => ({ deltaX: 0, deltaY: 0 }), []);
  
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: 'black', touchAction: 'none' }}>
      
      {/* 3D Scene */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
        <KeyboardControls map={map}>
          <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
            <Suspense fallback={null}>
              <GameScene joystickState={joystickState} lookState={lookState} />
            </Suspense>
          </Canvas>
        </KeyboardControls>
      </div>

      {/* UI Controls */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none' }}>
        <Joystick inputState={joystickState} />
        <TouchLook lookState={lookState} />
      </div>

    </div>
  );
}

export default App;