import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  X, 
  Minimize2, 
  Bot,
  User,
  Dumbbell,
  Apple,
  Heart,
  Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAvatar as useSelectedAvatar } from '@/lib/avatarState';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface FitnessChatbotProps {
  isOpen: boolean;
  onToggle: () => void;
  userId?: string;
}

const FitnessChatbot: React.FC<FitnessChatbotProps> = ({ isOpen, onToggle, userId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Selected avatar (mini) for bot identity
  const { avatar } = useSelectedAvatar();
  const miniUrl = avatar?.mini_image_url;
  const avatarName = avatar?.name || 'FitBot';

  // Initialize messages with dynamic avatar name
  useEffect(() => {
    setMessages([{
      id: '1',
      text: `👋 Hi! I'm ${avatarName}, your AI fitness companion. Ready to help with workouts, nutrition, and motivation!`,
      isUser: false,
      timestamp: new Date()
    }]);
  }, [avatarName]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickActions = [
    { icon: Dumbbell, text: "Workout tips", message: "Give me some workout tips for today" },
    { icon: Apple, text: "Nutrition advice", message: "What should I eat for better performance?" },
    { icon: Heart, text: "Recovery tips", message: "How can I improve my recovery?" },
    { icon: Target, text: "Set goals", message: "Help me set realistic fitness goals" }
  ];

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('fitness-chat', {
        body: { 
          message: messageText,
          userId: userId 
        }
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Chat Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive"
      });
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting right now. Please try again!",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (message: string) => {
    sendMessage(message);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg z-50"
        size="icon"
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-80 h-96 shadow-xl z-50 flex flex-col">
      <CardHeader className="p-4 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shadow-sm">
              {miniUrl ? (
                <img
                  src={miniUrl}
                  alt={`${avatarName} avatar`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to bot icon if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <Bot className={`h-4 w-4 text-primary/60 ${miniUrl ? 'hidden' : ''}`} />
            </div>
            <CardTitle className="text-sm font-semibold">{avatarName}</CardTitle>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-6 w-6 p-0"
              aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-6 w-6 p-0"
              aria-label="Close chat"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          <CardContent className="flex-1 p-0 flex flex-col min-h-0">
            <ScrollArea className="flex-1 p-4 border-2 border-blue-500/50 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.3)] rounded-lg mx-2 mb-2">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        message.isUser
                          ? 'bg-primary text-primary-foreground ml-8'
                          : 'bg-muted'
                      }`}
                    >
                      {message.text}
                    </div>
                    {message.isUser && (
                      <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2 justify-start">
                    <div className="bg-muted p-3 rounded-lg text-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 pt-0">
              <div className="grid grid-cols-2 gap-2">
                {[ 
                  { icon: Dumbbell, text: "Workout tips", message: "Give me workout tips" },
                  { icon: Apple, text: "Nutrition advice", message: "What should I eat?" },
                  { icon: Heart, text: "Recovery & support", message: "Recovery tips?" },
                  { icon: Target, text: "Set goals", message: "Help set fitness goals" }
                ].map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action.message)}
                    className="flex items-center gap-1 text-xs h-8"
                    disabled={isLoading}
                  >
                    <action.icon className="h-3 w-3" />
                    {action.text}
                  </Button>
                ))}
              </div>
            </div>

            <div className="p-4 pt-2 border-t flex-shrink-0">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Chat with ${avatarName} about anything fitness, nutrition, or motivation...`}
                  className="flex-1 text-sm"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                >
                  <Send className="h-3 w-3" />
                </Button>
              </form>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
};

export default FitnessChatbot;
