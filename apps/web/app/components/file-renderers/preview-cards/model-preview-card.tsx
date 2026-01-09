import { memo, Suspense, useEffect, useRef, useState } from 'react';
import { ContactShadows, Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { RotateCcw } from 'lucide-react';
import * as THREE from 'three';
import { Cache } from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

import { DEFAULT_MODEL_SETTINGS, type Model3DSettings } from '@gonasi/schemas/file';

import type { FileLoaderItemType } from '~/routes/dashboard/file-library/all-files';

/**
 * FBX Model component - memoized for performance
 * Uses useLoader with FBXLoader as per R3F documentation
 * Properly handles materials and textures
 */
const FBXModel = memo(
  ({
    url,
    scale,
    position,
  }: {
    url: string;
    scale: number;
    position: [number, number, number];
  }) => {
    const fbx = useLoader(FBXLoader, url);

    // Process materials and textures on model load
    useEffect(() => {
      if (!fbx) return;

      // Traverse the model to ensure materials are properly configured
      fbx.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;

          // Ensure mesh casts and receives shadows
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          // Process materials
          if (mesh.material) {
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

            materials.forEach((material) => {
              if (
                material instanceof THREE.MeshStandardMaterial ||
                material instanceof THREE.MeshPhongMaterial ||
                material instanceof THREE.MeshLambertMaterial
              ) {
                // Enable proper lighting
                material.needsUpdate = true;

                // Handle textures properly
                if (material.map) {
                  material.map.needsUpdate = true;
                  // Ensure proper texture encoding
                  material.map.colorSpace = THREE.SRGBColorSpace;
                }

                // Handle normal maps
                if ((material as any).normalMap) {
                  (material as any).normalMap.needsUpdate = true;
                }

                // Handle roughness/metalness maps
                if ((material as any).roughnessMap) {
                  (material as any).roughnessMap.needsUpdate = true;
                }
                if ((material as any).metalnessMap) {
                  (material as any).metalnessMap.needsUpdate = true;
                }
              }
            });
          }
        }
      });
    }, [fbx]);

    return (
      <primitive
        // eslint-disable-next-line react/no-unknown-property
        object={fbx}
        scale={scale}
        // eslint-disable-next-line react/no-unknown-property
        position={position}
      />
    );
  },
);

FBXModel.displayName = 'FBXModel';

/**
 * GLB Model component - memoized for performance
 * Properly handles materials and textures
 */
const GLBModel = memo(
  ({
    url,
    scale,
    position,
  }: {
    url: string;
    scale: number;
    position: [number, number, number];
  }) => {
    let scene;

    try {
      const gltf = useGLTF(url);
      scene = gltf.scene;
    } catch (error) {
      console.error('[GLBModel] Failed to load GLB:', {
        url,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }

    // Process materials and textures on model load
    useEffect(() => {
      if (!scene) return;

      // Traverse the scene to ensure materials are properly configured
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;

          // Ensure mesh casts and receives shadows
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          // Process materials
          if (mesh.material) {
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

            materials.forEach((material) => {
              if (
                material instanceof THREE.MeshStandardMaterial ||
                material instanceof THREE.MeshPhongMaterial ||
                material instanceof THREE.MeshLambertMaterial
              ) {
                // Enable proper lighting
                material.needsUpdate = true;

                // Handle textures properly
                if (material.map) {
                  material.map.needsUpdate = true;
                  // Ensure proper texture encoding
                  material.map.colorSpace = THREE.SRGBColorSpace;
                }

                // Handle normal maps
                if ((material as any).normalMap) {
                  (material as any).normalMap.needsUpdate = true;
                }

                // Handle roughness/metalness maps
                if ((material as any).roughnessMap) {
                  (material as any).roughnessMap.needsUpdate = true;
                }
                if ((material as any).metalnessMap) {
                  (material as any).metalnessMap.needsUpdate = true;
                }

                // Handle AO maps
                if ((material as any).aoMap) {
                  (material as any).aoMap.needsUpdate = true;
                }
              }
            });
          }
        }
      });
    }, [scene]);

    return (
      <primitive
        // eslint-disable-next-line react/no-unknown-property
        object={scene}
        scale={scale}
        // eslint-disable-next-line react/no-unknown-property
        position={position}
      />
    );
  },
);

GLBModel.displayName = 'GLBModel';

/**
 * Device orientation handler for mobile tilt controls
 */
const DeviceOrientationHandler = memo(({ enabled }: { enabled: boolean }) => {
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

    const alpha = THREE.MathUtils.degToRad(alphaRef.current);
    const beta = THREE.MathUtils.degToRad(betaRef.current);
    const gamma = THREE.MathUtils.degToRad(gammaRef.current);

    camera.rotation.x += (beta * 0.1 - camera.rotation.x) * 0.05;
    camera.rotation.y += (gamma * 0.1 - camera.rotation.y) * 0.05;
    camera.rotation.z += (alpha * 0.02 - camera.rotation.z) * 0.05;
  });

  return null;
});

DeviceOrientationHandler.displayName = 'DeviceOrientationHandler';

/**
 * Camera reset handler with smooth animation
 */
const CameraResetHandler = memo(
  ({
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
      const currentDistance = camera.position.distanceTo(initialPositionRef.current);
      const hasMoved = currentDistance > 0.1;
      onCameraMoved(hasMoved);

      if (resetRequested.current) {
        isResetting.current = true;
        resetRequested.current = false;
      }

      if (isResetting.current) {
        camera.position.lerp(initialPositionRef.current, 0.1);

        if (controls && 'target' in controls) {
          (controls as any).target.lerp(initialTargetRef.current, 0.1);
        }

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

    useEffect(() => {
      const resetFn = () => {
        resetRequested.current = true;
      };
      onResetReady(resetFn);
    }, [onResetReady]);

    return null;
  },
);

CameraResetHandler.displayName = 'CameraResetHandler';

/**
 * Device orientation hook for mobile
 */
function useDeviceOrientation() {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      setIsSupported(true);
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setIsEnabled(isMobile);
    }
  }, []);

  return { isSupported, isEnabled };
}

/**
 * ModelPreviewCard - Main component for rendering 3D models
 * Optimized with memoization for multiple model instances
 */
export const ModelPreviewCard = memo(
  ({ file, onError }: { file: FileLoaderItemType; onError?: () => void }) => {
    const extension = file.extension.toLowerCase();
    const { isSupported: supportsOrientation, isEnabled: orientationEnabled } =
      useDeviceOrientation();
    const [cameraMoved, setCameraMoved] = useState(false);
    const resetCameraRef = useRef<(() => void) | null>(null);

    // Clear Three.js cache on unmount
    useEffect(() => {
      return () => {
        try {
          // Clear cache for this specific URL on unmount
          if (file.signed_url) {
            Cache.remove(file.signed_url);
            // Clear useGLTF cache for GLB files
            if (extension === 'glb' || extension === 'gltf') {
              useGLTF.clear(file.signed_url);
            }
          }
        } catch (error) {
          console.error('[ModelPreviewCard] Cache clear error:', error);
        }
      };
    }, [file.signed_url, extension]);

    if (!file.signed_url) {
      onError?.();
      return null;
    }

    // GLTF files not supported
    if (extension === 'gltf') {
      onError?.();
      return (
        <div className='flex h-full w-full items-center justify-center bg-gray-900 p-6'>
          <div className='max-w-md rounded-lg bg-yellow-900/40 p-6 text-center backdrop-blur-sm'>
            <div className='mb-4 text-4xl'>⚠️</div>
            <h3 className='mb-3 text-lg font-semibold text-yellow-200'>
              GLTF Format Not Supported
            </h3>
            <p className='text-sm text-yellow-100'>Please use GLB format instead</p>
          </div>
        </div>
      );
    }

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
          gl={{
            antialias: true,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
        >
          {/* Lighting */}
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
          <spotLight
            // eslint-disable-next-line react/no-unknown-property
            position={[10, 10, 10]}
            // eslint-disable-next-line react/no-unknown-property
            angle={0.3}
            // eslint-disable-next-line react/no-unknown-property
            penumbra={1}
            // eslint-disable-next-line react/no-unknown-property
            intensity={0.5}
            // eslint-disable-next-line react/no-unknown-property
            castShadow
          />

          <Environment preset='studio' />

          <Suspense fallback={null}>
            {extension === 'fbx' ? (
              <FBXModel url={file.signed_url} scale={settings.scale} position={settings.position} />
            ) : (
              <GLBModel url={file.signed_url} scale={settings.scale} position={settings.position} />
            )}
          </Suspense>

          <ContactShadows position={[0, -20, 0]} opacity={0.4} scale={100} blur={2} far={40} />

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

          <CameraResetHandler
            initialPosition={settings.camera.position}
            initialTarget={settings.camera.target}
            onCameraMoved={setCameraMoved}
            onResetReady={handleResetReady}
          />

          {supportsOrientation && <DeviceOrientationHandler enabled={orientationEnabled} />}
        </Canvas>

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
  },
);

ModelPreviewCard.displayName = 'ModelPreviewCard';
