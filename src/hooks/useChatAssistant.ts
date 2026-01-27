import { useState, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface UseChatAssistantReturn {
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearHistory: () => void;
  stopStreaming: () => void;
}

export const useChatAssistant = (): UseChatAssistantReturn => {
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

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

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/museum-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          language,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t('assistant.error'));
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Streaming read
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let assistantMessageAdded = false;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          
          if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
          if (!trimmedLine.startsWith('data: ')) continue;
          
          try {
            const jsonStr = trimmedLine.slice(6);
            const json = JSON.parse(jsonStr);
            const delta = json.choices?.[0]?.delta?.content;
            
            if (delta) {
              assistantContent += delta;

              // Update message in real-time
              setMessages(prev => {
                if (!assistantMessageAdded) {
                  assistantMessageAdded = true;
                  return [...prev, {
                    role: 'assistant' as const,
                    content: assistantContent,
                    timestamp: new Date(),
                    isStreaming: true,
                  }];
                }
                
                // Update the last message
                return prev.map((m, i) => 
                  i === prev.length - 1 && m.role === 'assistant'
                    ? { ...m, content: assistantContent }
                    : m
                );
              });
            }
          } catch (e) {
            // Skip invalid JSON lines
            console.debug('Skipping invalid JSON:', trimmedLine);
          }
        }
      }

      // Process any remaining buffer content
      if (buffer.trim() && buffer.startsWith('data: ') && buffer !== 'data: [DONE]') {
        try {
          const json = JSON.parse(buffer.slice(6));
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            assistantContent += delta;
          }
        } catch (e) {
          // Ignore
        }
      }

      // Mark streaming as complete
      setMessages(prev => 
        prev.map((m, i) => 
          i === prev.length - 1 && m.role === 'assistant'
            ? { ...m, isStreaming: false }
            : m
        )
      );

      // If no content was received, add error message
      if (!assistantContent) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: t('assistant.error'),
          timestamp: new Date(),
        }]);
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled
        return;
      }
      
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : t('assistant.error'));
      
      // Add error message to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: t('assistant.error'),
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, language, t]);

  const clearHistory = useCallback(() => {
    stopStreaming();
    setMessages([]);
    setError(null);
  }, [stopStreaming]);

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    clearHistory,
    stopStreaming,
  };
};
