import { Suspense, useEffect, useRef, useState } from 'react';
import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import type { Camera } from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import type { Model3DSettings } from '@gonasi/schemas/file';
import { DEFAULT_MODEL_SETTINGS } from '@gonasi/schemas/file';

import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Slider } from '~/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';

// Utility functions for spherical coordinates
interface SphericalCoords {
  azimuth: number; // horizontal angle in degrees (0-360)
  polar: number; // vertical angle in degrees (0-180)
  distance: number; // radius from target
}

const cartesianToSpherical = (
  position: [number, number, number],
  target: [number, number, number] = [0, 0, 0],
): SphericalCoords => {
  const dx = position[0] - target[0];
  const dy = position[1] - target[1];
  const dz = position[2] - target[2];

  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const azimuth = ((Math.atan2(dx, dz) * 180) / Math.PI + 360) % 360;
  const polar = (Math.acos(dy / distance) * 180) / Math.PI;

  return { azimuth, polar, distance };
};

interface ModelProps {
  url: string;
  extension: string;
  scale: number;
  position: [number, number, number];
}

const Model = ({ url, extension, scale, position }: ModelProps) => {
  const model = useLoader(extension === 'fbx' ? FBXLoader : GLTFLoader, url);
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

interface CameraControllerProps {
  settings: Model3DSettings;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  interactiveMode: boolean;
}

const CameraController = ({ settings, controlsRef, interactiveMode }: CameraControllerProps) => {
  const { camera } = useThree();

  // Apply camera settings whenever they change
  useEffect(() => {
    camera.position.set(...settings.camera.position);
    (camera as Camera & { fov?: number }).fov = settings.camera.fov;
    camera.updateProjectionMatrix();

    // Update OrbitControls target
    if (controlsRef.current) {
      controlsRef.current.target.set(...settings.camera.target);
      controlsRef.current.update();
    }
  }, [settings.camera.position, settings.camera.fov, settings.camera.target, camera, controlsRef]);

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={interactiveMode}
      enableDamping
      dampingFactor={0.05}
      target={settings.camera.target}
    />
  );
};

interface CameraTrackerProps {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  onCameraChange: (position: [number, number, number], target: [number, number, number]) => void;
}

const CameraTracker = ({ controlsRef, onCameraChange }: CameraTrackerProps) => {
  const { camera } = useThree();

  useFrame(() => {
    if (controlsRef.current) {
      const position: [number, number, number] = [
        camera.position.x,
        camera.position.y,
        camera.position.z,
      ];
      const target: [number, number, number] = [
        controlsRef.current.target.x,
        controlsRef.current.target.y,
        controlsRef.current.target.z,
      ];
      onCameraChange(position, target);
    }
  });

  return null;
};

interface ModelConfiguratorProps {
  url: string;
  extension: string;
  initialSettings?: Model3DSettings;
  onSettingsChange: (settings: Model3DSettings) => void;
}

export const ModelConfigurator = ({
  url,
  extension,
  initialSettings = DEFAULT_MODEL_SETTINGS,
  onSettingsChange,
}: ModelConfiguratorProps) => {
  const [settings, setSettings] = useState<Model3DSettings>(initialSettings);
  const [interactiveMode, setInteractiveMode] = useState(true);
  const [liveCameraPosition, setLiveCameraPosition] = useState<[number, number, number]>(
    settings.camera.position,
  );
  const [liveCameraTarget, setLiveCameraTarget] = useState<[number, number, number]>(
    settings.camera.target,
  );
  const [currentCamera, setCurrentCamera] = useState<SphericalCoords>(
    cartesianToSpherical(settings.camera.position, settings.camera.target),
  );
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleSettingChange = (updates: Partial<Model3DSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    onSettingsChange(newSettings);

    // Update current camera display if camera settings changed
    if (updates.camera) {
      setCurrentCamera(
        cartesianToSpherical(newSettings.camera.position, newSettings.camera.target),
      );
    }
  };

  // Update camera display whenever live camera changes
  useEffect(() => {
    setCurrentCamera(cartesianToSpherical(liveCameraPosition, liveCameraTarget));
  }, [liveCameraPosition, liveCameraTarget]);

  const handleCameraChange = (
    position: [number, number, number],
    target: [number, number, number],
  ) => {
    setLiveCameraPosition(position);
    setLiveCameraTarget(target);
  };

  const captureCurrentView = () => {
    const newSettings = {
      ...settings,
      camera: {
        ...settings.camera,
        position: liveCameraPosition,
        target: liveCameraTarget,
      },
    };

    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const resetCamera = () => {
    const defaultSettings = DEFAULT_MODEL_SETTINGS;
    handleSettingChange({
      camera: defaultSettings.camera,
    });
    setInteractiveMode(true);
  };

  // cspell:ignore gltf glb Aspose
  // GLTF files with external dependencies are not supported
  // Users should convert to GLB format instead
  if (extension.toLowerCase() === 'gltf') {
    return (
      <div className='flex h-[60vh] w-full items-center justify-center rounded-lg border bg-gray-900 p-6'>
        <div className='max-w-md rounded-lg bg-yellow-900/40 p-6 text-center backdrop-blur-sm'>
          <div className='mb-4 text-4xl'>⚠️</div>
          <h3 className='mb-3 text-lg font-semibold text-yellow-200'>GLTF Format Not Supported</h3>
          <p className='mb-4 text-sm text-yellow-100/90'>
            GLTF files with external dependencies (like .bin files) cannot be displayed. Please
            convert your file to GLB format, which embeds all resources in a single file.
          </p>
          <div className='space-y-2 text-left text-xs text-yellow-100/80'>
            <p className='font-semibold'>How to convert:</p>
            <ul className='ml-4 list-disc space-y-1'>
              <li>Blender: Import GLTF → Export GLB</li>
              <li>
                Online:{' '}
                <a
                  href='https://products.aspose.app/3d/conversion/gltf-to-glb'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='underline hover:text-yellow-200'
                >
                  Aspose 3D Converter
                </a>
              </li>
              <li>CLI: gltf-pipeline -i model.gltf -o model.glb</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* 3D Canvas */}
      <div
        ref={canvasRef}
        className='bg-card relative h-[45vh] w-full overflow-hidden rounded-lg border'
      >
        <Canvas camera={{ position: settings.camera.position, fov: settings.camera.fov }}>
          {/* eslint-disable-next-line react/no-unknown-property */}
          <ambientLight intensity={settings.lighting.ambient} />
          <directionalLight
            // eslint-disable-next-line react/no-unknown-property
            position={settings.lighting.directional.position}
            // eslint-disable-next-line react/no-unknown-property
            intensity={settings.lighting.directional.intensity}
          />
          <Suspense
            fallback={
              <mesh>
                {/* eslint-disable-next-line react/no-unknown-property */}
                <boxGeometry args={[1, 1, 1]} />
                {/* eslint-disable-next-line react/no-unknown-property */}
                <meshStandardMaterial color='gray' />
              </mesh>
            }
          >
            <Model
              url={url}
              extension={extension}
              scale={settings.scale}
              position={settings.position}
            />
          </Suspense>
          <CameraController
            settings={settings}
            controlsRef={controlsRef}
            interactiveMode={interactiveMode}
          />
          <CameraTracker controlsRef={controlsRef} onCameraChange={handleCameraChange} />
          {/* Focal point indicator */}
          <mesh
            // eslint-disable-next-line react/no-unknown-property
            position={settings.camera.target}
          >
            {/* eslint-disable-next-line react/no-unknown-property */}
            <sphereGeometry args={[0.5, 16, 16]} />
            {/* eslint-disable-next-line react/no-unknown-property */}
            <meshBasicMaterial color='#ff6b6b' opacity={0.6} transparent />
          </mesh>
          {/* eslint-disable-next-line react/no-unknown-property */}
          <gridHelper args={[100, 10]} position={[0, -20, 0]} />
        </Canvas>

        {/* Overlay controls */}
        <div className='absolute top-4 left-4 space-y-2'>
          <div className='bg-background/90 rounded-lg border p-3 font-mono text-xs backdrop-blur-sm'>
            <div className='space-y-1'>
              <div className='font-semibold'>Camera:</div>
              <div>Azimuth: {currentCamera.azimuth.toFixed(1)}°</div>
              <div>Polar: {currentCamera.polar.toFixed(1)}°</div>
              <div>Distance: {currentCamera.distance.toFixed(1)}</div>
              <div className='border-muted-foreground/20 my-2 border-t pt-2'>
                <div className='font-semibold'>Focal Point:</div>
                <div>
                  X: {liveCameraTarget[0].toFixed(1)}, Y: {liveCameraTarget[1].toFixed(1)}, Z:{' '}
                  {liveCameraTarget[2].toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          size='sm'
          variant={interactiveMode ? 'default' : 'secondary'}
          onClick={() => setInteractiveMode(!interactiveMode)}
        >
          {interactiveMode ? '🎮 Interactive Mode' : '🎯 Precision Mode'}
        </Button>
        <Button
          size='sm'
          variant='secondary'
          onClick={captureCurrentView}
          disabled={!interactiveMode}
        >
          📸 Capture Current View
        </Button>
        <Button size='sm' variant='secondary' onClick={resetCamera}>
          🔄 Reset Camera
        </Button>
        {interactiveMode && (
          <span className='text-muted-foreground text-xs'>
            Drag to orbit • Scroll to zoom • Right-click to pan
          </span>
        )}
      </div>

      {/* Controls */}
      <Tabs defaultValue='camera' className='w-full'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='camera'>🎥 Camera</TabsTrigger>
          <TabsTrigger value='model'>📦 Model</TabsTrigger>
          <TabsTrigger value='lighting'>💡 Lighting</TabsTrigger>
        </TabsList>

        {/* Camera Tab */}
        <TabsContent value='camera' className='space-y-4'>
          <div className='space-y-3'>
            <div className='text-muted-foreground text-xs'>Camera Position</div>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {/* Camera FOV */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium'>Field of View: {settings.camera.fov}°</Label>
                <Slider
                  value={[settings.camera.fov]}
                  onValueChange={([val]) =>
                    handleSettingChange({
                      camera: { ...settings.camera, fov: val ?? 45 },
                    })
                  }
                  min={10}
                  max={120}
                  step={5}
                />
              </div>

              {/* Camera Position X */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium'>
                  Camera X: {settings.camera.position[0].toFixed(1)}
                </Label>
                <Slider
                  value={[settings.camera.position[0]]}
                  onValueChange={([val]) =>
                    handleSettingChange({
                      camera: {
                        ...settings.camera,
                        position: [
                          val ?? -10,
                          settings.camera.position[1],
                          settings.camera.position[2],
                        ],
                      },
                    })
                  }
                  min={-100}
                  max={100}
                  step={1}
                />
              </div>

              {/* Camera Position Y */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium'>
                  Camera Y: {settings.camera.position[1].toFixed(1)}
                </Label>
                <Slider
                  value={[settings.camera.position[1]]}
                  onValueChange={([val]) =>
                    handleSettingChange({
                      camera: {
                        ...settings.camera,
                        position: [
                          settings.camera.position[0],
                          val ?? 0,
                          settings.camera.position[2],
                        ],
                      },
                    })
                  }
                  min={-100}
                  max={100}
                  step={1}
                />
              </div>

              {/* Camera Position Z */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium'>
                  Camera Z: {settings.camera.position[2].toFixed(1)}
                </Label>
                <Slider
                  value={[settings.camera.position[2]]}
                  onValueChange={([val]) =>
                    handleSettingChange({
                      camera: {
                        ...settings.camera,
                        position: [
                          settings.camera.position[0],
                          settings.camera.position[1],
                          val ?? 0,
                        ],
                      },
                    })
                  }
                  min={-100}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          </div>

          {/* Camera Target (Focal Point) */}
          <div className='space-y-3'>
            <div className='text-muted-foreground text-xs'>
              Camera Target (Focal Point - what the camera orbits around)
            </div>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {/* Target X */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium'>
                  Target X: {settings.camera.target[0].toFixed(1)}
                </Label>
                <Slider
                  value={[settings.camera.target[0]]}
                  onValueChange={([val]) =>
                    handleSettingChange({
                      camera: {
                        ...settings.camera,
                        target: [val ?? 0, settings.camera.target[1], settings.camera.target[2]],
                      },
                    })
                  }
                  min={-100}
                  max={100}
                  step={1}
                />
              </div>

              {/* Target Y */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium'>
                  Target Y: {settings.camera.target[1].toFixed(1)}
                </Label>
                <Slider
                  value={[settings.camera.target[1]]}
                  onValueChange={([val]) =>
                    handleSettingChange({
                      camera: {
                        ...settings.camera,
                        target: [settings.camera.target[0], val ?? 0, settings.camera.target[2]],
                      },
                    })
                  }
                  min={-100}
                  max={100}
                  step={1}
                />
              </div>

              {/* Target Z */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium'>
                  Target Z: {settings.camera.target[2].toFixed(1)}
                </Label>
                <Slider
                  value={[settings.camera.target[2]]}
                  onValueChange={([val]) =>
                    handleSettingChange({
                      camera: {
                        ...settings.camera,
                        target: [settings.camera.target[0], settings.camera.target[1], val ?? 0],
                      },
                    })
                  }
                  min={-100}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Model Tab */}
        <TabsContent value='model' className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {/* Model Scale */}
            <div className='space-y-2'>
              <Label className='text-sm font-medium'>
                Model Scale: {settings.scale.toFixed(3)}
              </Label>
              <Slider
                value={[settings.scale]}
                onValueChange={([val]) => handleSettingChange({ scale: val ?? 0.01 })}
                min={0.001}
                max={1}
                step={0.001}
              />
            </div>

            {/* Model Position X */}
            <div className='space-y-2'>
              <Label className='text-sm font-medium'>
                Model X: {settings.position[0].toFixed(1)}
              </Label>
              <Slider
                value={[settings.position[0]]}
                onValueChange={([val]) =>
                  handleSettingChange({
                    position: [val ?? 0, settings.position[1], settings.position[2]],
                  })
                }
                min={-100}
                max={100}
                step={1}
              />
            </div>

            {/* Model Position Y */}
            <div className='space-y-2'>
              <Label className='text-sm font-medium'>
                Model Y: {settings.position[1].toFixed(1)}
              </Label>
              <Slider
                value={[settings.position[1]]}
                onValueChange={([val]) =>
                  handleSettingChange({
                    position: [settings.position[0], val ?? 0, settings.position[2]],
                  })
                }
                min={-100}
                max={100}
                step={1}
              />
            </div>

            {/* Model Position Z */}
            <div className='space-y-2'>
              <Label className='text-sm font-medium'>
                Model Z: {settings.position[2].toFixed(1)}
              </Label>
              <Slider
                value={[settings.position[2]]}
                onValueChange={([val]) =>
                  handleSettingChange({
                    position: [settings.position[0], settings.position[1], val ?? 0],
                  })
                }
                min={-100}
                max={100}
                step={1}
              />
            </div>
          </div>
        </TabsContent>

        {/* Lighting Tab */}
        <TabsContent value='lighting' className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {/* Ambient Light */}
            <div className='space-y-2'>
              <Label className='text-sm font-medium'>
                Ambient Light: {settings.lighting.ambient.toFixed(1)}
              </Label>
              <Slider
                value={[settings.lighting.ambient]}
                onValueChange={([val]) =>
                  handleSettingChange({
                    lighting: { ...settings.lighting, ambient: val ?? 0.5 },
                  })
                }
                min={0}
                max={2}
                step={0.1}
              />
            </div>

            {/* Directional Light Intensity */}
            <div className='space-y-2'>
              <Label className='text-sm font-medium'>
                Directional Light: {settings.lighting.directional.intensity.toFixed(1)}
              </Label>
              <Slider
                value={[settings.lighting.directional.intensity]}
                onValueChange={([val]) =>
                  handleSettingChange({
                    lighting: {
                      ...settings.lighting,
                      directional: {
                        ...settings.lighting.directional,
                        intensity: val ?? 1,
                      },
                    },
                  })
                }
                min={0}
                max={5}
                step={0.1}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
