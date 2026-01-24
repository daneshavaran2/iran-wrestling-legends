import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UseChatAssistantReturn {
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearHistory: () => void;
}

export const useChatAssistant = (): UseChatAssistantReturn => {
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await supabase.functions.invoke('museum-assistant', {
        body: {
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          language,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || t('assistant.error'));
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.content || response.data.message || t('assistant.error'),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : t('assistant.error'));
      
      // Add error message to chat
      const errorMessage: Message = {
        role: 'assistant',
        content: t('assistant.error'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, language, t]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    clearHistory,
  };
};
