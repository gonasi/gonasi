import { Suspense } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

import type { FileLoaderItemType } from '~/routes/dashboard/file-library/all-files';

// Model component that loads FBX or GLB depending on the file extension
const Model = ({ url, extension }: { url: string; extension: string }) => {
  // Load the model based on the extension
  const model = useLoader(extension === 'fbx' ? FBXLoader : GLTFLoader, url);

  // For GLTF files, use the `scene` property, for FBX just use the loaded model directly
  return <primitive object={extension === 'fbx' ? model : (model as GLTF).scene} scale={0.01} />;
};

export const ModelPreviewCard = ({ file }: { file: FileLoaderItemType }) => {
  if (!file.signed_url) return <p>Invalid model URL</p>;

  const extension = file.extension.toLowerCase();

  return (
    <div>
      <Canvas camera={{ position: [-10, 0, 0], up: [0, 1, 0], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[0, 1, 1]} />
        <Suspense fallback={null}>
          <Model url={file.signed_url} extension={extension} />
        </Suspense>
        {/* Lowering the grid along the Y axis */}
        <gridHelper args={[100, 10]} position={[0, -20, 0]} />
      </Canvas>
    </div>
  );
};
