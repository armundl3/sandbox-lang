import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { ConversationSidebar } from './components/Sidebar/ConversationSidebar';
import { ChatInterface } from './components/Chat/ChatInterface';
import { useConversations } from './hooks/useConversations';

function App() {
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { addConversation, fetchConversations } = useConversations();

  const handleNewConversation = async (id: number) => {
    setCurrentConversationId(id);
    // Refresh conversations list to show the new conversation
    await fetchConversations();
  };

  const handleSelectConversation = (id: number | null) => {
    setCurrentConversationId(id);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <ConversationSidebar
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        isMobileOpen={isMobileSidebarOpen}
        onMobileToggle={toggleMobileSidebar}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMobileSidebar}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {currentConversationId ? 'Conversation' : 'New Chat'}
            </h1>
          </div>
        </header>

        {/* Chat Interface */}
        <div className="flex-1">
          <ChatInterface
            conversationId={currentConversationId}
            onNewConversation={handleNewConversation}
          />
        </div>
      </div>
    </div>
  );
}

export default App;