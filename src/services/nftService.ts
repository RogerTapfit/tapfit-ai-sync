import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import { Polygon } from '@thirdweb-dev/chains';

// NFT Service configuration
const NFT_CONFIG = {
  chainId: Polygon.chainId,
  contractAddress: '0x1234567890123456789012345678901234567890', // Demo contract address
  network: 'polygon',
  apiKey: 'demo-api-key', // This would be from environment variables
};

// NFT metadata interface
export interface AvatarNFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  avatar_config: {
    readyPlayerMeId: string;
    customizations: any;
    fitnessLevel: number;
    achievements: string[];
  };
  tapfit_metadata: {
    userId: string;
    createdAt: string;
    serialNumber: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  };
}

// NFT minting result
export interface NFTMintResult {
  success: boolean;
  tokenId?: string;
  transactionHash?: string;
  contractAddress?: string;
  error?: string;
  metadata?: AvatarNFTMetadata;
}

export class NFTService {
  private sdk: ThirdwebSDK;
  private contract: any | null = null;
  
  constructor() {
    this.sdk = new ThirdwebSDK(Polygon, {
      clientId: NFT_CONFIG.apiKey
    });
  }
  
  // Initialize NFT contract
  async initializeContract(): Promise<boolean> {
    try {
      this.contract = await this.sdk.getContract(NFT_CONFIG.contractAddress);
      return true;
    } catch (error) {
      console.error('Error initializing NFT contract:', error);
      return false;
    }
  }
  
  // Generate NFT metadata from avatar data
  async generateNFTMetadata(
    userId: string,
    avatarData: any,
    avatarImageUrl: string
  ): Promise<AvatarNFTMetadata> {
    const serialNumber = await this.getNextSerialNumber();
    const rarity = this.calculateRarity(avatarData);
    
    const metadata: AvatarNFTMetadata = {
      name: `TapFit Avatar #${serialNumber}`,
      description: 'A unique fitness companion from the TapFit universe. This avatar represents your fitness journey and achievements.',
      image: avatarImageUrl,
      external_url: `https://tapfit.app/avatar/${userId}`,
      attributes: [
        {
          trait_type: 'Body Type',
          value: avatarData.customizations?.bodyType || 'Athletic'
        },
        {
          trait_type: 'Color Scheme',
          value: avatarData.customizations?.colorScheme || 'TapFit Red'
        },
        {
          trait_type: 'Fitness Level',
          value: avatarData.metadata?.fitnessLevel || 1
        },
        {
          trait_type: 'Accessories Count',
          value: avatarData.customizations?.accessories?.length || 0
        },
        {
          trait_type: 'Achievements',
          value: avatarData.metadata?.achievements?.length || 0
        },
        {
          trait_type: 'Rarity',
          value: rarity
        },
        {
          trait_type: 'Serial Number',
          value: serialNumber
        }
      ],
      avatar_config: {
        readyPlayerMeId: avatarData.id,
        customizations: avatarData.customizations,
        fitnessLevel: avatarData.metadata?.fitnessLevel || 1,
        achievements: avatarData.metadata?.achievements || []
      },
      tapfit_metadata: {
        userId,
        createdAt: new Date().toISOString(),
        serialNumber,
        rarity
      }
    };
    
    return metadata;
  }
  
  // Mint avatar NFT
  async mintAvatarNFT(
    walletAddress: string,
    metadata: AvatarNFTMetadata
  ): Promise<NFTMintResult> {
    try {
      if (!this.contract) {
        const initialized = await this.initializeContract();
        if (!initialized) {
          return {
            success: false,
            error: 'Failed to initialize NFT contract'
          };
        }
      }
      
      // Upload metadata to IPFS
      const metadataUri = await this.uploadMetadataToIPFS(metadata);
      if (!metadataUri) {
        return {
          success: false,
          error: 'Failed to upload metadata to IPFS'
        };
      }
      
      // Mint NFT to user's wallet
      const transaction = await this.contract!.mintTo(walletAddress, metadataUri);
      const receipt = await transaction.receipt;
      
      return {
        success: true,
        tokenId: receipt.events?.[0]?.args?.tokenId?.toString(),
        transactionHash: receipt.transactionHash,
        contractAddress: NFT_CONFIG.contractAddress,
        metadata
      };
      
    } catch (error) {
      console.error('Error minting avatar NFT:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  // Upload metadata to IPFS
  private async uploadMetadataToIPFS(metadata: AvatarNFTMetadata): Promise<string | null> {
    try {
      // This would use a proper IPFS service like Pinata or Web3.Storage
      // For demo purposes, we'll simulate the upload
      const ipfsHash = `QmDemo${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      return `ipfs://${ipfsHash}`;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      return null;
    }
  }
  
  // Calculate rarity based on avatar attributes
  private calculateRarity(avatarData: any): 'common' | 'rare' | 'epic' | 'legendary' {
    let rarityScore = 0;
    
    // Base score from fitness level
    const fitnessLevel = avatarData.metadata?.fitnessLevel || 1;
    rarityScore += fitnessLevel * 10;
    
    // Score from achievements
    const achievements = avatarData.metadata?.achievements || [];
    rarityScore += achievements.length * 15;
    
    // Score from premium customizations
    const accessories = avatarData.customizations?.accessories || [];
    const premiumAccessories = accessories.filter((acc: string) => 
      ['dumbbell_set', 'compression_gear', 'resistance_bands'].includes(acc)
    );
    rarityScore += premiumAccessories.length * 20;
    
    // Score from color scheme
    const colorScheme = avatarData.customizations?.colorScheme;
    if (['electric_blue', 'cyber_green', 'neon_purple'].includes(colorScheme)) {
      rarityScore += 25;
    }
    
    // Determine rarity tier
    if (rarityScore >= 100) return 'legendary';
    if (rarityScore >= 70) return 'epic';
    if (rarityScore >= 40) return 'rare';
    return 'common';
  }
  
  // Get next serial number for NFT
  private async getNextSerialNumber(): Promise<number> {
    try {
      if (!this.contract) {
        await this.initializeContract();
      }
      
      // Get total supply and add 1
      const totalSupply = await this.contract!.totalSupply();
      return totalSupply.toNumber() + 1;
    } catch (error) {
      console.error('Error getting serial number:', error);
      // Fallback to timestamp-based serial
      return Date.now() % 1000000;
    }
  }
  
  // Get user's NFTs
  async getUserNFTs(walletAddress: string): Promise<any[]> {
    try {
      if (!this.contract) {
        await this.initializeContract();
      }
      
      const nfts = await this.contract!.getOwnedTokenIds(walletAddress);
      const nftData = [];
      
      for (const tokenId of nfts) {
        const metadata = await this.contract!.tokenURI(tokenId);
        nftData.push({
          tokenId: tokenId.toString(),
          metadata
        });
      }
      
      return nftData;
    } catch (error) {
      console.error('Error getting user NFTs:', error);
      return [];
    }
  }
  
  // Check if avatar configuration has been minted
  async isAvatarMinted(userId: string, avatarId: string): Promise<boolean> {
    try {
      // This would check against a database or blockchain
      // For demo, we'll return false to allow minting
      return false;
    } catch (error) {
      console.error('Error checking if avatar is minted:', error);
      return false;
    }
  }
  
  // Export NFT metadata for sharing
  exportNFTMetadata(nftData: any): string {
    try {
      return JSON.stringify(nftData, null, 2);
    } catch (error) {
      console.error('Error exporting NFT metadata:', error);
      return '';
    }
  }
  
  // Get NFT marketplace URL
  getMarketplaceUrl(tokenId: string): string {
    return `https://opensea.io/assets/polygon/${NFT_CONFIG.contractAddress}/${tokenId}`;
  }
  
  // Get rarity color for UI
  getRarityColor(rarity: string): string {
    switch (rarity) {
      case 'legendary': return 'hsl(45, 100%, 60%)'; // Gold
      case 'epic': return 'hsl(280, 100%, 70%)'; // Purple
      case 'rare': return 'hsl(220, 100%, 60%)'; // Blue
      case 'common': default: return 'hsl(120, 30%, 50%)'; // Green
    }
  }
}

// Export singleton instance
export const nftService = new NFTService();