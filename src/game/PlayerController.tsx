import { useRef, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { Group, Vector3, Quaternion } from 'three';

// NEW:
import { StickmanPlayer as Stickman, ParsedStickmanProject as StickmanProjectData } from 'stickman-animator-r3f';

interface PlayerControllerProps {
  projectData: StickmanProjectData | null;
}

// Controls configuration matching the map in App.tsx
// We will assume 'forward', 'backward', 'left', 'right', 'run' are the keys
export const PlayerController = forwardRef<Group, PlayerControllerProps>(({ projectData }, ref) => {
  const localGroup = useRef<Group>(null);

  // Expose the local ref to the parent
  useImperativeHandle(ref, () => localGroup.current as Group);

  // Use 'get' to poll input state inside the loop
  const [, get] = useKeyboardControls();
  const { camera } = useThree();

  // Animation state
  const [animation, setAnimation] = useState<string>('Idle');

  // Physics/Movement constants
  const WALK_SPEED = 2.0;
  const RUN_SPEED = 5.0;
  const ROTATION_SPEED = 10.0;

  // Reusable vectors to avoid garbage collection
  const moveDirection = useMemo(() => new Vector3(), []);
  const cameraDirection = useMemo(() => new Vector3(), []);
  const targetQuaternion = useMemo(() => new Quaternion(), []);

  useFrame((_, delta) => {
    if (!localGroup.current) return;

    // 1. Get Input
    const { forward, backward, left, right, run } = get() as { forward: boolean; backward: boolean; left: boolean; right: boolean; run: boolean };

    // 2. Determine Movement Speed
    const speed = run ? RUN_SPEED : WALK_SPEED;
    const isMoving = forward || backward || left || right;

    // 3. Update Animation State
    if (isMoving) {
        if (animation !== 'Run') setAnimation('Run');
    } else {
        if (animation !== 'Idle') setAnimation('Idle');
    }

    if (isMoving) {
      // 4. Calculate Movement Direction Relative to Camera
      camera.getWorldDirection(cameraDirection);
      cameraDirection.y = 0;
      cameraDirection.normalize();

      const forwardVector = cameraDirection.clone();
      const rightVector = new Vector3().crossVectors(forwardVector, new Vector3(0, 1, 0)).normalize();

      moveDirection.set(0, 0, 0);

      if (forward) moveDirection.add(forwardVector);
      if (backward) moveDirection.sub(forwardVector);
      if (right) moveDirection.add(rightVector);
      if (left) moveDirection.sub(rightVector);

      moveDirection.normalize();

      // 5. Move Player
      const moveDistance = speed * delta;
      localGroup.current.position.addScaledVector(moveDirection, moveDistance);

      // 6. Rotate Player to Face Movement
      if (moveDirection.lengthSq() > 0) {
        const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
        targetQuaternion.setFromAxisAngle(new Vector3(0, 1, 0), targetRotation);
        localGroup.current.quaternion.slerp(targetQuaternion, ROTATION_SPEED * delta);
      }
    }
  });

  return (
    <group ref={localGroup} position={[0, 0, 0]}>
      {projectData && (
        <Stickman
          projectData={projectData}
          activeClipId={animation}
          isPlaying={true}
        />
      )}
    </group>
  );
});