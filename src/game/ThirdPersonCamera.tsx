import { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';

interface ThirdPersonCameraProps {
  target: RefObject<Group>;
}

export const ThirdPersonCamera = ({ target }: ThirdPersonCameraProps) => {
  // Constants for camera behavior
  const CAMERA_OFFSET = new Vector3(0, 3, -6); // Position relative to target: Up and Behind

  useFrame((state, delta) => {
    if (!target.current) return;

    const playerPos = target.current.position;

    // Desired camera position: relative to player.
    const desiredPosition = new Vector3(
      playerPos.x + CAMERA_OFFSET.x,
      playerPos.y + CAMERA_OFFSET.y,
      playerPos.z + CAMERA_OFFSET.z
    );

    // Smoothly interpolate camera position
    // Using simple lerp: current = lerp(current, target, factor)
    const t = 1.0 - Math.pow(0.01, delta); // Time independent lerp factor approximation

    state.camera.position.lerp(desiredPosition, t);

    // Look at target (head/torso)
    const lookAtTarget = new Vector3(
      playerPos.x,
      playerPos.y + 1.5, // Look at torso/head
      playerPos.z
    );

    state.camera.lookAt(lookAtTarget);
  });

  return null;
};