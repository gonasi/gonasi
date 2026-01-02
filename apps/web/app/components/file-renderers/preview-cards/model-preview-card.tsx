import { Suspense, useEffect, useRef, useState } from 'react';
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { RotateCcw } from 'lucide-react';
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { DEFAULT_MODEL_SETTINGS, type Model3DSettings } from '@gonasi/schemas/file';

import type { FileLoaderItemType } from '~/routes/dashboard/file-library/all-files';

// Model component that loads FBX or GLB depending on the file extension
const Model = ({
  url,
  extension,
  scale,
  position,
}: {
  url: string;
  extension: string;
  scale: number;
  position: [number, number, number];
}) => {
  // Load the model based on the extension
  // Note: GLTF is not supported (handled in parent component)
  const model = useLoader(extension === 'fbx' ? FBXLoader : GLTFLoader, url);

  // For GLB files, use the `scene` property, for FBX just use the loaded model directly
  return (
    <primitive
      // eslint-disable-next-line react/no-unknown-property
      object={extension === 'fbx' ? model : (model as GLTF).scene}
      scale={scale}
      // eslint-disable-next-line react/no-unknown-property
      position={position}
    />
  );
};

// Device orientation handler component for mobile tilt controls
const DeviceOrientationHandler = ({ enabled }: { enabled: boolean }) => {
  const { camera } = useThree();
  const alphaRef = useRef(0);
  const betaRef = useRef(0);
  const gammaRef = useRef(0);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) alphaRef.current = event.alpha;
      if (event.beta !== null) betaRef.current = event.beta;
      if (event.gamma !== null) gammaRef.current = event.gamma;
    };

    // Request permission on iOS 13+
    const requestPermission = async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        } catch (error) {
          console.error('Device orientation permission denied:', error);
        }
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };

    requestPermission();

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [enabled]);

  useFrame(() => {
    if (!enabled) return;

    // Apply device orientation to camera with smooth interpolation
    const alpha = THREE.MathUtils.degToRad(alphaRef.current);
    const beta = THREE.MathUtils.degToRad(betaRef.current);
    const gamma = THREE.MathUtils.degToRad(gammaRef.current);

    // Smoothly interpolate camera rotation based on device tilt
    camera.rotation.x += (beta * 0.1 - camera.rotation.x) * 0.05;
    camera.rotation.y += (gamma * 0.1 - camera.rotation.y) * 0.05;
    camera.rotation.z += (alpha * 0.02 - camera.rotation.z) * 0.05;
  });

  return null;
};

// Camera reset handler with smooth animation
// cspell:ignore lerp
const CameraResetHandler = ({
  initialPosition,
  initialTarget,
  onCameraMoved,
  onResetReady,
}: {
  initialPosition: [number, number, number];
  initialTarget: [number, number, number];
  onCameraMoved: (moved: boolean) => void;
  onResetReady: (resetFn: () => void) => void;
}) => {
  const { camera, controls } = useThree();
  const isResetting = useRef(false);
  const resetRequested = useRef(false);
  const initialPositionRef = useRef(new THREE.Vector3(...initialPosition));
  const initialTargetRef = useRef(new THREE.Vector3(...initialTarget));

  useFrame(() => {
    // Check if camera has moved from initial position
    const currentDistance = camera.position.distanceTo(initialPositionRef.current);
    const hasMoved = currentDistance > 0.1;
    onCameraMoved(hasMoved);

    // Handle reset animation
    if (resetRequested.current) {
      isResetting.current = true;
      resetRequested.current = false;
    }

    if (isResetting.current) {
      // Smoothly interpolate camera position back to initial
      camera.position.lerp(initialPositionRef.current, 0.1);

      // Update controls target if OrbitControls is available
      if (controls && 'target' in controls) {
        (controls as any).target.lerp(initialTargetRef.current, 0.1);
      }

      // Check if we're close enough to stop
      const distance = camera.position.distanceTo(initialPositionRef.current);
      if (distance < 0.01) {
        camera.position.copy(initialPositionRef.current);
        if (controls && 'target' in controls) {
          (controls as any).target.copy(initialTargetRef.current);
        }
        isResetting.current = false;
      }
    }
  });

  // Expose reset function via callback
  useEffect(() => {
    const resetFn = () => {
      resetRequested.current = true;
    };
    onResetReady(resetFn);
  }, [onResetReady]);

  return null;
};

// Device orientation hook for mobile tilt controls
const useDeviceOrientation = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      setIsSupported(true);
      // Auto-enable on mobile devices
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setIsEnabled(isMobile);
    }
  }, []);

  return { isSupported, isEnabled };
};

export const ModelPreviewCard = ({ file }: { file: FileLoaderItemType }) => {
  const extension = file.extension.toLowerCase();
  const { isSupported: supportsOrientation, isEnabled: orientationEnabled } =
    useDeviceOrientation();
  const [cameraMoved, setCameraMoved] = useState(false);
  const resetCameraRef = useRef<(() => void) | null>(null);

  if (!file.signed_url) return <p>Invalid model URL</p>;

  // cspell:ignore gltf glb Aspose
  // GLTF files with external dependencies are not supported
  // Users should convert to GLB format instead
  if (extension === 'gltf') {
    return (
      <div className='flex h-full w-full items-center justify-center bg-gray-900 p-6'>
        <div className='max-w-md rounded-lg bg-yellow-900/40 p-6 text-center backdrop-blur-sm'>
          <div className='mb-4 text-4xl'>⚠️</div>
          <h3 className='mb-3 text-lg font-semibold text-yellow-200'>GLTF Format Not Supported</h3>
        </div>
      </div>
    );
  }

  // Get settings from database or use defaults
  const settings: Model3DSettings = (file.settings as any)?.model3d ?? DEFAULT_MODEL_SETTINGS;

  const handleResetReady = (resetFn: () => void) => {
    resetCameraRef.current = resetFn;
  };

  const handleReset = () => {
    if (resetCameraRef.current) {
      resetCameraRef.current();
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{
          position: settings.camera.position,
          fov: settings.camera.fov,
          up: [0, 1, 0],
        }}
        style={{ width: '100%', height: '100%' }}
        shadows
      >
        {/* Enhanced lighting for depth and realism */}
        {/* eslint-disable-next-line react/no-unknown-property */}
        <ambientLight intensity={settings.lighting.ambient * 0.8} />
        <directionalLight
          // eslint-disable-next-line react/no-unknown-property
          position={settings.lighting.directional.position}
          // eslint-disable-next-line react/no-unknown-property
          intensity={settings.lighting.directional.intensity}
          // eslint-disable-next-line react/no-unknown-property
          castShadow
          // eslint-disable-next-line react/no-unknown-property
          shadow-mapSize={[1024, 1024]}
        />
        {/* eslint-disable-next-line react/no-unknown-property */}
        <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={0.5} castShadow />

        {/* Environment lighting for professional look */}
        <Environment preset='studio' />

        <Suspense fallback={null}>
          <Model
            url={file.signed_url}
            extension={extension}
            scale={settings.scale}
            position={settings.position}
          />
        </Suspense>

        {/* Contact shadows for depth perception */}
        <ContactShadows position={[0, -20, 0]} opacity={0.4} scale={100} blur={2} far={40} />

        {/* Interactive controls */}
        <OrbitControls
          enableZoom
          enablePan
          enableRotate
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          makeDefault
        />

        {/* Camera reset handler */}
        <CameraResetHandler
          initialPosition={settings.camera.position}
          initialTarget={settings.camera.target}
          onCameraMoved={setCameraMoved}
          onResetReady={handleResetReady}
        />

        {/* Device orientation for mobile tilt */}
        {supportsOrientation && <DeviceOrientationHandler enabled={orientationEnabled} />}
      </Canvas>

      {/* Reset button */}
      {cameraMoved && (
        <button
          onClick={handleReset}
          className='absolute right-4 bottom-4 flex items-center gap-2 rounded-lg bg-black/50 px-3 py-2 text-sm text-white backdrop-blur-sm transition-all hover:bg-black/70'
          style={{ zIndex: 10 }}
        >
          <RotateCcw size={16} />
          Reset View
        </button>
      )}
    </div>
  );
};
