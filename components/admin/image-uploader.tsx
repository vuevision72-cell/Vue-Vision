
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  value: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  resolution?: string;
}

export function ImageUploader({ value, onChange, maxFiles = 7, resolution }: ImageUploaderProps) {
  const { toast } = useToast();
  const [previews, setPreviews] = useState<string[]>(
    value.map(file => URL.createObjectURL(file))
  );

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      toast({
        variant: 'destructive',
        title: 'File upload error',
        description: rejectedFiles.map(f => f.errors.map((e:any) => e.message).join(', ')).join('\n'),
      });
    }
    
    const newFiles = [...value, ...acceptedFiles];
    if (newFiles.length > maxFiles) {
      toast({
        variant: 'destructive',
        title: `You can only upload a maximum of ${maxFiles} images.`,
      });
      return;
    }

    onChange(newFiles);

    const newPreviews = newFiles.map(file => {
        // Check if it's already a preview URL
        const existingPreview = previews.find(p => p.includes(file.name));
        return existingPreview || URL.createObjectURL(file);
    });
    setPreviews(newPreviews);

  }, [value, onChange, maxFiles, toast, previews]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.gif', '.webp'] },
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const handleRemoveImage = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    onChange(newFiles);
    setPreviews(newPreviews);
  };

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed border-muted-foreground/50 rounded-lg p-8 text-center cursor-pointer transition-colors',
          'hover:bg-accent hover:border-primary',
          isDragActive && 'bg-accent border-primary'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-4">
          <UploadCloud className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">
            Drag & drop images here, or click to select files
          </p>
          <div className="text-xs text-muted-foreground">
            <p>(Max {maxFiles} image{maxFiles > 1 ? 's' : ''}, up to 5MB each)</p>
            {resolution && <p className="font-semibold text-primary">Recommended: {resolution}</p>}
          </div>
        </div>
      </div>
      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4">
          {previews.map((src, index) => (
            <div key={index} className="relative aspect-square rounded-md overflow-hidden group">
              <Image
                src={src}
                alt={`Preview ${index + 1}`}
                fill
                className="object-cover"
                onLoad={() => {
                  // This is to avoid revoking the URL before the image is rendered
                  // In some cases, you might want to manage this more carefully
                }}
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent opening file dialog
                  handleRemoveImage(index);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
