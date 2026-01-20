import { Canvas } from '@react-three/fiber';
import { KeyboardControls, KeyboardControlsEntry, Environment, Sky, ContactShadows, Float } from '@react-three/drei';
import { Suspense, useMemo, useRef, useState } from 'react';
import { Group } from 'three';
import { PlayerController, ActionState } from './game/PlayerController'; 
import { ThirdPersonCamera } from './game/ThirdPersonCamera';
import { useAssetLoader } from './hooks/useAssetLoader';
import { Joystick, JoystickState } from './game/Joystick';
import { LookState, TouchLook } from './game/TouchLook';

enum Controls {
  forward = 'forward',
  backward = 'backward',
  left = 'left',
  right = 'right',
  run = 'run',
}

// Taller Low-Poly Tree Component with varied heights
function Tree({ position, height = 5 }: { position: [number, number, number], height?: number }) {
  const trunkHeight = height * 0.3;
  const leavesHeight = height * 0.7;

  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, trunkHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.35, trunkHeight, 6]} />
        <meshStandardMaterial color="#4d2902" />
      </mesh>
      
      {/* Leaves (Taller and Layered) */}
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
        <group position={[0, trunkHeight + (leavesHeight / 2), 0]}>
          {/* Main Bottom Leaves */}
          <mesh castShadow>
            <coneGeometry args={[1.8, leavesHeight, 6]} />
            <meshStandardMaterial color="#2d5a27" />
          </mesh>
          {/* Top Layer Leaves for extra height */}
          <mesh position={[0, leavesHeight * 0.35, 0]}>
            <coneGeometry args={[1.0, leavesHeight * 0.6, 6]} />
            <meshStandardMaterial color="#3a6b32" />
          </mesh>
        </group>
      </Float>
    </group>
  );
}

function GameScene({ joystickState, lookState, actionState }: { 
  joystickState: JoystickState; 
  lookState: LookState; 
  actionState: ActionState;
}) {
  const { projectData, loading, error } = useAssetLoader();
  const playerRef = useRef<Group>(null);

  // Generate random nature positions with varied tree heights
  const nature = useMemo(() => {
    const trees = [...Array(30)].map(() => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 15 + Math.random() * 45; // Keep play area clear
      return {
        position: [Math.cos(angle) * dist, 0, Math.sin(angle) * dist] as [number, number, number],
        height: 5 + Math.random() * 5 // Tall trees between 5 and 10 units
      };
    });

    const grass = [...Array(100)].map(() => [
      (Math.random() - 0.5) * 120,
      0,
      (Math.random() - 0.5) * 120
    ] as [number, number, number]);

    return { trees, grass };
  }, []);

  if (loading || error) return null;

  return (
    <>
      {/* Lighting and Atmosphere */}
      <Environment preset="park" />
      <Sky sunPosition={[100, 20, 100]} />
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[20, 40, 20]} 
        intensity={1.2} 
        castShadow 
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />

      {/* Grass Terrain Plain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#2d401f" roughness={1} />
      </mesh>

      {/* Tall Forest */}
      {nature.trees.map((tree, i) => (
        <Tree key={i} position={tree.position} height={tree.height} />
      ))}

      {/* Scattered Grass Clumps */}
      {nature.grass.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh rotation={[0, Math.random(), 0]}>
            <planeGeometry args={[0.7, 0.5]} />
            <meshStandardMaterial color="#4b6b2f" side={2} alphaTest={0.5} />
          </mesh>
          <mesh rotation={[0, Math.random() + 1.5, 0]}>
            <planeGeometry args={[0.7, 0.5]} />
            <meshStandardMaterial color="#4b6b2f" side={2} alphaTest={0.5} />
          </mesh>
        </group>
      ))}

      {/* Global Shadows */}
      <ContactShadows 
        position={[0, 0.01, 0]} 
        opacity={0.4} 
        scale={60} 
        blur={2} 
        far={15} 
      />

      <PlayerController 
        ref={playerRef} 
        projectData={projectData} 
        inputState={joystickState} 
        lookState={lookState}
        actionState={actionState}
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
  const actionState = useMemo<ActionState>(() => ({ jump: false, run: false }), []);

  const [isRunMode, setIsRunMode] = useState(false);

  const handleJump = () => {
    actionState.jump = true;
  };

  const toggleRun = () => {
    actionState.run = !actionState.run;
    setIsRunMode(actionState.run);
  };
  
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#87CEEB', touchAction: 'none' }}>
      
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

      {/* UI Overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none' }}>
        <Joystick inputState={joystickState} />
        <TouchLook lookState={lookState} />
      </div>

      {/* Controls */}
      <div style={{
          position: 'absolute',
          right: '80px',
          bottom: '100px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          alignItems: 'center',
          pointerEvents: 'auto',
          zIndex: 20
        }}>
          
          <button
            onPointerDown={(e) => { e.stopPropagation(); handleJump(); }}
            style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'rgba(255, 170, 0, 0.7)',
              border: '3px solid white', color: 'white', fontWeight: 'bold',
              backdropFilter: 'blur(4px)', cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              userSelect: 'none'
            }}
          >
            JUMP
          </button>

          <button
            onPointerDown={(e) => { e.stopPropagation(); toggleRun(); }}
            style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: isRunMode ? '#44ff44' : 'rgba(255, 255, 255, 0.4)',
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