import { RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Group } from 'three';

interface ThirdPersonCameraProps {
  target: RefObject<Group>;
}

export const ThirdPersonCamera = ({ target }: ThirdPersonCameraProps) => {
  const { camera } = useThree();

  // Constants for camera behavior
  const CAMERA_OFFSET = new Vector3(0, 3, -6); // Position relative to target: Up and Behind
  // NOTE: If player moves forward (+Z or something), we want camera behind.
  // In `PlayerController`, forward was added to `moveDirection`.
  // If `camera.getWorldDirection` defines forward, then "behind" is relative to camera rotation?
  //
  // Standard Third Person Camera usually maintains an offset relative to the player's facing direction
  // OR relative to the world if it's a static angle.
  // The prompt says: "Calculate direction relative to the Camera. (Pressing "W" moves player away from camera)."
  // This implies the camera has its own orientation control OR follows the player.
  // "Use a 'Camera Boom' or vector offset logic in useFrame."
  // "The camera should look at the player's head/torso but lag slightly behind for smoothness."

  // A simple follow camera (Dark Souls style) usually rotates around the player.
  // Implementing full Orbit controls + Follow is complex.
  // The prompt says "Use a 'Camera Boom' or vector offset logic".
  // And "Movement: Calculate direction relative to the Camera".

  // Let's implement a simple follow cam that stays at a fixed OFFSET relative to the player's position,
  // but doesn't necessarily rotate *with* the player (which would be nauseating if player spins).
  // Usually, in these games, the camera follows position smoothly, but rotation is often manual or lazy-follow.
  // Given "Dark Soul Lite", it's usually: Camera controls rotation (Orbit), Player moves relative to Camera.
  // So the Camera shouldn't just be a child.

  // However, `OrbitControls` handles the orbiting. If I use `OrbitControls`, it controls the camera.
  // If I implement `ThirdPersonCamera`, I might fight `OrbitControls`.
  // The prompt says: "Dependencies: ... @react-three/drei (For ... OrbitControls ...)"
  // BUT Requirement 3 says: "Create a camera system that follows the player. Do not simply child the camera... Use a 'Camera Boom'..."

  // If I use OrbitControls with a target that moves, OrbitControls handles the "Boom" effectively if I update `controls.target`.
  // But maybe the user wants a custom implementation as requested.
  // "Create a camera system that follows the player... Use a 'Camera Boom' or vector offset logic in useFrame."

  // I will implement a custom follow logic. I will NOT use OrbitControls for the camera movement itself in this file,
  // OR I will use OrbitControls and just update its target?
  // "The camera should look at the player's head/torso but lag slightly behind."
  // This implies custom logic. OrbitControls usually is rigid on target.

  // Let's go with custom logic:
  // Camera Position = Player Position + Offset.
  // But we need to handle rotation. If the user wants WASD relative to camera, the camera must have an orientation.
  // Without mouse look implemented, the camera might be static or just follow behind.
  // "Pressing 'W' moves player away from camera" implies if I rotate camera, 'W' changes world direction.
  // Since I don't have mouse-look requirement explicitly ("OrbitControls" is listed in deps but not explicitly in Camera requirements),
  // I'll stick to a camera that maintains a fixed offset in WORLD space (simple) or follows the player's back (chase cam).
  // "Dark Soul" usually has a camera you control.

  // Let's implement a soft follow.
  // Camera maintains a relative offset vector.

  // Re-reading: "Dependencies... @react-three/drei (For KeyboardControls, OrbitControls...)"
  // Maybe the intention is to use OrbitControls for the rotation, and this script to move the OrbitControls target?
  // "Create a camera system that follows the player."
  // If I use OrbitControls, I can just update the `target` prop of OrbitControls to the player position.
  // But OrbitControls + smooth lag is tricky.

  // Let's write a custom camera that Lerps to a target position.
  // Target Position = Player Position + Offset.
  // To keep it simple and robust for a boilerplate:
  // Camera follows player with an offset (0, 3, 5).
  // Camera looks at player.

  const currentVelocity = useRef(new Vector3());

  useFrame((state, delta) => {
    if (!target.current) return;

    const playerPos = target.current.position;

    // Desired camera position: relative to player.
    // Let's make it a fixed offset in World Space for now,
    // effectively a "Top-Down / Isometric"ish view but 3rd person perspective.
    // If we want it to be "behind" the player, we need to know the player's "forward" or the camera's "yaw".
    // "Movement: Calculate direction relative to the Camera." -> This means Camera is the reference.

    // Let's use a standard offset.
    const desiredPosition = new Vector3(
      playerPos.x + CAMERA_OFFSET.x,
      playerPos.y + CAMERA_OFFSET.y,
      playerPos.z + CAMERA_OFFSET.z
    );

    // Smoothly interpolate camera position
    // Using simple lerp: current = lerp(current, target, factor)
    const t = 1.0 - Math.pow(0.01, delta); // Time independent lerp factor approximation

    state.camera.position.lerp(desiredPosition, 0.1);

    // Look at target (head/torso)
    const lookAtTarget = new Vector3(
      playerPos.x,
      playerPos.y + 1.5, // Look at torso/head
      playerPos.z
    );

    // Smooth lookAt is harder with the built-in lookAt method which snaps.
    // But since we are lerping position, the angle change will be somewhat smooth.
    // We can just call lookAt every frame.
    state.camera.lookAt(lookAtTarget);
  });

  return null;
};
