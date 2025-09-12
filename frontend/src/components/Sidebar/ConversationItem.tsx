import React, { useState } from 'react';
import { Conversation } from '../../types';
import { Trash2, MessageSquare } from 'lucide-react';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onSelect,
  onDelete
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showDeleteConfirm) {
      onDelete(conversation.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <div
      className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
        isActive 
          ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      onClick={() => onSelect(conversation.id)}
    >
      <div className="flex items-start gap-3">
        <MessageSquare className="w-4 h-4 mt-0.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
            {conversation.title}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatDate(conversation.updated_at)}
          </div>
        </div>

        <button
          onClick={handleDelete}
          className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-all ${
            showDeleteConfirm ? 'opacity-100 bg-red-100 dark:bg-red-900/30' : ''
          }`}
          title={showDeleteConfirm ? 'Click again to confirm' : 'Delete conversation'}
        >
          <Trash2 className={`w-3 h-3 ${
            showDeleteConfirm ? 'text-red-600 dark:text-red-400' : 'text-gray-400'
          }`} />
        </button>
      </div>
    </div>
  );
};