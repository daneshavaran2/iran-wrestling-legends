import { useState, useCallback, useRef } from 'react';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { answerOffline } from '@/lib/offlineAssistant';

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

/**
 * Detect language from user input text
 * Persian-specific chars: پ چ ژ گ ک
 * Arabic range: \u0600-\u06FF (includes Persian)
 */
function detectLanguage(text: string): Language {
  // Persian-specific characters (not in standard Arabic)
  const persianSpecific = /[پچژگک]/;
  // General Arabic/Persian range
  const arabicRange = /[\u0600-\u06FF]/;
  
  if (persianSpecific.test(text)) {
    return 'fa';
  }
  if (arabicRange.test(text)) {
    return 'ar';
  }
  return 'en';
}

export const useChatAssistant = (): UseChatAssistantReturn => {
  const { t } = useLanguage();
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

    // Detect language from user's message
    const detectedLanguage = detectLanguage(content.trim());

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    // Helper: stream a local string into the chat
    const streamLocal = async (text: string) => {
      let acc = '';
      let added = false;
      const chunks = text.match(/.{1,12}/gs) || [text];
      for (const c of chunks) {
        if (abortControllerRef.current?.signal.aborted) break;
        acc += c;
        setMessages(prev => {
          if (!added) {
            added = true;
            return [...prev, { role: 'assistant' as const, content: acc, timestamp: new Date(), isStreaming: true }];
          }
          return prev.map((m, i) =>
            i === prev.length - 1 && m.role === 'assistant' ? { ...m, content: acc } : m
          );
        });
        await new Promise(r => setTimeout(r, 12));
      }
      setMessages(prev =>
        prev.map((m, i) =>
          i === prev.length - 1 && m.role === 'assistant' ? { ...m, isStreaming: false } : m
        )
      );
    };

    // If browser reports offline, go straight to local assistant
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      try {
        const local = answerOffline(content.trim(), detectedLanguage);
        await streamLocal(local);
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
      return;
    }

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
          language: detectedLanguage, // Use detected language instead of system language
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
      // Network failure → fall back to offline assistant
      try {
        const local = answerOffline(content.trim(), detectedLanguage);
        await streamLocal(local);
      } catch {
        setError(err instanceof Error ? err.message : t('assistant.error'));
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: t('assistant.error'),
          timestamp: new Date(),
        }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, t]);

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
