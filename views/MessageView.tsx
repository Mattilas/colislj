
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Message, User } from '../types';
import { Send, User as UserIcon, MessageSquare, MapPin, Clock, ChevronLeft } from 'lucide-react';

interface MessageViewProps {
  messages: Message[];
  users: User[];
  currentUserId: string;
  onlineUserIds: string[];
  onSendMessage: (msg: Omit<Message, 'id' | 'timestamp' | 'isRead'>) => void;
  onMarkMessagesAsRead: (contactId: string) => void;
}

const MessageView: React.FC<MessageViewProps> = ({ messages, users, currentUserId, onlineUserIds, onSendMessage, onMarkMessagesAsRead }) => {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('contact');
  });
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.contactId) {
        setSelectedContactId(e.state.contactId);
      } else {
        setSelectedContactId(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleContactSelect = (id: string) => {
    window.history.pushState({ tab: 'messages', contactId: id }, '', `?tab=messages&contact=${id}`);
    setSelectedContactId(id);
  };

  const handleCloseChat = () => {
    window.history.pushState({ tab: 'messages' }, '', `?tab=messages`);
    setSelectedContactId(null);
  };

  const currentUser = useMemo(() => users.find(u => u.id === currentUserId), [users, currentUserId]);
  const isManager = currentUser?.role === 'MANAGER';

  // Trier les utilisateurs selon le rôle
  const contacts = useMemo(() => {
    const others = users.filter(u => u.id !== currentUserId);
    
    let filteredContacts = others;
    if (!isManager) {
      filteredContacts = others.filter(u => u.role === 'MANAGER');
    }
    
    return filteredContacts.sort((a, b) => {
      // 1. First user (Main Manager) comes first
      if (a.isFirstUser && !b.isFirstUser) return -1;
      if (!a.isFirstUser && b.isFirstUser) return 1;

      // 2. Other Managers (Co-managers) come next
      if (a.role === 'MANAGER' && b.role !== 'MANAGER') return -1;
      if (a.role !== 'MANAGER' && b.role === 'MANAGER') return 1;

      // 3. Alphabetical order within the same group
      return a.pseudonym.localeCompare(b.pseudonym);
    });
  }, [users, currentUserId, isManager]);

  // Messages liés à la conversation sélectionnée
  const activeConversationMessages = useMemo(() => {
    if (!selectedContactId) return [];
    return messages
      .filter(m => 
        (m.fromUserId === currentUserId && m.toUserId === selectedContactId) ||
        (m.fromUserId === selectedContactId && m.toUserId === currentUserId)
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [messages, selectedContactId, currentUserId]);

  const selectedContact = useMemo(() => 
    contacts.find(c => c.id === selectedContactId), 
    [contacts, selectedContactId]
  );

  const scrollToBottom = (instant = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: instant ? 'auto' : 'smooth',
        block: 'end'
      });
    }
  };

  // Scroll to bottom when messages change or contact is selected
  useEffect(() => {
    if (selectedContactId) {
      // Small delay to ensure DOM is ready and layout is stable
      const timer = setTimeout(() => scrollToBottom(false), 100);
      return () => clearTimeout(timer);
    }
  }, [activeConversationMessages.length, selectedContactId]);

  // Instant scroll on first load of a conversation
  useEffect(() => {
    if (selectedContactId) {
      scrollToBottom(true);
    }
  }, [selectedContactId]);

  // Marquer les messages comme lus quand on sélectionne un contact
  useEffect(() => {
    if (selectedContactId) {
      const hasUnread = messages.some(
        m => m.fromUserId === selectedContactId && m.toUserId === currentUserId && !m.isRead
      );
      if (hasUnread) {
        onMarkMessagesAsRead(selectedContactId);
      }
    }
  }, [selectedContactId, messages, currentUserId, onMarkMessagesAsRead]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactId || !inputText.trim()) return;

    onSendMessage({
      toUserId: selectedContactId,
      fromUserId: currentUserId,
      content: inputText.trim(),
    });
    setInputText('');
  };

  const formatMessageDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Hier";
    } else {
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Liste des contacts avec indicateur de dernier message
  const ContactList = () => (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Contacts</h3>
      {contacts.length === 0 ? (
        <p className="text-slate-400 text-sm italic px-2">Personne d'autre n'est connecté.</p>
      ) : (
        contacts.map(contact => {
          const lastMsg = messages
            .filter(m => (m.fromUserId === contact.id && m.toUserId === currentUserId) || (m.fromUserId === currentUserId && m.toUserId === contact.id))
            .sort((a, b) => b.timestamp - a.timestamp)[0];

          const unreadCount = messages.filter(
            m => m.fromUserId === contact.id && m.toUserId === currentUserId && !m.isRead
          ).length;

          const isOnline = onlineUserIds.includes(contact.id);

          return (
            <button
              key={contact.id}
              onClick={() => handleContactSelect(contact.id)}
              className={`flex items-center gap-3 p-3 rounded-2xl transition-all text-left relative ${
                selectedContactId === contact.id ? 'bg-emerald-600 text-white shadow-md' : 'bg-white hover:bg-slate-100 border border-slate-100'
              }`}
            >
              <div className="relative shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  selectedContactId === contact.id ? 'bg-white/20' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {contact.pseudonym[0]}
                </div>
                {isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              <div className="overflow-hidden flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold truncate text-sm">{contact.pseudonym}</p>
                  {contact.role === 'MANAGER' && (
                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md whitespace-nowrap ${
                      selectedContactId === contact.id ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {contact.isFirstUser ? 'Gestionnaire' : 'Co-gestionnaire'}
                    </span>
                  )}
                </div>
                {lastMsg && (
                  <p className={`text-[10px] truncate opacity-70 ${selectedContactId === contact.id ? 'text-white' : 'text-slate-500'}`}>
                    {lastMsg.content}
                  </p>
                )}
              </div>
              {unreadCount > 0 && (
                <div className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {unreadCount}
                </div>
              )}
            </button>
          );
        })
      )}
    </div>
  );

  return (
    <div className="h-[calc(100vh-12rem)] md:h-[600px] flex flex-col md:flex-row gap-6">
      {/* Sidebar / Liste des contacts */}
      <div className={`${selectedContactId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-64 shrink-0`}>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-slate-900">Messages</h2>
          <p className="text-slate-500 text-sm">Discutez avec les autres membres</p>
        </div>
        <div className="overflow-y-auto pr-2">
          <ContactList />
        </div>
      </div>

      {/* Fenêtre de Chat */}
      <div className={`${!selectedContactId ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden`}>
        {selectedContactId && selectedContact ? (
          <>
            {/* Header du Chat */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleCloseChat} 
                  className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xs">
                  {selectedContact.pseudonym[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 text-sm">{selectedContact.pseudonym}</h4>
                    {selectedContact.role === 'MANAGER' && (
                      <span className="text-[8px] font-bold uppercase bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md">
                        {selectedContact.isFirstUser ? 'Gestionnaire' : 'Co-gestionnaire'}
                      </span>
                    )}
                  </div>
                  {onlineUserIds.includes(selectedContact.id) ? (
                    <p className="text-[10px] text-emerald-500 font-medium tracking-wide uppercase mt-0.5">En ligne</p>
                  ) : (
                    <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">Hors ligne</p>
                  )}
                </div>
              </div>
            </div>

            {/* Zone des messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
              {activeConversationMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
                  <MessageSquare size={40} className="mb-2" />
                  <p className="text-sm font-medium">C'est le début de votre conversation.</p>
                </div>
              ) : (
                <>
                  {activeConversationMessages.map((msg, index) => {
                    const isMine = msg.fromUserId === currentUserId;
                    const prevMsg = activeConversationMessages[index - 1];
                    const showDateSeparator = !prevMsg || 
                      new Date(prevMsg.timestamp).toDateString() !== new Date(msg.timestamp).toDateString();

                    return (
                      <React.Fragment key={msg.id}>
                        {showDateSeparator && (
                          <div className="flex justify-center my-6">
                            <span className="bg-slate-200/50 text-slate-500 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-sm">
                              {formatMessageDate(msg.timestamp)}
                            </span>
                          </div>
                        )}
                        <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                            isMine ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none shadow-sm'
                          }`}>
                            {/* Affichage spécial pour les instructions logistiques */}
                            {(msg.location || msg.pickupTime) && (
                              <div className={`mb-2 p-2 rounded-xl text-xs space-y-1 ${isMine ? 'bg-white/10' : 'bg-slate-50'}`}>
                                {msg.location && <p className="flex items-center gap-1"><MapPin size={12}/> {msg.location}</p>}
                                {msg.pickupTime && <p className="flex items-center gap-1"><Clock size={12}/> {msg.pickupTime}</p>}
                              </div>
                            )}
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <span className="text-[9px] text-slate-400 mt-1 px-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input d'envoi */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Écrivez votre message..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-emerald-600 text-white p-3 rounded-2xl shadow-md hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-slate-800 font-bold mb-1">Sélectionnez une conversation</h3>
            <p className="text-sm max-w-[240px]">Choisissez un membre de l'équipe pour commencer à discuter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageView;
