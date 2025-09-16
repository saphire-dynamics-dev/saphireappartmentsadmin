'use client';
import { useState, useRef } from 'react';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';

export default function ImageUpload({ images, onImagesChange, maxImages = 10, uploading = false }) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Compress image function
  const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(
          (blob) => {
            // Create new file with compressed data
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelection = async (files) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);

    const processedFiles = [];

    for (const file of filesToAdd) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not a valid image file`);
        continue;
      }
      
      // Check original file size
      const maxSize = 30 * 1024 * 1024; // 30MB
      let processedFile = file;
      
      // If file is larger than 10MB, compress it
      if (file.size > 10 * 1024 * 1024) {
        try {
          processedFile = await compressImage(file, 1200, 0.7);
          console.log(`Compressed ${file.name} from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`);
        } catch (error) {
          console.error('Compression failed:', error);
          alert(`Failed to compress ${file.name}. Please try a smaller image.`);
          continue;
        }
      }
      
      // Final size check after compression
      if (processedFile.size > maxSize) {
        alert(`${file.name} is still too large after compression. Please use a smaller image.`);
        continue;
      }
      
      processedFiles.push(processedFile);
    }

    if (processedFiles.length === 0) return;

    // Create preview URLs for processed files
    const newImages = processedFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      isLocal: true
    }));

    onImagesChange([...images, ...newImages]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    handleFileSelection(files);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files) {
      handleFileSelection(files);
    }
    // Reset input value
    e.target.value = '';
  };

  const removeImage = (index) => {
    const imageToRemove = images[index];
    
    // Clean up local preview URL if it's a local file
    if (imageToRemove.isLocal && imageToRemove.url) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          dragActive 
            ? 'border-purple-400 bg-purple-50' 
            : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
        } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />

        <div className="flex flex-col items-center">
          {uploading ? (
            <Loader2 className="h-12 w-12 text-purple-600 animate-spin mb-4" />
          ) : (
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
          )}
          
          <p className="text-lg font-medium text-gray-900 mb-2">
            {uploading ? 'Uploading...' : 'Select Images'}
          </p>
          
          <p className="text-sm text-gray-500 mb-4">
            Drag and drop images here, or click to select files
          </p>
          
          <p className="text-xs text-gray-400">
            PNG, JPG, JPEG up to 30MB each (auto-compressed if needed)
          </p>
          
          {images.length > 0 && (
            <p className="text-xs text-purple-600 mt-2">
              {images.length} / {maxImages} images selected
            </p>
          )}
        </div>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Selected Images ({images.length})
            {uploading && <span className="text-purple-600 ml-2">(Uploading...)</span>}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-w-16 aspect-h-12 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.url}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = '/placeholder-image.png';
                    }}
                  />
                </div>
                
                {/* Upload status indicator */}
                {uploading && image.isLocal && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
                
                {/* Image overlay with remove button */}
                {!uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Image name */}
                <p className="mt-1 text-xs text-gray-500 truncate">
                  {image.name || `Image ${index + 1}`}
                  {image.isLocal && <span className="text-orange-500 ml-1">(Not uploaded)</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload limit message */}
      {images.length >= maxImages && (
        <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Maximum of {maxImages} images allowed. Remove some images to select new ones.
          </p>
        </div>
      )}
    </div>
  );
}
