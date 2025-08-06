import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, ExternalLink, Copy } from 'lucide-react';
import { useNFT } from '@/hooks/useNFT';
import { useRobotAvatar } from '@/hooks/useRobotAvatar';
import { RobotAvatarDisplay } from './RobotAvatarDisplay';
import { useToast } from '@/hooks/use-toast';

interface NFTMinterProps {
  onClose: () => void;
}

export const NFTMinter = ({ onClose }: NFTMinterProps) => {
  const { avatarData } = useRobotAvatar();
  const { mintAvatarNFT, minting, nfts, isAvatarMinted } = useNFT();
  const [showPreview, setShowPreview] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);
  const { toast } = useToast();

  const handleMint = async () => {
    if (!avatarData) return;
    
    const success = await mintAvatarNFT(avatarData);
    if (success) {
      setShowPreview(false);
    }
  };

  const generatePreview = async () => {
    if (!avatarData) return;
    
    // This would generate a preview of the NFT metadata
    const mockMetadata = {
      name: `TapFit Robot Avatar #${Math.floor(Math.random() * 10000)}`,
      description: "A unique fitness robot companion from the TapFit universe",
      attributes: [
        { trait_type: "Chassis Type", value: avatarData.chassis_type },
        { trait_type: "Power Level", value: avatarData.power_level },
        { trait_type: "Tech Modules", value: avatarData.tech_modules.length },
        { trait_type: "Energy Core", value: avatarData.energy_core },
        { trait_type: "Rarity", value: calculateRarity() }
      ]
    };
    
    setMetadata(mockMetadata);
    setShowPreview(true);
  };

  const calculateRarity = () => {
    if (!avatarData) return 'Common';
    
    let score = 0;
    if (avatarData.chassis_type !== 'slim_bot') score += 10;
    if (avatarData.tech_modules.length > 3) score += 15;
    if (avatarData.power_level > 75) score += 20;
    
    if (score >= 35) return 'Legendary';
    if (score >= 20) return 'Epic';
    if (score >= 10) return 'Rare';
    return 'Common';
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return 'from-yellow-400 to-yellow-600';
      case 'Epic': return 'from-purple-400 to-purple-600';
      case 'Rare': return 'from-blue-400 to-blue-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "NFT metadata copied to clipboard",
    });
  };

  if (!avatarData) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>NFT Minter</CardTitle>
          <CardDescription>No avatar data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const alreadyMinted = isAvatarMinted(avatarData);
  const rarity = calculateRarity();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                NFT Minter
              </CardTitle>
              <CardDescription>
                Mint your robot avatar as a unique NFT on the Polygon blockchain
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Avatar Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Avatar Preview</h3>
              <div className="flex justify-center">
                <RobotAvatarDisplay
                  avatarData={avatarData}
                  size="large"
                  showAnimation={true}
                  emotion="excited"
                  pose="power_up"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rarity</span>
                  <Badge className={`bg-gradient-to-r ${getRarityColor(rarity)} text-white`}>
                    {rarity}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Power Level</span>
                  <span className="text-sm font-mono">{avatarData.power_level}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tech Modules</span>
                  <span className="text-sm">{avatarData.tech_modules.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Chassis Type</span>
                  <span className="text-sm capitalize">{avatarData.chassis_type.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {/* NFT Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">NFT Details</h3>
              
              {!showPreview ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Generate a preview of your NFT metadata before minting on the blockchain.
                  </p>
                  
                  <Button 
                    onClick={generatePreview}
                    className="w-full"
                    variant="outline"
                  >
                    Generate Preview
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {metadata && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{metadata.name}</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(JSON.stringify(metadata, null, 2))}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {metadata.description}
                      </p>
                      
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Attributes:</h5>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {metadata.attributes.map((attr: any, index: number) => (
                            <div key={index} className="flex justify-between">
                              <span className="text-muted-foreground">{attr.trait_type}:</span>
                              <span>{attr.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Blockchain Details</h4>
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <p>Network: Polygon (MATIC)</p>
                      <p>Standard: ERC-721</p>
                      <p>Gas Fee: ~$0.01 MATIC</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User's NFT Collection */}
          {nfts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Your NFT Collection</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nfts.slice(0, 6).map((nft) => (
                  <Card key={nft.id} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">#{nft.serial_number}</span>
                      <Badge variant="outline" className="text-xs">
                        {nft.rarity_tier}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Minted: {new Date(nft.created_at).toLocaleDateString()}</p>
                      {nft.blockchain_address && (
                        <p className="flex items-center gap-1">
                          <span>On-chain</span>
                          <ExternalLink className="w-3 h-3" />
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Minting Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            {alreadyMinted ? (
              <div className="flex-1">
                <Badge variant="outline" className="w-full py-2 justify-center">
                  This avatar configuration has already been minted as an NFT
                </Badge>
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMint}
                  disabled={minting || !showPreview}
                  className="flex-1 bg-gradient-to-r from-primary to-primary-glow"
                >
                  {minting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Minting NFT...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Mint as NFT
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};