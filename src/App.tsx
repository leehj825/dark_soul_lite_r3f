import { Canvas } from '@react-three/fiber';
import { KeyboardControls, KeyboardControlsEntry } from '@react-three/drei';
import { Suspense, useMemo, useRef, useState } from 'react';
import { Group } from 'three';
import { PlayerController, ActionState } from './game/PlayerController'; // Import ActionState
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

// GameScene now accepts actionState to pass to PlayerController
function GameScene({ joystickState, lookState, actionState }: { 
  joystickState: JoystickState; 
  lookState: LookState; 
  actionState: ActionState;
}) {
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
        actionState={actionState} // Pass the shared state
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

  // Shared States (Mutable objects for performance)
  const joystickState = useMemo<JoystickState>(() => ({ x: 0, y: 0, active: false, magnitude: 0 }), []);
  const lookState = useMemo<LookState>(() => ({ deltaX: 0, deltaY: 0 }), []);
  const actionState = useMemo<ActionState>(() => ({ jump: false, run: false }), []);

  // Local React State for UI updates (Color changes)
  const [isRunMode, setIsRunMode] = useState(false);

  const handleJump = () => {
    actionState.jump = true;
  };

  const toggleRun = () => {
    actionState.run = !actionState.run;
    setIsRunMode(actionState.run); // Update UI
  };
  
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: 'black', touchAction: 'none' }}>
      
      {/* 3D Scene */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
        <KeyboardControls map={map}>
          <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
            <Suspense fallback={null}>
              <GameScene 
                joystickState={joystickState} 
                lookState={lookState} 
                actionState={actionState}
              />
            </Suspense>
          </Canvas>
        </KeyboardControls>
      </div>

      {/* UI Controls - LEFT Side (Joystick) */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none' }}>
        <Joystick inputState={joystickState} />
        <TouchLook lookState={lookState} />
      </div>

      {/* UI Controls - RIGHT Side (Buttons) */}
      <div style={{
          position: 'absolute',
          right: '30px',
          bottom: '100px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          alignItems: 'center',
          pointerEvents: 'auto',
          zIndex: 20
        }}>
          
          {/* JUMP BUTTON */}
          <button
            onPointerDown={(e) => { e.stopPropagation(); handleJump(); }}
            style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'rgba(255, 170, 0, 0.5)',
              border: '3px solid white', color: 'white', fontWeight: 'bold',
              backdropFilter: 'blur(4px)', cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              userSelect: 'none'
            }}
          >
            JUMP
          </button>

          {/* RUN TOGGLE BUTTON */}
          <button
            onPointerDown={(e) => { e.stopPropagation(); toggleRun(); }}
            style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: isRunMode ? '#00ff00' : 'rgba(255, 255, 255, 0.2)',
              border: '2px solid white', color: isRunMode ? 'black' : 'white',
              fontSize: '12px', fontWeight: 'bold',
              backdropFilter: 'blur(4px)', cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              userSelect: 'none'
            }}
          >
            {isRunMode ? "RUN" : "WALK"}
          </button>
      </div>

    </div>
  );
}

export default App;