import { Suspense, useState } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import type { Camera } from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import type { Model3DSettings } from '@gonasi/schemas/file';
import { DEFAULT_MODEL_SETTINGS } from '@gonasi/schemas/file';

import { Label } from '~/components/ui/label';
import { Slider } from '~/components/ui/slider';

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
      object={extension === 'fbx' ? model : (model as GLTF).scene}
      scale={scale}
      position={position}
    />
  );
};

interface CameraControllerProps {
  settings: Model3DSettings;
}

const CameraController = ({ settings }: CameraControllerProps) => {
  const { camera } = useThree();

  // Apply camera settings
  camera.position.set(...settings.camera.position);
  camera.lookAt(...settings.camera.target);
  (camera as Camera & { fov?: number }).fov = settings.camera.fov;
  camera.updateProjectionMatrix();

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

  const handleSettingChange = (updates: Partial<Model3DSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <div className='space-y-6'>
      {/* 3D Canvas */}
      <div className='bg-card relative h-[60vh] w-full overflow-hidden rounded-lg border'>
        <Canvas camera={{ position: settings.camera.position, fov: settings.camera.fov }}>
          <ambientLight intensity={settings.lighting.ambient} />
          <directionalLight
            position={settings.lighting.directional.position}
            intensity={settings.lighting.directional.intensity}
          />
          <Suspense
            fallback={
              <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color='gray' />
              </mesh>
            }
          >
            <Model url={url} extension={extension} scale={settings.scale} position={settings.position} />
          </Suspense>
          <CameraController settings={settings} />
          <gridHelper args={[100, 10]} position={[0, -20, 0]} />
        </Canvas>
      </div>

      {/* Controls */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        {/* Model Scale */}
        <div className='space-y-2'>
          <Label className='text-sm font-medium'>Model Scale: {settings.scale.toFixed(3)}</Label>
          <Slider
            value={[settings.scale]}
            onValueChange={([val]) => handleSettingChange({ scale: val ?? 0.01 })}
            min={0.001}
            max={1}
            step={0.001}
          />
        </div>

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
                  directional: { ...settings.lighting.directional, intensity: val ?? 1 },
                },
              })
            }
            min={0}
            max={5}
            step={0.1}
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
                  position: [val ?? -10, settings.camera.position[1], settings.camera.position[2]],
                },
              })
            }
            min={-50}
            max={50}
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
                  position: [settings.camera.position[0], val ?? 0, settings.camera.position[2]],
                },
              })
            }
            min={-50}
            max={50}
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
                  position: [settings.camera.position[0], settings.camera.position[1], val ?? 0],
                },
              })
            }
            min={-50}
            max={50}
            step={1}
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
            min={-50}
            max={50}
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
            min={-50}
            max={50}
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
            min={-50}
            max={50}
            step={1}
          />
        </div>
      </div>
    </div>
  );
};
