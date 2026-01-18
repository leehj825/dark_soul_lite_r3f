import { useRef, useState, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls, Html } from '@react-three/drei';
import { Group, Vector3 } from 'three';
import { StickmanPlayer as Stickman, ParsedStickmanProject as StickmanProjectData } from 'stickman-animator-r3f';
import { JoystickState } from './Joystick';
import { LookState } from './TouchLook';

interface PlayerControllerProps {
  projectData: StickmanProjectData | null;
  inputState: JoystickState;
  lookState: LookState;
}

export const PlayerController = forwardRef<Group, PlayerControllerProps>(({ projectData, inputState, lookState }, ref) => {
  const localGroup = useRef<Group>(null);
  useImperativeHandle(ref, () => localGroup.current as Group);
  
  const [, get] = useKeyboardControls(); 

  // --- 1. CLIP LIBRARY ---
  // Store the 4 clips permanently so we can grab them anytime
  const [clipLibrary, setClipLibrary] = useState<any>(null);
  const [animIds, setAnimIds] = useState({ idle: '', run: '', strafeLeft: '', strafeRight: '' });

  // --- 2. DYNAMIC STATE ---
  // We will generate a NEW projectData object every time we switch animations
  const [dynamicData, setDynamicData] = useState<StickmanProjectData | null>(null);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0); // Forces remount
  const [debugStatus, setDebugStatus] = useState("Initializing...");

  // Load the clips once on startup
  useEffect(() => {
    if (!projectData) return;
    const pd = projectData as any;
    const allClips = pd.clips || [];

    const findClip = (name: string) => allClips.find((c: any) => c.name.toLowerCase().includes(name.toLowerCase()));

    // Find the 4 clips we need
    const lib = {
      idle: findClip('Standard Idle'),
      run: findClip('Standard Run'),
      left: findClip('left strafe'),
      right: findClip('right strafe')
    };

    // Save them for later
    setClipLibrary(lib);

    const ids = {
      idle: lib.idle?.id || '',
      run: lib.run?.id || '',
      strafeLeft: lib.left?.id || '',
      strafeRight: lib.right?.id || ''
    };
    setAnimIds(ids);

    // Initial Setup: Force Idle
    if (lib.idle) {
      updateAnimation(lib.idle, ids.idle, "IDLE", pd);
    } else {
      setDebugStatus("Error: Idle Clip Missing");
    }

  }, [projectData]);

  // --- HELPER: SWAP & RESTART ---
  // This function creates a new data object where 'targetClip' is at Index 0
  const updateAnimation = (targetClip: any, targetId: string, label: string, baseData: any) => {
    if (!targetClip || !baseData) return;

    // 1. Create a clean list with targetClip FIRST
    const otherClips = baseData.clips.filter((c: any) => c.id !== targetId);
    const reorderedClips = [targetClip, ...otherClips];

    // 2. Create new data object
    const newData = { ...baseData, clips: reorderedClips };

    // 3. Apply updates
    setDynamicData(newData);
    setActiveClipId(targetId);
    setDebugStatus(`Playing: ${label}`);
    
    // 4. Increment key to FORCE RE-RENDER
    setRenderKey(prev => prev + 1);
  };

  // --- 3. PHYSICS ---
  const MOVE_SPEED = 6.0;
  const moveDirection = useMemo(() => new Vector3(), []);
  const currentRotationY = useRef(0);
  
  // Track current state to avoid spamming updates
  const currentStateRef = useRef("idle"); 
  const isRunningRef = useRef(false);

  useFrame((_, delta) => {
    if (!localGroup.current || !clipLibrary || !projectData) return;

    // A. LOOK
    if (lookState && lookState.deltaX !== 0) {
       currentRotationY.current += lookState.deltaX * 5.0; 
       lookState.deltaX = 0; 
       localGroup.current.rotation.y = currentRotationY.current;
       localGroup.current.updateMatrixWorld();
    }

    // B. INPUT
    const kb = get() as { forward: boolean; backward: boolean; left: boolean; right: boolean; run: boolean };
    const joy = inputState;
    let inputX = 0; 
    let inputZ = 0;

    if (kb.forward) inputZ += 1;
    if (kb.backward) inputZ -= 1;
    if (kb.right) inputX += 1;
    if (kb.left) inputX -= 1;
    if (joy.active) {
      inputZ += joy.y; 
      inputX += joy.x;
    }

    const inputMagnitude = Math.sqrt(inputX * inputX + inputZ * inputZ);
    if (inputMagnitude > 1) {
        inputX /= inputMagnitude;
        inputZ /= inputMagnitude;
    }

    // C. SMOOTHING
    if (inputMagnitude > 0.1) isRunningRef.current = true;
    if (inputMagnitude < 0.05) isRunningRef.current = false;
    const isMoving = isRunningRef.current;

    // D. DETERMINE TARGET STATE
    let nextState = "idle";
    let targetClip = clipLibrary.idle;
    let targetId = animIds.idle;

    if (isMoving) {
        if (Math.abs(inputX) > Math.abs(inputZ)) {
            if (inputX > 0) {
                nextState = "right";
                targetClip = clipLibrary.right;
                targetId = animIds.strafeRight;
            } else {
                nextState = "left";
                targetClip = clipLibrary.left;
                targetId = animIds.strafeLeft;
            }
        } else {
            nextState = "run";
            targetClip = clipLibrary.run;
            targetId = animIds.run;
        }
    }

    // E. TRIGGER UPDATE (Only if state changed)
    if (nextState !== currentStateRef.current) {
        currentStateRef.current = nextState;
        // Call the helper to reorder data and restart
        updateAnimation(targetClip, targetId, nextState.toUpperCase(), projectData);
    }

    // F. MOVE
    if (isMoving && inputMagnitude > 0.05) {
        moveDirection.set(0, 0, 0);
        const forward = new Vector3(0, 0, 1).applyQuaternion(localGroup.current.quaternion);
        const right = new Vector3(1, 0, 0).applyQuaternion(localGroup.current.quaternion);
        moveDirection.addScaledVector(forward, inputZ); 
        moveDirection.addScaledVector(right, inputX);
        const moveDistance = MOVE_SPEED * delta;
        localGroup.current.position.addScaledVector(moveDirection, moveDistance);
    }
  });

  const bodyRef = useRef(document.body);

  return (
    <group ref={localGroup} position={[0, 0, 0]}>
      <group rotation={[0, Math.PI, 0]}>
        
        {/* DYNAMIC RENDER: 
            We pass 'dynamicData' (where current animation is #1).
            We use 'renderKey' to force React to destroy and recreate the component.
            This forces the new animation to play instantly.
        */}
        {dynamicData && activeClipId && (
          <Stickman
            key={renderKey} 
            projectData={dynamicData}
            activeClipId={activeClipId}
            isPlaying={true}
          />
        )}
        
      </group>

      {/* Debug Status */}
      <Html position={[0, 2.0, 0]} center portal={bodyRef} zIndexRange={[99999999, 0]}>
        <div style={{
           background: 'rgba(0,0,0,0.6)', 
           color: '#fff', 
           padding: '4px 8px', 
           borderRadius: '4px',
           fontFamily: 'monospace',
           fontSize: '10px',
           pointerEvents: 'none',
        }}>
          {debugStatus}
        </div>
      </Html>
    </group>
  );
});