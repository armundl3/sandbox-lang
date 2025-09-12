import React, { useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChat } from '../../hooks/useChat';
import { LoadingSpinner } from '../UI/LoadingSpinner';

interface ChatInterfaceProps {
  conversationId: number | null;
  onNewConversation: (id: number) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId,
  onNewConversation
}) => {
  const { messages, sendMessage, isLoading, loadConversation, clearMessages } = useChat(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      clearMessages();
    }
  }, [conversationId, loadConversation, clearMessages]);

  const handleSendMessage = async (content: string) => {
    const newConversationId = await sendMessage(content);
    if (!conversationId && newConversationId) {
      onNewConversation(newConversationId);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center max-w-md px-4">
              <h2 className="text-2xl font-semibold mb-2">Start a conversation</h2>
              <p>Type a message below to begin chatting with your local AI model</p>
            </div>
          </div>
        ) : (
          <>
            <MessageList messages={messages} />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <MessageInput 
          onSendMessage={handleSendMessage}
          disabled={isLoading}
        />
        {isLoading && (
          <div className="flex items-center justify-center mt-2">
            <LoadingSpinner />
            <span className="ml-2 text-sm text-gray-500">AI is thinking...</span>
          </div>
        )}
      </div>
    </div>
  );
};