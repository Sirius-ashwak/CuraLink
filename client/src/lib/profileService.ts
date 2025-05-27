import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get user profile by ID and role
 * @param userId User ID
 * @param role User role (doctor or patient)
 * @returns User profile data
 */
export const getUserProfile = async (userId: string, role: string) => {
  try {
    // Determine collection based on role
    const collection = role === 'doctor' ? 'doctors' : 'patients';
    
    // First get the user document to find the profile ID
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const profileId = userData.profileId;
    
    // Now get the profile document
    const profileDoc = await getDoc(doc(db, collection, profileId));
    
    if (!profileDoc.exists()) {
      throw new Error('Profile not found');
    }
    
    return {
      ...profileDoc.data(),
      id: profileDoc.id
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param userId User ID
 * @param role User role (doctor or patient)
 * @param profileData Updated profile data
 * @returns Updated profile
 */
export const updateUserProfile = async (userId: string, role: string, profileData: any) => {
  try {
    // Determine collection based on role
    const collection = role === 'doctor' ? 'doctors' : 'patients';
    
    // Get the user document to find the profile ID
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const profileId = userData.profileId;
    
    // Update the profile
    const profileRef = doc(db, collection, profileId);
    
    // Add updatedAt timestamp
    const dataToUpdate = {
      ...profileData,
      updatedAt: new Date()
    };
    
    await updateDoc(profileRef, dataToUpdate);
    
    // Get the updated profile
    const updatedProfileDoc = await getDoc(profileRef);
    
    return {
      ...updatedProfileDoc.data(),
      id: updatedProfileDoc.id
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Upload profile image
 * @param userId User ID
 * @param role User role (doctor or patient)
 * @param imageData Image data (base64 or SVG string)
 * @param contentType Image content type
 * @returns URL of uploaded image
 */
export const uploadProfileImage = async (
  userId: string,
  role: string,
  imageData: string,
  contentType: string = 'image/svg+xml'
) => {
  try {
    // Generate unique filename
    const filename = `profile-${userId}-${uuidv4()}`;
    const storagePath = `profiles/${filename}`;
    
    // Create storage reference
    const storageRef = ref(storage, storagePath);
    
    // Determine format for uploadString
    let format: 'raw' | 'data_url' = 'raw';
    if (imageData.startsWith('data:')) {
      format = 'data_url';
    }
    
    // Upload image
    await uploadString(storageRef, imageData, format, {
      contentType
    });
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    // Update profile with new image URL
    await updateUserProfile(userId, role, {
      profileImageUrl: downloadURL
    });
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
};

/**
 * Update user profile settings
 * This is a comprehensive function that updates both basic info and settings
 * @param userId User ID
 * @param role User role (doctor or patient)
 * @param profileData Updated profile data
 * @param userBasicData Basic user data to update
 * @returns Updated profile and user data
 */
export const updateProfileSettings = async (
  userId: string, 
  role: string, 
  profileData: any, 
  userBasicData?: { name?: string, email?: string }
) => {
  try {
    // Update profile
    const updatedProfile = await updateUserProfile(userId, role, profileData);
    
    // If basic user data provided, update the user document too
    if (userBasicData) {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...userBasicData,
        updatedAt: new Date()
      });
    }
    
    return {
      profile: updatedProfile,
      updated: true
    };
  } catch (error) {
    console.error('Error updating profile settings:', error);
    throw error;
  }
};