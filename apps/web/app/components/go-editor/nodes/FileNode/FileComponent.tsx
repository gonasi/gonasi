import React, { useCallback, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey } from 'lexical';

interface FileMetadata {
  name: string;
  src: string;
  mime_type: string;
  extension: string;
  file_type: string;
}

interface FileComponentProps {
  fileId: string;
  nodeKey: string;
}

const FileComponent: React.FC<FileComponentProps> = ({ fileId, nodeKey }) => {
  const [editor] = useLexicalComposerContext();
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch file metadata and URL
  const fetchFileDetails = useCallback(async () => {
    try {
      // TODO: Fetch from db and supabase storage
      // // Fetch metadata from database
      // const metadata = await getFileMetadataFromDB(fileId);
      // setFileMetadata(metadata);

      // // Fetch file URL from storage
      // const url = await getFileUrlFromSupabase(fileId);
      setFileUrl('url');
    } catch (err) {
      setError('Failed to retrieve file details');
      console.error('File retrieval error:', err);
    }
  }, [fileId]);

  // Fetch file details when component mounts
  React.useEffect(() => {
    fetchFileDetails();
  }, [fetchFileDetails]);

  const handleDownload = () => {
    if (fileUrl && fileMetadata) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileMetadata.name;
      link.click();
    }
  };

  const handleRemove = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) {
        node.remove();
      }
    });
  };

  if (error) {
    return <div className='text-red-500'>{error}</div>;
  }

  if (!fileMetadata) {
    return <div>Loading...</div>;
  }

  return (
    <div className='flex items-center space-x-2 rounded bg-gray-100 p-2'>
      <div className='flex-grow'>
        <div className='font-semibold'>{fileMetadata.name}</div>
        <div className='text-sm text-gray-500'>{fileMetadata.file_type}</div>
      </div>
      {fileUrl && (
        <button
          onClick={handleDownload}
          className='rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600'
        >
          Download
        </button>
      )}
      <button
        onClick={handleRemove}
        className='rounded bg-red-500 px-2 py-1 text-white hover:bg-red-600'
      >
        Remove
      </button>
    </div>
  );
};

export default FileComponent;
