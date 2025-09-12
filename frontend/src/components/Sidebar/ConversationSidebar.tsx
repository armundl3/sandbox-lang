import React, { useState } from 'react';
import { Plus, Search, Menu, X } from 'lucide-react';
import { ConversationItem } from './ConversationItem';
import { useConversations } from '../../hooks/useConversations';
import { ThemeToggle } from '../UI/ThemeToggle';
import { LoadingSpinner } from '../UI/LoadingSpinner';

interface ConversationSidebarProps {
  currentConversationId: number | null;
  onSelectConversation: (id: number | null) => void;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  currentConversationId,
  onSelectConversation,
  isMobileOpen,
  onMobileToggle
}) => {
  const { conversations, isLoading, error, deleteConversation, fetchConversations } = useConversations();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewChat = () => {
    onSelectConversation(null);
    if (isMobileOpen) {
      onMobileToggle();
    }
  };

  const handleSelectConversation = (id: number) => {
    onSelectConversation(id);
    if (isMobileOpen) {
      onMobileToggle();
    }
  };

  const handleDeleteConversation = async (id: number) => {
    await deleteConversation(id);
    if (currentConversationId === id) {
      onSelectConversation(null);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 w-80 
        bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
        flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Chat History
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={onMobileToggle}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 
                     text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 
                       rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       placeholder-gray-500 dark:placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className="ml-2 text-sm text-gray-500">Loading conversations...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 text-sm mb-2">{error}</p>
              <button
                onClick={fetchConversations}
                className="text-blue-600 hover:text-blue-700 text-sm underline"
              >
                Try again
              </button>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {searchQuery ? 'No matching conversations' : 'No conversations yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={conversation.id === currentConversationId}
                  onSelect={handleSelectConversation}
                  onDelete={handleDeleteConversation}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};