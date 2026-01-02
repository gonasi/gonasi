import { Suspense } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
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
  const model = useLoader(extension === 'fbx' ? FBXLoader : GLTFLoader, url);

  // For GLTF files, use the `scene` property, for FBX just use the loaded model directly
  return (
    <primitive
      object={extension === 'fbx' ? model : (model as GLTF).scene}
      scale={scale}
      position={position}
    />
  );
};

export const ModelPreviewCard = ({ file }: { file: FileLoaderItemType }) => {
  if (!file.signed_url) return <p>Invalid model URL</p>;

  const extension = file.extension.toLowerCase();

  // Get settings from database or use defaults
  const settings: Model3DSettings =
    (file.settings as any)?.model3d ?? DEFAULT_MODEL_SETTINGS;

  return (
    <div className='h-full w-full'>
      <Canvas
        camera={{
          position: settings.camera.position,
          fov: settings.camera.fov,
          up: [0, 1, 0],
        }}
      >
        <ambientLight intensity={settings.lighting.ambient} />
        <directionalLight
          position={settings.lighting.directional.position}
          intensity={settings.lighting.directional.intensity}
        />
        <Suspense fallback={null}>
          <Model
            url={file.signed_url}
            extension={extension}
            scale={settings.scale}
            position={settings.position}
          />
        </Suspense>
        {/* Lowering the grid along the Y axis */}
        <gridHelper args={[100, 10]} position={[0, -20, 0]} />
      </Canvas>
    </div>
  );
};
