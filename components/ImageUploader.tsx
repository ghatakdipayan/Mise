import React, { useRef, useCallback } from 'react';
import type { ImageFile } from '../types';

interface ImageUploaderProps {
  title: string;
  files: ImageFile[];
  setFiles: (files: ImageFile[]) => void;
}

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);


export const ImageUploader: React.FC<ImageUploaderProps> = ({ title, files, setFiles }) => {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files).map(file => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      }));
      setFiles([...files, ...newFiles]);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  const removeFile = (id: string) => {
    const fileToRemove = files.find(f => f.id === id);
    if(fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
    }
    setFiles(files.filter(file => file.id !== id));
  };
  
  const onUploadClick = useCallback(() => {
    uploadInputRef.current?.click();
  }, []);

  const onCameraClick = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  return (
    <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
      <h3 className="text-lg font-semibold text-center text-gray-700 mb-2">{title}</h3>
      <div className="grid grid-cols-3 gap-2">
        {files.map(file => (
          <div key={file.id} className="relative group aspect-square">
            <img src={file.preview} alt="preview" className="w-full h-full object-cover rounded-md" />
            <button
              onClick={() => removeFile(file.id)}
              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove image"
            >
              <TrashIcon />
            </button>
          </div>
        ))}
        <div 
            onClick={onUploadClick}
            className="flex flex-col items-center justify-center bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300 aspect-square p-1"
            role="button"
            aria-label="Upload image from device"
            title="Upload from device"
        >
            <PlusIcon />
            <span className="text-xs text-center text-gray-600 mt-1">Upload</span>
        </div>
        <div 
            onClick={onCameraClick} 
            className="flex flex-col items-center justify-center bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300 aspect-square p-1"
            role="button"
            aria-label="Capture image with camera"
            title="Use camera"
        >
          <CameraIcon />
          <span className="text-xs text-center text-gray-600 mt-1">Camera</span>
        </div>
      </div>
      <input
        type="file"
        ref={uploadInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
    </div>
  );
};