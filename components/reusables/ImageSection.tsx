"use client";

import { Control, Path, PathValue, UseFormSetValue, useWatch } from "react-hook-form";
import { UploadButton } from "@/utils/uploadthing";
import { X, Image as ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { OurFileRouter } from "@/app/api/uploadthing/core";
import { FieldValues } from "react-hook-form";
import { useState } from "react"; 
import { deleteUTFile } from "@/lib/actions/uploadthing";

interface ImageSectionProps<T extends FieldValues> {
  control: Control<T>;
  setValue: UseFormSetValue<T>;
  name: Path<T>;
  endpoint: keyof OurFileRouter;
  label?: string;
  onImageRemove?: (url: string) => void;
  onImageUpload?: (key: string) => void; 
}

export function ImageSection<T extends FieldValues>({ 
  control, 
  setValue, 
  name, 
  endpoint, 
  label = "Upload Image",
  onImageRemove,
  onImageUpload
}: ImageSectionProps<T>) {
  
  const imageUrl = useWatch({ control, name });
  const [isDeleting, setIsDeleting] = useState(false);
  
  // CHANGED: Swapped useRef for useState
  const [uploadedFileKey, setUploadedFileKey] = useState<string | null>(null);

  const handleRemove = async () => {
    const currentURL = imageUrl as string;
    
    // Use the state value instead of .current
    if (uploadedFileKey) {
      setIsDeleting(true);
      try {
        if (onImageRemove) onImageRemove(currentURL);
        const response = await deleteUTFile(uploadedFileKey);
        
        if (response.success) {
          toast.success("Image removed from server");
        } else {
          toast.error(response.error || "Failed to remove image");
        }
      } catch (error) {
        console.error(error);
        toast.error("An error occurred while deleting");
      } finally {
        setIsDeleting(false);
      }
    }

    // Always clear local and form state
    setValue(name, "" as PathValue<T, Path<T>>);
    setUploadedFileKey(null); // Clear state
  };

  return (
    <div className="flex flex-col gap-2 p-4 border-2 border-dashed rounded-lg bg-gray-50 items-center justify-center w-full transition-colors hover:border-primary/50">
      <label className="text-sm font-medium self-start text-gray-700">{label}</label>
      
      {imageUrl ? (
        <div className="relative group mt-2 h-40 w-40 rounded-lg border-2 border-white shadow-md overflow-hidden bg-white">
          <Image 
            src={imageUrl as string} 
            alt="Preview" 
            fill
            className="object-cover"
          />
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleRemove}
            className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold disabled:opacity-100 cursor-pointer"
          >
            {isDeleting ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <X className="h-6 w-6 mb-1" />
                Remove & Replace
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="py-6 flex flex-col items-center">
          <div className="mb-4 p-3 bg-white rounded-full shadow-sm">
            <ImageIcon className="h-6 w-6 text-gray-400" />
          </div>
          <UploadButton<typeof endpoint>
            endpoint={endpoint}
            onClientUploadComplete={(res) => {
              if (res?.[0]) {
                setValue(name, res[0].ufsUrl as PathValue<T, Path<T>>);
                
                // CHANGED: Update state instead of ref
                setUploadedFileKey(res[0].key);
                
                if (onImageUpload) onImageUpload(res[0].key);
                toast.success("Uploaded successfully!");
              }
            }}
            onUploadError={(error: Error) => {
              toast.error(`Upload Failed: ${error.message}`);
            }}
            // ... appearance props
             appearance={{
              button: "bg-primary hover:bg-primary/90 px-6 py-2 text-sm transition-all shadow-sm disabled:bg-gray-400",
              container: "w-full",
              allowedContent: "text-xs text-gray-400 mt-2"
            }}

          />
        </div>
      )}
    </div>
  );
}