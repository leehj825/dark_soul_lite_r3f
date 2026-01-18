import { useFrame } from '@react-three/fiber';
import { Vector3, MathUtils, Group } from 'three';
import { RefObject, useMemo, useRef } from 'react';
import { LookState } from './TouchLook';

interface ThirdPersonCameraProps {
  target: RefObject<Group>;
  lookState?: LookState;
}

export const ThirdPersonCamera = ({ target, lookState }: ThirdPersonCameraProps) => {
  const CAMERA_DISTANCE = 8;
  const offset = useMemo(() => new Vector3(0, 3, CAMERA_DISTANCE), []); 
  const currentOffset = useMemo(() => new Vector3(), []);
  const lookAtTarget = useMemo(() => new Vector3(), []);

  const pitchRef = useRef(0.2); 

  useFrame((state) => {
    if (!target.current) return;

    // 1. Update Pitch (Look Up/Down)
    if (lookState) {
      // Sensitivity for looking up/down
      pitchRef.current -= lookState.deltaY; 
      pitchRef.current = MathUtils.clamp(pitchRef.current, -0.5, 1.2);
      lookState.deltaY = 0;
    }

    // 2. Calculate RIGID Position (No Lerp = No Glitch)
    // We calculate exactly where the camera should be this frame.
    currentOffset.copy(offset);
    
    // Apply Pitch (Up/Down)
    currentOffset.applyAxisAngle(new Vector3(1, 0, 0), -pitchRef.current);

    // Apply Yaw (Match Player's Rotation)
    currentOffset.applyQuaternion(target.current.quaternion);

    // Set Final Position DIRECTLY
    // This ensures distance is always exactly 8 (no "getting closer" artifacts)
    const desiredPosition = target.current.position.clone().add(currentOffset);
    state.camera.position.copy(desiredPosition);

    // 3. Look At Target
    lookAtTarget.copy(target.current.position).add(new Vector3(0, 2, 0)); 
    state.camera.lookAt(lookAtTarget);
  });

  return null;
};