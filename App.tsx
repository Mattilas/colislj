
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, User, InventoryItem, Message, Role } from './types';
import { loadState, saveState, generatePseudonym } from './utils/storage';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import { Package, Users, MessageSquare, LogOut, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(loadState());
  const [activeTab, setActiveTab] = useState<'inventory' | 'admin' | 'messages'>('inventory');

  // Persist state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  const handleLogin = useCallback(() => {
    const isFirst = state.users.length === 0;
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      pseudonym: generatePseudonym(),
      role: isFirst ? 'MANAGER' : 'USER',
      isFirstUser: isFirst,
      avatarSeed: Math.random().toString(36).substr(2, 5),
    };

    setState(prev => ({
      ...prev,
      users: [...prev.users, newUser],
      currentUser: newUser
    }));
  }, [state.users.length]);

  const handleLogout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
    setActiveTab('inventory');
  };

  const updateInventory = (newItem: InventoryItem) => {
    setState(prev => ({
      ...prev,
      inventory: prev.inventory.find(i => i.id === newItem.id) 
        ? prev.inventory.map(i => i.id === newItem.id ? newItem : i)
        : [...prev.inventory, newItem]
    }));
  };

  const deleteItem = (id: string) => {
    setState(prev => ({
      ...prev,
      inventory: prev.inventory.filter(i => i.id !== id)
    }));
  };

  const handleReserve = (itemId: string) => {
    if (!state.currentUser) return;
    setState(prev => ({
      ...prev,
      inventory: prev.inventory.map(i => 
        i.id === itemId ? { ...i, reservedById: state.currentUser!.id } : i
      )
    }));
  };

  const handleCancelReservation = (itemId: string) => {
    setState(prev => ({
      ...prev,
      inventory: prev.inventory.map(i => 
        i.id === itemId ? { ...i, reservedById: null } : i
      )
    }));
  };

  const setRole = (userId: string, role: Role) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, role } : u)
    }));
  };

  const sendMessage = (msg: Omit<Message, 'id' | 'timestamp' | 'isRead'>) => {
    const fullMsg: Message = {
      ...msg,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      isRead: false
    };
    setState(prev => ({
      ...prev,
      messages: [fullMsg, ...prev.messages]
    }));
  };

  if (!state.currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const isManager = state.currentUser.role === 'MANAGER';

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0 md:pt-16">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-30 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
            <Package size={24} />
          </div>
          <h1 className="font-bold text-lg text-slate-800 tracking-tight hidden sm:block">EcoColis</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-700">{state.currentUser.pseudonym}</p>
            <p className="text-xs text-slate-400 flex items-center justify-end gap-1">
              {isManager && <ShieldCheck size={12} className="text-emerald-500" />}
              {isManager ? 'Gestionnaire' : 'Utilisateur'}
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <Dashboard 
          activeTab={activeTab}
          state={state}
          isManager={isManager}
          onReserve={handleReserve}
          onCancel={handleCancelReservation}
          onUpdateItem={updateInventory}
          onDeleteItem={deleteItem}
          onSetRole={setRole}
          onSendMessage={sendMessage}
        />
      </main>

      {/* Navigation (Mobile Bottom / Desktop side could be added but bottom is better for mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 px-6 py-2 flex justify-around md:top-16 md:bottom-auto md:h-fit md:bg-transparent md:border-none md:justify-center md:gap-4">
        <NavButton 
          active={activeTab === 'inventory'} 
          onClick={() => setActiveTab('inventory')}
          icon={<Package size={20} />}
          label="Stocks"
        />
        <NavButton 
          active={activeTab === 'messages'} 
          onClick={() => setActiveTab('messages')}
          icon={<MessageSquare size={20} />}
          label="Messages"
          count={state.messages.filter(m => m.toUserId === state.currentUser?.id && !m.isRead).length}
        />
        {isManager && (
          <NavButton 
            active={activeTab === 'admin'} 
            onClick={() => setActiveTab('admin')}
            icon={<Users size={20} />}
            label="Équipe"
          />
        )}
      </nav>
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label, count }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-4 py-2 rounded-xl transition-all ${
      active 
        ? 'text-emerald-600 bg-emerald-50 md:bg-white md:shadow-sm' 
        : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    <div className="relative">
      {icon}
      {count && count > 0 ? (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
          {count}
        </span>
      ) : null}
    </div>
    <span className="text-[10px] md:text-sm font-medium">{label}</span>
  </button>
);

export default App;
