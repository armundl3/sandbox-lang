import React from 'react';
import { Message as MessageType } from '../../types';
import { CopyButton } from '../UI/CopyButton';
import { User, Bot } from 'lucide-react';

interface MessageProps {
  message: MessageType;
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex gap-3 p-4 ${
      message.role === 'assistant' ? 'bg-gray-50 dark:bg-gray-800' : ''
    }`}>
      <div className="flex-shrink-0">
        {message.role === 'user' ? (
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        ) : (
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm">
            {message.role === 'user' ? 'You' : 'Assistant'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTime(message.created_at)}
          </span>
        </div>
        
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <pre className="whitespace-pre-wrap font-sans text-gray-900 dark:text-gray-100">
            {message.content}
          </pre>
        </div>
        
        {message.content.trim() && (
          <div className="flex justify-end mt-2">
            <CopyButton text={message.content} />
          </div>
        )}
      </div>
    </div>
  );
};