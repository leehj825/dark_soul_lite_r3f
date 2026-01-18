import { useState, useRef } from 'react';

export interface JoystickState {
  x: number;
  y: number;
  active: boolean;
  magnitude: number;
}

interface JoystickProps {
  inputState: JoystickState;
}

export const Joystick = ({ inputState }: JoystickProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [basePos, setBasePos] = useState({ x: 0, y: 0 });
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  
  const MAX_RADIUS = 50;
  const touchIdRef = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const x = e.clientX;
    const y = e.clientY;

    setIsVisible(true);
    setBasePos({ x, y });
    setStickPos({ x: 0, y: 0 });
    touchIdRef.current = e.pointerId;
    
    (e.target as Element).setPointerCapture(e.pointerId);

    inputState.active = true;
    inputState.x = 0;
    inputState.y = 0;
    inputState.magnitude = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isVisible || e.pointerId !== touchIdRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    let dx = e.clientX - basePos.x;
    let dy = e.clientY - basePos.y;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const clampedDistance = Math.min(distance, MAX_RADIUS);
    
    const angle = Math.atan2(dy, dx);
    const stickX = Math.cos(angle) * clampedDistance;
    const stickY = Math.sin(angle) * clampedDistance;

    setStickPos({ x: stickX, y: stickY });

    inputState.x = stickX / MAX_RADIUS;
    inputState.y = stickY / MAX_RADIUS;
    inputState.magnitude = clampedDistance / MAX_RADIUS;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerId !== touchIdRef.current) return;
    e.preventDefault();
    
    setIsVisible(false);
    touchIdRef.current = null;
    
    inputState.active = false;
    inputState.x = 0;
    inputState.y = 0;
    inputState.magnitude = 0;
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '50vw',   // Strictly Left Half
        height: '100vh', 
        zIndex: 20,
        touchAction: 'none',
        userSelect: 'none',
        pointerEvents: 'auto',
        // CHANGED: Transparent background (removed red debug box)
        backgroundColor: 'transparent', 
      }}
    >
      {isVisible && (
        <div
          style={{
            position: 'absolute',
            left: basePos.x,
            top: basePos.y,
            transform: 'translate(-50%, -50%)',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${stickPos.x}px), calc(-50% + ${stickPos.y}px))`,
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
            }}
          />
        </div>
      )}
    </div>
  );
};