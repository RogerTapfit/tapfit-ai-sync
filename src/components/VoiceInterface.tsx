import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Phone, PhoneOff, MessageSquare, Volume2 } from 'lucide-react';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface VoiceInterfaceProps {
  isOpen: boolean;
  onToggle: () => void;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ isOpen, onToggle }) => {
  const {
    messages,
    voiceState,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    sendTextMessage,
    clearMessages
  } = useRealtimeChat();

  const [textInput, setTextInput] = useState('');

  const handleConnect = async () => {
    await connect();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleMicToggle = async () => {
    if (voiceState.isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleSendText = () => {
    if (textInput.trim() && voiceState.isConnected) {
      sendTextMessage(textInput.trim());
      setTextInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <Card className="w-full max-w-md bg-card border-border shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Voice Chat with Tappy</CardTitle>
            <Button variant="ghost" size="sm" onClick={onToggle}>
              ×
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={voiceState.isConnected ? "default" : "secondary"}>
              {voiceState.isConnected ? "Connected" : "Disconnected"}
            </Badge>
            {voiceState.isAISpeaking && (
              <Badge variant="secondary" className="animate-pulse">
                <Volume2 className="w-3 h-3 mr-1" />
                Tappy Speaking
              </Badge>
            )}
            {voiceState.isRecording && (
              <Badge variant="destructive" className="animate-pulse">
                <Mic className="w-3 h-3 mr-1" />
                Recording
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Connection Controls */}
          <div className="flex gap-2">
            {!voiceState.isConnected ? (
              <Button onClick={handleConnect} className="flex-1">
                <Phone className="w-4 h-4 mr-2" />
                Connect
              </Button>
            ) : (
              <Button onClick={handleDisconnect} variant="destructive" className="flex-1">
                <PhoneOff className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            )}
            
            {messages.length > 0 && (
              <Button onClick={clearMessages} variant="outline">
                Clear
              </Button>
            )}
          </div>

          {/* Voice Controls */}
          {voiceState.isConnected && (
            <div className="flex justify-center">
              <Button
                size="lg"
                variant={voiceState.isRecording ? "destructive" : "default"}
                onClick={handleMicToggle}
                className={cn(
                  "w-16 h-16 rounded-full",
                  voiceState.isRecording && "animate-pulse"
                )}
              >
                {voiceState.isRecording ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </Button>
            </div>
          )}

          {/* Error Display */}
          {voiceState.error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{voiceState.error}</p>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: message.type === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "p-3 rounded-lg text-sm",
                    message.type === 'user'
                      ? "bg-primary text-primary-foreground ml-8"
                      : "bg-muted text-muted-foreground mr-8"
                  )}
                >
                  <div className="font-medium mb-1">
                    {message.type === 'user' ? 'You' : 'Tappy'}
                  </div>
                  <div>{message.content}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Text Input */}
          {voiceState.isConnected && (
            <div className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button onClick={handleSendText} size="sm">
                <MessageSquare className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Instructions */}
          {!voiceState.isConnected && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Connect to start voice chatting with Tappy, your AI fitness coach!</p>
              <p className="mt-2">You can speak naturally or type messages.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default VoiceInterface;