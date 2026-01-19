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
  const stickmanRef = useRef<Group>(null);
  
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

  // --- PHASE SYNC REF ---
  const progressRef = useRef(0); 

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
      const filteredKeyframes = originalClip.keyframes
        .filter((kf: any) => kf.timestamp >= startTime)
        .map((kf: any) => ({ ...kf }));

      const newClip = { ...originalClip, keyframes: filteredKeyframes };
      const ratio = 1 / speedFactor;
      newClip.duration = (originalClip.duration - startTime) * ratio;

      if (newClip.keyframes) {
        newClip.keyframes.forEach((kf: any) => { 
            kf.timestamp = (kf.timestamp - startTime) * ratio; 
        });
        if (reverse) {
          const totalDuration = newClip.duration;
          newClip.id = `${newClip.id}_rev`; 
          newClip.keyframes.forEach((kf: any) => { kf.timestamp = totalDuration - kf.timestamp; });
          newClip.keyframes.sort((a: any, b: any) => a.timestamp - b.timestamp);
          const offset = newClip.keyframes[0].timestamp;
          newClip.keyframes.forEach((kf: any) => { kf.timestamp = Math.max(0, kf.timestamp - offset); });
        }
      }
      return newClip;
    };

    setClipLibrary({
      idle: findClip('idle'),
      jump: processClip(findClip('jump'), 1.8, false, 0.5), 
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

  const updateAnimation = (targetClip: any, useSync = false) => {
    if (!targetClip || !projectData) return;
    
    let finalClip = targetClip;

    if (useSync && targetClip.duration > 0) {
      const offset = progressRef.current * targetClip.duration;
      finalClip = {
        ...targetClip,
        keyframes: targetClip.keyframes.map((kf: any) => {
          let newTime = kf.timestamp - offset;
          if (newTime < 0) newTime += targetClip.duration;
          return { ...kf, timestamp: newTime };
        }).sort((a: any, b: any) => a.timestamp - b.timestamp)
      };
    }

    setDynamicData({
      ...projectData,
      clips: [finalClip, ...(projectData as any).clips.filter((c: any) => c.id !== finalClip.id)]
    });
    setActiveClipId(finalClip.id);
  };

  useFrame((_state, delta) => {
    if (!localGroup.current || !pivotGroup.current || !clipLibrary.idle || !dynamicData) return;

    // --- MATERIAL TRAVERSAL (Makes stickman greenish) ---
    if (stickmanRef.current) {
        stickmanRef.current.traverse((child: any) => {
          if (child.isMesh) {
            child.material.color.set("#44ff44"); // Bright Green color
            if (child.material.emissive) {
                child.material.emissive.set("#002200");
            }
          }
        });
    }

    // Update Progress tracking for phase sync
    const currentClip = (dynamicData as any).clips.find((c: any) => c.id === activeClipId);
    if (currentClip && currentClip.duration > 0) {
      progressRef.current = (progressRef.current + delta / currentClip.duration) % 1;
    }

    // --- 1. JUMP (Ignoring if already active) ---
    if (actionState.jump) {
        if (!isJumpingRef.current && currentStateRef.current !== "jump") {
            isJumpingRef.current = true;
            currentStateRef.current = "jump";
            updateAnimation(clipLibrary.jump, false); 
            setTimeout(() => { 
                isJumpingRef.current = false; 
                // Locomotion logic below will reset state to idle/walk next frame
            }, 650); 
        }
        actionState.jump = false; // Always clear signal to prevent queuing
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
    const isMoving = inputMagnitude > 0.15;
    const isRunning = actionState.run || kb.run;

    let targetVisualRotation = 0;

    // --- 2. ANIMATION SELECTION ---
    if (!isJumpingRef.current) {
      let nextState = "idle";
      let targetClip = clipLibrary.idle;

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
           if (inputX > 0) { 
              nextState = isRunning ? "runRight" : "walkRight";
              targetClip = isRunning ? clipLibrary.runRight : clipLibrary.walkRight;
              targetVisualRotation = Math.PI / 4;
           } else { 
              nextState = isRunning ? "runLeft" : "walkLeft";
              targetClip = isRunning ? clipLibrary.runLeft : clipLibrary.walkLeft;
              targetVisualRotation = -Math.PI / 4;
           }
        }
      }
      
      if (nextState !== currentStateRef.current) {
         const isMovementTransition = currentStateRef.current !== "idle" && nextState !== "idle";
         currentStateRef.current = nextState;
         updateAnimation(targetClip, isMovementTransition);
      }
    } else {
      targetVisualRotation = 0;
    }

    // --- 3. PHYSICS & ROTATION ---
    currentRotationAmount.current = MathUtils.lerp(currentRotationAmount.current, targetVisualRotation, 0.15);
    tempEuler.set(0, MODEL_FACING_OFFSET + currentRotationAmount.current, 0);
    pivotGroup.current.setRotationFromEuler(tempEuler);

    if (isMoving) {
        moveDirection.set(inputX, 0, inputZ).normalize();
        moveDirection.applyQuaternion(localGroup.current.quaternion);
        const speed = isRunning ? 6.0 : 2.5;
        localGroup.current.position.addScaledVector(moveDirection, speed * delta);
    }
  });

  return (
    <group ref={localGroup}>
      <group ref={pivotGroup}>
        <group ref={stickmanRef}>
          {dynamicData && activeClipId && (
            <Stickman
              key={activeClipId.split('_sync')[0]} 
              projectData={dynamicData}
              activeClipId={activeClipId}
              isPlaying={true}
            />
          )}

          {/* Strong green point light creates a neon skin effect */}
          <pointLight 
            color="#00ff44" 
            intensity={10} 
            distance={2.5} 
            position={[0, 1, 0]} 
          />
          
          {/* Rim light helps define the limbs against the green floor */}
          <pointLight 
            color="#ccff00" 
            intensity={5} 
            distance={3} 
            position={[0, 0.5, 1]} 
          />
        </group>
      </group>
    </group>
  );
});