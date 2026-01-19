import { useRef, useState, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { Group, Vector3, MathUtils, Euler } from 'three';
import { StickmanPlayer as Stickman, ParsedStickmanProject as StickmanProjectData } from 'stickman-animator-r3f';
import { JoystickState } from './Joystick';
import { LookState } from './TouchLook';

export interface ActionState {
  jump: boolean;
  run: boolean;
}

interface PlayerControllerProps {
  projectData: StickmanProjectData | null;
  inputState: JoystickState;
  lookState: LookState;
  actionState: ActionState;
}

export const PlayerController = forwardRef<Group, PlayerControllerProps>(({ projectData, inputState, lookState, actionState }, ref) => {
  const localGroup = useRef<Group>(null);
  const pivotGroup = useRef<Group>(null); 
  
  useImperativeHandle(ref, () => localGroup.current as Group);
  const [, get] = useKeyboardControls(); 

  const MODEL_FACING_OFFSET = Math.PI; 

  const [clipLibrary, setClipLibrary] = useState<any>({});
  const [dynamicData, setDynamicData] = useState<StickmanProjectData | null>(null);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  
  const currentStateRef = useRef("idle"); 
  const isJumpingRef = useRef(false);
  const currentRotationAmount = useRef(0);
  const tempEuler = useMemo(() => new Euler(), []);
  const moveDirection = useMemo(() => new Vector3(), []);
  const currentRotationY = useRef(0);

  useEffect(() => {
    if (!projectData) return;
    const pd = projectData as any;
    const allClips = pd.clips || [];
    
    const findClip = (name: string) => {
      const exact = allClips.find((c: any) => c.name.trim() === name);
      return exact || allClips.find((c: any) => c.name.toLowerCase().includes(name.toLowerCase()));
    };

    const processClip = (originalClip: any, speedFactor: number, reverse: boolean = false, startTime = 0) => {
      if (!originalClip) return null;
      
      // 1. Filter out keyframes that happen before our new startTime
      // 2. Clone the remaining keyframes
      const filteredKeyframes = originalClip.keyframes
        .filter((kf: any) => kf.timestamp >= startTime)
        .map((kf: any) => ({ ...kf }));

      const newClip = {
        ...originalClip,
        keyframes: filteredKeyframes
      };

      const ratio = 1 / speedFactor;
      
      // Update duration based on trimmed length
      newClip.duration = (originalClip.duration - startTime) * ratio;

      if (newClip.keyframes) {
        // 3. Shift timestamps so the new start is at 0, then apply speed ratio
        newClip.keyframes.forEach((kf: any) => { 
          kf.timestamp = (kf.timestamp - startTime) * ratio; 
        });

        if (reverse) {
          const totalDuration = newClip.duration;
          newClip.id = `${newClip.id}_rev`; 
          newClip.keyframes.forEach((kf: any) => {
            kf.timestamp = totalDuration - kf.timestamp;
          });
          newClip.keyframes.sort((a: any, b: any) => a.timestamp - b.timestamp);
          
          const offset = newClip.keyframes[0].timestamp;
          newClip.keyframes.forEach((kf: any) => {
            kf.timestamp = Math.max(0, kf.timestamp - offset);
          });
        }
      }
      return newClip;
    };

    setClipLibrary({
      idle: findClip('idle'),
      jump: processClip(findClip('jump'), 1.5, false, 0.6), // Speed 2.0
      walk: findClip('walking'), 
      walkBack: findClip('walking backwards'),
      walkLeft: findClip('left strafe walking'),
      walkRight: findClip('right strafe walking'),
      run: findClip('running'), 
      runBack: findClip('running backward'),
      runLeft: findClip('left strafe'),
      runRight: findClip('right strafe'),
      walkLeftRev: processClip(findClip('left strafe walking'), 1.0, true),
      walkRightRev: processClip(findClip('right strafe walking'), 1.0, true),
      runLeftRev: processClip(findClip('left strafe'), 1.0, true),
      runRightRev: processClip(findClip('right strafe'), 1.0, true),
    });

    if (findClip('idle')) {
      setActiveClipId(findClip('idle').id);
      setDynamicData(pd);
      currentStateRef.current = "idle";
    }
  }, [projectData]);

  const updateAnimation = (targetClip: any) => {
    if (!targetClip || !projectData) return;
    setDynamicData({
      ...projectData,
      clips: [targetClip, ...(projectData as any).clips.filter((c: any) => c.id !== targetClip.id)]
    });
    setActiveClipId(targetClip.id);
  };

  useFrame((_, delta) => {
    if (!localGroup.current || !pivotGroup.current || !clipLibrary.idle) return;

    // --- 1. JUMP TRIGGER ---
    if (actionState.jump && !isJumpingRef.current) {
      isJumpingRef.current = true;
      actionState.jump = false; 
      updateAnimation(clipLibrary.jump);
      currentStateRef.current = "jump";
      
      // Match the duration of your processed jump (roughly 0.5s - 0.7s)
      setTimeout(() => { 
        isJumpingRef.current = false; 
        // Clearing this allows the move/idle logic to take over next frame
      }, 700); 
    }

    if (lookState && lookState.deltaX !== 0) {
       currentRotationY.current += lookState.deltaX * 5.0; 
       lookState.deltaX = 0; 
       localGroup.current.rotation.y = currentRotationY.current;
    }

    const kb = get() as any;
    const joy = inputState;
    let inputX = 0, inputZ = 0;
    if (kb.forward) inputZ += 1; 
    if (kb.backward) inputZ -= 1;
    if (kb.right) inputX += 1;
    if (kb.left) inputX -= 1;
    if (joy.active) { inputZ += joy.y; inputX += joy.x; }

    const inputMagnitude = Math.sqrt(inputX * inputX + inputZ * inputZ);
    const isMoving = inputMagnitude > 0.1;
    const isRunning = actionState.run || kb.run;

    // --- 2. ANIMATION SELECTION (Locked during jump) ---
    if (!isJumpingRef.current) {
      let nextState = "idle";
      let targetClip = clipLibrary.idle;
      let targetVisualRotation = 0;

      if (isMoving) {
        const leanAngle = (inputX / (inputMagnitude || 1)) * (Math.PI / 4);

        if (inputZ < -0.3) {
           nextState = isRunning ? "run" : "walk";
           targetClip = isRunning ? clipLibrary.run : clipLibrary.walk;
           targetVisualRotation = -leanAngle; 
        } else if (inputZ > 0.3) {
           nextState = isRunning ? "runBack" : "walkBack";
           targetClip = isRunning ? clipLibrary.runBack : clipLibrary.walkBack;
           targetVisualRotation = leanAngle; 
        } else {
           //const useReverseStrafe = inputZ > 0.1; 
           /*if (inputX > 0) { 
              nextState = isRunning ? (useReverseStrafe ? "runLeftRev" : "runRight") : (useReverseStrafe ? "walkLeftRev" : "walkRight");
              targetClip = isRunning ? (useReverseStrafe ? clipLibrary.runLeftRev : clipLibrary.runRight) : (useReverseStrafe ? clipLibrary.walkLeftRev : clipLibrary.walkRight);
              targetVisualRotation = useReverseStrafe ? -Math.PI / 4 : Math.PI / 4;
           } else { 
              nextState = isRunning ? (useReverseStrafe ? "runRightRev" : "runLeft") : (useReverseStrafe ? "walkRightRev" : "walkLeft");
              targetClip = isRunning ? (useReverseStrafe ? clipLibrary.runRightRev : clipLibrary.runLeft) : (useReverseStrafe ? clipLibrary.walkRightRev : clipLibrary.walkLeft);
              targetVisualRotation = useReverseStrafe ? Math.PI / 4 : -Math.PI / 4;
           }*/
           if (inputX > 0) { 
              nextState = isRunning ? ("runRight") : ("walkRight");
              targetClip = isRunning ? (clipLibrary.runRight) : (clipLibrary.walkRight);
              targetVisualRotation = Math.PI / 4;
           } else { 
              nextState = isRunning ? ("runLeft") : ("walkLeft");
              targetClip = isRunning ? (clipLibrary.runLeft) : (clipLibrary.walkLeft);
              targetVisualRotation = -Math.PI / 4;
           }
        }
      } else {
        // While jumping, we force the target rotation to 0 (Forward)
        targetVisualRotation = 0;
      }

      // Update rotation
      currentRotationAmount.current = MathUtils.lerp(currentRotationAmount.current, targetVisualRotation, 0.15);
      
      // Update state if changed
      if (nextState !== currentStateRef.current) {
         currentStateRef.current = nextState;
         updateAnimation(targetClip);
      }
    }

    // --- 3. PHYSICS / POSITION (Always active, even during jump) ---
    tempEuler.set(0, MODEL_FACING_OFFSET + currentRotationAmount.current, 0);
    pivotGroup.current.setRotationFromEuler(tempEuler);

    if (isMoving) {
        moveDirection.set(inputX, 0, inputZ).normalize();
        moveDirection.applyQuaternion(localGroup.current.quaternion);
        const speed = isRunning ? 6.0 : 2.0;
        localGroup.current.position.addScaledVector(moveDirection, speed * delta);
    }
  });

  return (
    <group ref={localGroup}>
      <group ref={pivotGroup}>
        <group>
          {dynamicData && activeClipId && (
            <Stickman
              key={activeClipId}
              projectData={dynamicData}
              activeClipId={activeClipId}
              isPlaying={true}
            />
          )}
        </group>
      </group>
    </group>
  );
});