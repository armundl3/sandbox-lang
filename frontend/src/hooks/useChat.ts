import { useState, useCallback } from 'react';
import { Message } from '../types';
import { apiClient } from '../services/api';

export const useChat = (conversationId: number | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string): Promise<number | null> => {
    setIsLoading(true);
    
    // Add user message immediately
    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Create assistant message placeholder
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Stream response
      const stream = await apiClient.streamChat({
        message: content,
        conversation_id: conversationId
      });

      let newConversationId = conversationId;
      
      for await (const chunk of apiClient.parseSSEStream(stream)) {
        if (chunk.type === 'conversation_id') {
          newConversationId = chunk.conversation_id || null;
        } else if (chunk.type === 'content') {
          setMessages(prev => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage.role === 'assistant') {
              lastMessage.content += chunk.content || '';
            }
            return updated;
          });
        } else if (chunk.type === 'error') {
          console.error('Chat error:', chunk.error);
          setMessages(prev => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage.role === 'assistant') {
              lastMessage.content = `Error: ${chunk.error}`;
            }
            return updated;
          });
          break;
        } else if (chunk.type === 'done') {
          break;
        }
      }

      return newConversationId;
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => {
        const updated = [...prev];
        const lastMessage = updated[updated.length - 1];
        if (lastMessage.role === 'assistant') {
          lastMessage.content = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
        return updated;
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const loadConversation = useCallback(async (id: number) => {
    try {
      const conversation = await apiClient.getConversation(id);
      setMessages(conversation.messages || []);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { 
    messages, 
    sendMessage, 
    isLoading, 
    loadConversation, 
    clearMessages 
  };
};