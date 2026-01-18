import { useRef } from 'react';

export interface LookState {
  deltaX: number; // Left/Right (Yaw)
  deltaY: number; // Up/Down (Pitch)
}

interface TouchLookProps {
  lookState: LookState;
}

export const TouchLook = ({ lookState }: TouchLookProps) => {
  const touchIdRef = useRef<number | null>(null);
  const lastPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    touchIdRef.current = e.pointerId;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.pointerId !== touchIdRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;

    // Update global state
    // Sensitivity factor (adjust as needed)
    const SENSITIVITY = 0.005;
    lookState.deltaX -= dx * SENSITIVITY;
    lookState.deltaY -= dy * SENSITIVITY;

    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerId !== touchIdRef.current) return;
    touchIdRef.current = null;
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
        left: '50vw',    // Starts at middle
        width: '50vw',   // Covers right half
        height: '100vh',
        zIndex: 20,
        touchAction: 'none',
        userSelect: 'none',
        pointerEvents: 'auto',
        backgroundColor: 'transparent', // Invisible
      }}
    />
  );
};