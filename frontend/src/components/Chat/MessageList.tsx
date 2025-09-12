import React from 'react';
import { Message as MessageType } from '../../types';
import { Message } from './Message';

interface MessageListProps {
  messages: MessageType[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="space-y-0">
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
    </div>
  );
};