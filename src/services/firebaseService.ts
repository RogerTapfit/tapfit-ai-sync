import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBQdVyTap-firebase-demo-key",
  authDomain: "tapfit-avatars.firebaseapp.com",
  projectId: "tapfit-avatars",
  storageBucket: "tapfit-avatars.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:demo-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Avatar state interface
export interface AvatarState {
  userId: string;
  readyPlayerMeId?: string;
  customizations: {
    bodyType: string;
    colorScheme: {
      primary: string;
      secondary: string;
      accent: string;
    };
    accessories: string[];
    expressions: string[];
  };
  unlockedItems: string[];
  purchaseHistory: Array<{
    itemId: string;
    timestamp: Date;
    cost: number;
  }>;
  levelProgress: {
    currentLevel: number;
    experience: number;
    achievements: string[];
  };
  nftStatus: {
    hasMinted: boolean;
    nftId?: string;
    blockchain?: string;
  };
  lastUpdated: Date;
}

// Animation asset interface
export interface AnimationAsset {
  id: string;
  name: string;
  type: 'lottie' | 'rive';
  category: 'celebration' | 'workout' | 'idle' | 'coaching' | 'expression';
  fileUrl: string;
  metadata: {
    duration: number;
    triggers: string[];
    tags: string[];
  };
  isActive: boolean;
  createdAt: Date;
}

// NFT metadata interface
export interface NFTMetadata {
  nftId: string;
  userId: string;
  avatarSnapshot: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
      trait_type: string;
      value: string | number;
    }>;
  };
  blockchainData: {
    contractAddress: string;
    tokenId: string;
    network: string;
    transactionHash: string;
  };
  createdAt: Date;
}

// Avatar state management
export const saveAvatarState = async (avatarState: AvatarState): Promise<boolean> => {
  try {
    const docRef = doc(db, 'avatarStates', avatarState.userId);
    await setDoc(docRef, {
      ...avatarState,
      lastUpdated: new Date()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving avatar state:', error);
    return false;
  }
};

export const getAvatarState = async (userId: string): Promise<AvatarState | null> => {
  try {
    const docRef = doc(db, 'avatarStates', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as AvatarState;
    }
    return null;
  } catch (error) {
    console.error('Error getting avatar state:', error);
    return null;
  }
};

export const updateAvatarState = async (userId: string, updates: Partial<AvatarState>): Promise<boolean> => {
  try {
    const docRef = doc(db, 'avatarStates', userId);
    await updateDoc(docRef, {
      ...updates,
      lastUpdated: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error updating avatar state:', error);
    return false;
  }
};

// Animation library management
export const uploadAnimationAsset = async (
  file: File, 
  metadata: Omit<AnimationAsset, 'id' | 'fileUrl' | 'createdAt'>
): Promise<string | null> => {
  try {
    // Upload file to storage
    const storageRef = ref(storage, `animations/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Save metadata to Firestore
    const docRef = await addDoc(collection(db, 'animationLibrary'), {
      ...metadata,
      fileUrl: downloadURL,
      createdAt: new Date()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error uploading animation asset:', error);
    return null;
  }
};

export const getAnimationAssets = async (category?: string): Promise<AnimationAsset[]> => {
  try {
    let q = query(collection(db, 'animationLibrary'));
    if (category) {
      q = query(collection(db, 'animationLibrary'), where('category', '==', category));
    }
    
    const querySnapshot = await getDocs(q);
    const assets: AnimationAsset[] = [];
    
    querySnapshot.forEach((doc) => {
      assets.push({
        id: doc.id,
        ...doc.data()
      } as AnimationAsset);
    });
    
    return assets;
  } catch (error) {
    console.error('Error getting animation assets:', error);
    return [];
  }
};

// NFT metadata management
export const saveNFTMetadata = async (nftData: NFTMetadata): Promise<boolean> => {
  try {
    const docRef = doc(db, 'nftMetadata', nftData.nftId);
    await setDoc(docRef, {
      ...nftData,
      createdAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error saving NFT metadata:', error);
    return false;
  }
};

export const getNFTMetadata = async (nftId: string): Promise<NFTMetadata | null> => {
  try {
    const docRef = doc(db, 'nftMetadata', nftId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as NFTMetadata;
    }
    return null;
  } catch (error) {
    console.error('Error getting NFT metadata:', error);
    return null;
  }
};

export const getUserNFTs = async (userId: string): Promise<NFTMetadata[]> => {
  try {
    const q = query(collection(db, 'nftMetadata'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const nfts: NFTMetadata[] = [];
    
    querySnapshot.forEach((doc) => {
      nfts.push({
        ...doc.data(),
        nftId: doc.id
      } as NFTMetadata);
    });
    
    return nfts;
  } catch (error) {
    console.error('Error getting user NFTs:', error);
    return [];
  }
};

// Avatar achievements
export interface AvatarAchievement {
  userId: string;
  achievementId: string;
  type: 'fitness_milestone' | 'customization_unlock' | 'nft_mint' | 'social_share';
  title: string;
  description: string;
  reward: {
    type: 'customization' | 'animation' | 'nft' | 'tokens';
    value: string | number;
  };
  unlockedAt: Date;
}

export const saveAvatarAchievement = async (achievement: AvatarAchievement): Promise<boolean> => {
  try {
    await addDoc(collection(db, 'avatarAchievements'), {
      ...achievement,
      unlockedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error saving avatar achievement:', error);
    return false;
  }
};

export const getUserAchievements = async (userId: string): Promise<AvatarAchievement[]> => {
  try {
    const q = query(collection(db, 'avatarAchievements'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const achievements: AvatarAchievement[] = [];
    
    querySnapshot.forEach((doc) => {
      achievements.push(doc.data() as AvatarAchievement);
    });
    
    return achievements;
  } catch (error) {
    console.error('Error getting user achievements:', error);
    return [];
  }
};

// Initialize anonymous authentication for demo
export const initializeFirebaseAuth = async (): Promise<string | null> => {
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user.uid;
  } catch (error) {
    console.error('Error with Firebase auth:', error);
    return null;
  }
};

// Export service instance
export const firebaseService = {
  saveAvatarState,
  getAvatarState,
  updateAvatarState,
  uploadAnimationAsset,
  getAnimationAssets,
  saveNFTMetadata,
  getNFTMetadata,
  getUserNFTs,
  saveAvatarAchievement,
  getUserAchievements,
  initializeFirebaseAuth
};