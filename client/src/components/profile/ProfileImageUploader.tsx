import React, { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Upload, Camera, Loader2 } from 'lucide-react';
import { storage } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

interface ProfileImageUploaderProps {
  onImageUploaded?: (url: string) => void;
  className?: string;
}

export default function ProfileImageUploader({ onImageUploaded, className }: ProfileImageUploaderProps) {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const firstLetters = user ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}` : '';
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to upload a profile image",
        variant: "destructive"
      });
      return;
    }
    
    const file = e.target.files[0];
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive"
      });
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Read file as data URL
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          if (!event.target?.result) throw new Error("Failed to read file");
          
          // Check if Firebase Storage is initialized
          if (!storage) {
            throw new Error("Firebase Storage is not available. Using local storage fallback.");
          }
          
          const imageData = event.target.result as string;
          
          // Create a unique filename
          const filename = `profile-${user.id}-${uuidv4()}`;
          const storageRef = ref(storage, `profiles/${filename}`);
          
          // Upload image
          await uploadString(storageRef, imageData, 'data_url');
          
          // Get download URL
          const downloadURL = await getDownloadURL(storageRef);
          
          // Update user profile
          if (setUser && user) {
            setUser({
              ...user,
              profile: {
                ...user.profile,
                avatar: downloadURL
              }
            });
          }
          
          // Call callback if provided
          if (onImageUploaded) {
            onImageUploaded(downloadURL);
          }
          
          toast({
            title: "Profile image updated",
            description: "Your profile image has been updated successfully",
          });
        } catch (error) {
          console.error('Error uploading image:', error);
          
          // Fallback to local storage if Firebase fails
          if (error instanceof Error && error.message.includes("Firebase Storage is not available")) {
            // Store image in localStorage as fallback
            try {
              const imageData = event.target?.result as string;
              localStorage.setItem(`profile_image_${user.id}`, imageData);
              
              // Update user profile with data URL directly
              if (setUser && user) {
                setUser({
                  ...user,
                  profile: {
                    ...user.profile,
                    avatar: imageData
                  }
                });
              }
              
              // Call callback if provided
              if (onImageUploaded) {
                onImageUploaded(imageData);
              }
              
              toast({
                title: "Profile image updated (local only)",
                description: "Your profile image has been saved locally",
              });
            } catch (localError) {
              toast({
                title: "Upload failed",
                description: "Failed to save image even locally",
                variant: "destructive"
              });
            }
          } else {
            toast({
              title: "Upload failed",
              description: error instanceof Error ? error.message : "Failed to upload image",
              variant: "destructive"
            });
          }
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.onerror = () => {
        toast({
          title: "Error reading file",
          description: "Failed to read the selected file",
          variant: "destructive"
        });
        setIsUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error handling file:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      setIsUploading(false);
    }
  };
  
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className={className}>
      <div className="relative">
        <Avatar className="h-24 w-24 mx-auto cursor-pointer" onClick={handleButtonClick}>
          {user?.profile?.avatar ? (
            <AvatarImage src={user.profile.avatar} alt={`${user.firstName} ${user.lastName}`} />
          ) : (
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {firstLetters}
            </AvatarFallback>
          )}
          
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
        </Avatar>
        
        <Button 
          size="icon"
          variant="secondary"
          className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md"
          onClick={handleButtonClick}
          disabled={isUploading}
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </Button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      
      <p className="text-center text-sm text-muted-foreground mt-2">
        Click to update profile image
      </p>
    </div>
  );
}