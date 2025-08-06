import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { RobotAvatarData } from './useRobotAvatar';

interface AvatarNFT {
  id: string;
  avatar_config: RobotAvatarData;
  nft_metadata: any;
  blockchain_address?: string;
  token_id?: string;
  serial_number?: number;
  rarity_tier: string;
  minted_at?: string;
  created_at: string;
}

export const useNFT = () => {
  const [nfts, setNfts] = useState<AvatarNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const { toast } = useToast();

  // Fetch user's NFTs
  const fetchNFTs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('avatar_nfts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching NFTs:', error);
      return;
    }

    setNfts((data as any[]) || []);
  };

  // Generate NFT metadata from avatar configuration
  const generateNFTMetadata = async (avatarConfig: RobotAvatarData): Promise<any> => {
    // Get next serial number
    const { count } = await supabase
      .from('avatar_nfts')
      .select('*', { count: 'exact', head: true });

    const serialNumber = (count || 0) + 1;

    const { data, error } = await supabase.rpc('generate_nft_metadata', {
      _avatar_config: avatarConfig,
      _serial_number: serialNumber
    });

    if (error) {
      console.error('Error generating NFT metadata:', error);
      throw error;
    }

    return { metadata: data, serialNumber };
  };

  // Mint NFT from avatar configuration
  const mintAvatarNFT = async (avatarConfig: RobotAvatarData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    setMinting(true);

    try {
      // Generate metadata and serial number
      const { metadata, serialNumber } = await generateNFTMetadata(avatarConfig);

      // Create NFT record in database
      const { data: nftData, error: nftError } = await supabase
        .from('avatar_nfts')
        .insert({
          user_id: user.id,
          avatar_config: avatarConfig as any,
          nft_metadata: metadata as any,
          serial_number: serialNumber,
          rarity_tier: metadata.rarity_tier
        })
        .select()
        .single();

      if (nftError) {
        console.error('Error creating NFT record:', nftError);
        throw nftError;
      }

      // In a real implementation, this would:
      // 1. Connect to user's wallet (MetaMask/WalletConnect)
      // 2. Call smart contract to mint NFT on Polygon
      // 3. Update database with blockchain address and token ID
      
      // For now, we'll simulate this process
      await simulateBlockchainMinting(nftData.id, metadata);

      await fetchNFTs();

      toast({
        title: "NFT Minted Successfully! 🎉",
        description: `Your TapFit Robot Avatar #${serialNumber} has been minted as an NFT!`,
      });

      return true;
    } catch (error) {
      console.error('Error minting NFT:', error);
      toast({
        title: "Minting Failed",
        description: "Unable to mint your avatar as an NFT. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setMinting(false);
    }
  };

  // Simulate blockchain minting process
  const simulateBlockchainMinting = async (nftId: string, metadata: any) => {
    // Simulate blockchain transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate simulated blockchain data
    const mockBlockchainAddress = `0x${Math.random().toString(16).slice(2, 42)}`;
    const mockTokenId = Math.random().toString(16).slice(2, 10);

    // Update NFT record with blockchain data
    const { error } = await supabase
      .from('avatar_nfts')
      .update({
        blockchain_address: mockBlockchainAddress,
        token_id: mockTokenId,
        minted_at: new Date().toISOString()
      })
      .eq('id', nftId);

    if (error) {
      console.error('Error updating NFT with blockchain data:', error);
      throw error;
    }
  };

  // Get NFT by ID
  const getNFTById = (id: string) => {
    return nfts.find(nft => nft.id === id);
  };

  // Check if avatar configuration has been minted
  const isAvatarMinted = (avatarConfig: RobotAvatarData) => {
    return nfts.some(nft => 
      JSON.stringify(nft.avatar_config) === JSON.stringify(avatarConfig)
    );
  };

  // Export NFT metadata for external use
  const exportNFTMetadata = (nftId: string) => {
    const nft = getNFTById(nftId);
    if (!nft) return null;

    return {
      metadata: nft.nft_metadata,
      blockchainAddress: nft.blockchain_address,
      tokenId: nft.token_id,
      serialNumber: nft.serial_number,
      rarityTier: nft.rarity_tier
    };
  };

  useEffect(() => {
    const loadNFTs = async () => {
      setLoading(true);
      await fetchNFTs();
      setLoading(false);
    };

    loadNFTs();
  }, []);

  return {
    nfts,
    loading,
    minting,
    mintAvatarNFT,
    fetchNFTs,
    getNFTById,
    isAvatarMinted,
    exportNFTMetadata,
    generateNFTMetadata
  };
};