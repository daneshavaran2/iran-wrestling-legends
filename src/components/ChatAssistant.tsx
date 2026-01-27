import React, { useState, useRef, useEffect, forwardRef, memo } from 'react';
import { MessageCircle, X, Send, Trash2, Bot, User, Loader2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FloatingIconWithSparks } from '@/components/ui/FloatingIconWithSparks';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChatAssistant, Message } from '@/hooks/useChatAssistant';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { cn } from '@/lib/utils';

const ChatAssistantInner = forwardRef<HTMLDivElement, Record<string, never>>((_props, ref) => {
  const { t, dir } = useLanguage();
  const { messages, sendMessage, isLoading, clearHistory } = useChatAssistant();
  const { speak, stop, isPlaying, isSupported } = useTextToSpeech();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset speaking state when playback stops
  useEffect(() => {
    if (!isPlaying) {
      setSpeakingMessageIndex(null);
    }
  }, [isPlaying]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSpeak = (text: string, index: number) => {
    if (speakingMessageIndex === index && isPlaying) {
      stop();
      setSpeakingMessageIndex(null);
    } else {
      speak(text);
      setSpeakingMessageIndex(index);
    }
  };

  const suggestions = [
    { key: 'history', label: t('assistant.suggestions.history') },
    { key: 'champions', label: t('assistant.suggestions.champions') },
    { key: 'museum', label: t('assistant.suggestions.museum') },
  ];

  return (
    <div ref={ref}>
      {/* Chat Button with Sparks */}
      {!isOpen && (
        <div className={cn("fixed bottom-6 z-50", dir === 'rtl' ? 'right-6' : 'left-6')}>
          <FloatingIconWithSparks
            onClick={() => setIsOpen(true)}
            className="text-primary hover:text-foreground"
          >
            <MessageCircle className="h-6 w-6" />
          </FloatingIconWithSparks>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className={cn(
            "fixed bottom-6 z-50 w-[360px] max-w-[calc(100vw-2rem)]",
            "bg-background/95 backdrop-blur-xl rounded-2xl",
            "border border-gold/30 shadow-2xl shadow-black/50",
            "flex flex-col overflow-hidden",
            "animate-in slide-in-from-bottom-5 duration-300",
            dir === 'rtl' ? 'left-6' : 'right-6'
          )}
          style={{ height: 'min(500px, calc(100vh - 6rem))' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gold/20 bg-gold/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gold/20">
                <Bot className="h-5 w-5 text-gold" />
              </div>
              <h3 className="font-bold text-foreground">{t('assistant.title')}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={clearHistory}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title={t('assistant.clearHistory')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="space-y-4">
                {/* Greeting */}
                <div className="flex gap-3">
                  <div className="p-2 rounded-full bg-gold/20 h-fit">
                    <Bot className="h-4 w-4 text-gold" />
                  </div>
                  <div className="flex-1 p-3 rounded-2xl bg-muted/50 text-sm">
                    {t('assistant.greeting')}
                  </div>
                </div>

                {/* Suggestions */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.key}
                      onClick={() => sendMessage(suggestion.label)}
                      className="px-3 py-2 text-xs rounded-full bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-colors"
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <MessageBubble 
                    key={index} 
                    message={message}
                    onSpeak={() => handleSpeak(message.content, index)}
                    isSpeaking={speakingMessageIndex === index && isPlaying}
                    showTTS={isSupported && message.role === 'assistant'}
                    t={t}
                  />
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="p-2 rounded-full bg-gold/20 h-fit">
                      <Bot className="h-4 w-4 text-gold" />
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-muted/50">
                      <Loader2 className="h-4 w-4 animate-spin text-gold" />
                      <span className="text-sm text-muted-foreground">{t('common.loading')}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-gold/20 bg-background/50">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('assistant.placeholder')}
                className="flex-1 bg-muted/30 border-gold/20 focus:border-gold/50"
                disabled={isLoading}
                autoComplete="off"
                autoCorrect="off"
                inputMode="text"
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="bg-gold hover:bg-gold/90 text-background"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ChatAssistantInner.displayName = 'ChatAssistantInner';

// Export memoized component to prevent unnecessary re-renders
export const ChatAssistant = memo(ChatAssistantInner);

interface MessageBubbleProps {
  message: Message;
  onSpeak: () => void;
  isSpeaking: boolean;
  showTTS: boolean;
  t: (key: string) => string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onSpeak, isSpeaking, showTTS, t }) => {
  const isUser = message.role === 'user';

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div className={cn(
        "p-2 rounded-full h-fit",
        isUser ? "bg-gold/30" : "bg-gold/20"
      )}>
        {isUser ? (
          <User className="h-4 w-4 text-gold" />
        ) : (
          <Bot className="h-4 w-4 text-gold" />
        )}
      </div>
      <div className="flex flex-col gap-1 max-w-[80%]">
        <div className={cn(
          "p-3 rounded-2xl text-sm",
          isUser 
            ? "bg-gold/20 text-foreground" 
            : "bg-muted/50 text-foreground"
        )}>
          {message.content}
        </div>
        {showTTS && (
          <button
            onClick={onSpeak}
            className={cn(
              "flex items-center gap-1 text-xs px-2 py-1 rounded-full w-fit",
              "text-muted-foreground hover:text-gold transition-colors",
              isSpeaking && "text-gold"
            )}
            title={isSpeaking ? t('assistant.stopSpeaking') : t('assistant.speak')}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="h-3 w-3" />
                <span>{t('assistant.stopSpeaking')}</span>
              </>
            ) : (
              <>
                <Volume2 className="h-3 w-3" />
                <span>{t('assistant.speak')}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
