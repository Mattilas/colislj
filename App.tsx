
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, User, InventoryItem, Message, Role } from './types';
import { generatePseudonym } from './utils/storage';
import { supabase } from './lib/supabase';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import { Package, Users, MessageSquare, LogOut, ShieldCheck, ClipboardList, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    users: [],
    currentUser: null,
    inventory: [],
    messages: [],
    onlineUserIds: []
  });
  const [activeTab, setActiveTab] = useState<'inventory' | 'admin' | 'messages' | 'reservations'>(() => {
    const params = new URLSearchParams(window.location.search);
    const tabFromUrl = params.get('tab');
    if (tabFromUrl && ['inventory', 'admin', 'messages', 'reservations'].includes(tabFromUrl)) {
      return tabFromUrl as any;
    }
    const saved = localStorage.getItem('ecocolis_activeTab');
    return (saved as 'inventory' | 'admin' | 'messages' | 'reservations') || 'inventory';
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!window.history.state?.tab) {
      window.history.replaceState({ tab: activeTab }, '', `?tab=${activeTab}`);
    }

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.tab) {
        setActiveTab(e.state.tab);
      } else {
        const params = new URLSearchParams(window.location.search);
        const tabFromUrl = params.get('tab');
        if (tabFromUrl && ['inventory', 'admin', 'messages', 'reservations'].includes(tabFromUrl)) {
          setActiveTab(tabFromUrl as any);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    localStorage.setItem('ecocolis_activeTab', activeTab);
  }, [activeTab]);

  const handleTabChange = useCallback((tab: 'inventory' | 'admin' | 'messages' | 'reservations') => {
    if (tab !== activeTab) {
      window.history.pushState({ tab }, '', `?tab=${tab}`);
      setActiveTab(tab);
    }
  }, [activeTab]);

  // Demander la permission pour les notifications natives
  useEffect(() => {
    if (state.currentUser?.role === 'MANAGER' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [state.currentUser?.role]);

  // 1. Initial Load
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [invRes, usersRes, msgRes] = await Promise.all([
          supabase.from('inventory').select('*').order('name'),
          supabase.from('profiles').select('*'),
          supabase.from('messages').select('*').order('timestamp', { ascending: false })
        ]);

        const savedUserId = localStorage.getItem('ecocolis_user_id');
        const users = usersRes.data || [];
        const currentUser = savedUserId ? users.find(u => u.id === savedUserId) || null : null;

        setState(prev => ({
          ...prev,
          inventory: invRes.data || [],
          users: users,
          messages: msgRes.data || [],
          currentUser: currentUser
        }));
      } catch (err) {
        console.error("Erreur de chargement:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // 2. Realtime Subscriptions
    const inventorySub = supabase.channel('inventory-db-changes')
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'inventory' }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          setState(prev => ({ ...prev, inventory: [...prev.inventory, payload.new as InventoryItem] }));
        } else if (payload.eventType === 'UPDATE') {
          setState(prev => {
            const oldItem = prev.inventory.find(i => i.id === payload.new.id);
            const newItem = payload.new as InventoryItem;

            // Notification pour le gestionnaire si nouvelle réservation
            if (
              prev.currentUser?.role === 'MANAGER' &&
              oldItem &&
              !oldItem.reservedById &&
              newItem.reservedById &&
              newItem.reservedById !== prev.currentUser.id
            ) {
              const reserver = prev.users.find(u => u.id === newItem.reservedById);
              const reserverName = reserver ? reserver.pseudonym : 'Quelqu\'un';
              const title = 'Nouvelle réservation !';
              const body = `${reserverName} a réservé : ${newItem.name}`;
              
              toast.success(body, { icon: '📦', duration: 5000 });
              
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(title, { body });
              }
            }

            return { 
              ...prev, 
              inventory: prev.inventory.map(i => i.id === newItem.id ? newItem : i) 
            };
          });
        } else if (payload.eventType === 'DELETE') {
          setState(prev => ({ ...prev, inventory: prev.inventory.filter(i => i.id !== payload.old.id) }));
        }
      }).subscribe();

    const messagesSub = supabase.channel('messages-db-changes')
      .on('postgres_changes' as any, { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
        setState(prev => {
          const newMsg = payload.new as Message;
          
          // Notification si le message est pour l'utilisateur actuel
          if (prev.currentUser && newMsg.toUserId === prev.currentUser.id) {
            const sender = prev.users.find(u => u.id === newMsg.fromUserId);
            const senderName = sender ? sender.pseudonym : 'Utilisateur';
            const title = 'Nouveau message';
            const body = `${senderName} vous a envoyé un message.`;
            
            toast(body, { icon: '💬', duration: 4000 });
            
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(title, { body });
            }
          }
          
          return { ...prev, messages: [newMsg, ...prev.messages] };
        });
      })
      .on('postgres_changes' as any, { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload: any) => {
        setState(prev => ({
          ...prev,
          messages: prev.messages.map(m => m.id === payload.new.id ? payload.new as Message : m)
        }));
      })
      .subscribe();

    const profilesSub = supabase.channel('profiles-db-changes')
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'profiles' }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          setState(prev => ({ ...prev, users: [...prev.users, payload.new as User] }));
        } else if (payload.eventType === 'UPDATE') {
          setState(prev => {
            const updatedUser = payload.new as User;
            return {
              ...prev, 
              users: prev.users.map(u => u.id === updatedUser.id ? updatedUser : u),
              currentUser: prev.currentUser?.id === updatedUser.id ? updatedUser : prev.currentUser
            };
          });
        }
      }).subscribe();

    return () => {
      inventorySub.unsubscribe();
      messagesSub.unsubscribe();
      profilesSub.unsubscribe();
    };
  }, []);

  // 3. Presence Tracking
  useEffect(() => {
    if (!state.currentUser) return;

    const presenceChannel = supabase.channel('online-users', {
      config: {
        presence: {
          key: state.currentUser.id,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
        const onlineIds = Object.keys(newState);
        setState(prev => ({ ...prev, onlineUserIds: onlineIds }));
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('join', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('leave', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [state.currentUser?.id]);

  const handleLogin = useCallback(async (googlePayload: { sub: string, name: string, email: string }) => {
    // Vérifier si l'utilisateur existe
    let { data: userProfile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', googlePayload.sub)
      .single();
    
    if (!userProfile) {
      // Vérifier si c'est le premier utilisateur
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const isFirst = count === 0;

      const newUser: User = {
        id: googlePayload.sub,
        pseudonym: generatePseudonym(),
        role: isFirst ? 'MANAGER' : 'USER',
        isFirstUser: isFirst,
        avatarSeed: Math.random().toString(36).substr(2, 5),
      };

      const { data: created } = await supabase.from('profiles').insert(newUser).select().single();
      userProfile = created;
    }

    localStorage.setItem('ecocolis_user_id', userProfile.id);
    setState(prev => ({ ...prev, currentUser: userProfile }));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('ecocolis_user_id');
    setState(prev => ({ ...prev, currentUser: null }));
    setActiveTab('inventory');
  };

  const updateInventory = async (item: Omit<InventoryItem, 'id'> & { id?: string }) => {
    if (item.id) {
      const { error } = await supabase.from('inventory').update(item).eq('id', item.id);
      if (error) console.error("Erreur update:", error);
    } else {
      const { error } = await supabase.from('inventory').insert(item);
      if (error) console.error("Erreur insert:", error);
    }
  };

  const deleteItem = async (id: string) => {
    await supabase.from('inventory').delete().eq('id', id);
  };

  const handleReserve = async (itemId: string, quantity: number) => {
    if (!state.currentUser) return;
    const item = state.inventory.find(i => i.id === itemId);
    if (!item) return;

    // Check if the user already has a reservation for this exact item type
    const existingReservation = state.inventory.find(i => 
      i.reservedById === state.currentUser!.id && 
      i.name === item.name && 
      i.category === item.category && 
      i.description === item.description
    );

    if (quantity >= item.quantity) {
      if (existingReservation && existingReservation.id !== itemId) {
        // Add to existing reservation and delete the original item
        await supabase.from('inventory')
          .update({ quantity: existingReservation.quantity + item.quantity })
          .eq('id', existingReservation.id);
        await supabase.from('inventory')
          .delete()
          .eq('id', itemId);
      } else {
        // Just mark the original item as reserved
        await supabase.from('inventory')
          .update({ reservedById: state.currentUser.id })
          .eq('id', itemId);
      }
    } else {
      const remaining = item.quantity - quantity;
      
      // 1. Update original item's quantity
      await supabase.from('inventory')
        .update({ quantity: remaining })
        .eq('id', itemId);
        
      // 2. Update existing reservation or create new one
      if (existingReservation) {
        await supabase.from('inventory')
          .update({ quantity: existingReservation.quantity + quantity })
          .eq('id', existingReservation.id);
      } else {
        const { id, ...itemWithoutId } = item;
        await supabase.from('inventory')
          .insert({
            ...itemWithoutId,
            quantity: quantity,
            reservedById: state.currentUser.id
          });
      }
    }
  };

  const handleCancelReservation = async (itemId: string) => {
    const item = state.inventory.find(i => i.id === itemId);
    if (!item) return;

    const match = state.inventory.find(i => 
      i.id !== itemId && 
      i.reservedById === null && 
      i.name === item.name && 
      i.category === item.category && 
      i.description === item.description
    );

    if (match) {
      await supabase.from('inventory')
        .update({ quantity: match.quantity + item.quantity })
        .eq('id', match.id);
      await supabase.from('inventory')
        .delete()
        .eq('id', itemId);
    } else {
      await supabase.from('inventory')
        .update({ reservedById: null })
        .eq('id', itemId);
    }
  };

  const handleMarkDelivered = async (itemId: string) => {
    const item = state.inventory.find(i => i.id === itemId);
    if (!item) return;

    await supabase.from('inventory')
      .update({ category: `${item.category} [LIVRÉ]` })
      .eq('id', itemId);
  };

  const handleClearDeliveryHistory = async () => {
    const deliveredItems = state.inventory.filter(i => i.category.endsWith(' [LIVRÉ]'));
    if (deliveredItems.length === 0) return;

    const ids = deliveredItems.map(i => i.id);
    const { error } = await supabase.from('inventory').delete().in('id', ids);
    
    if (error) {
      console.error("Erreur lors du nettoyage:", error);
      toast.error("Erreur lors du nettoyage de l'historique");
    } else {
      toast.success("Historique nettoyé avec succès");
    }
  };

  const setRole = async (userId: string, role: Role) => {
    await supabase.from('profiles').update({ role }).eq('id', userId);
  };

  const transferManagerRole = async (newManagerId: string) => {
    if (!state.currentUser || !state.currentUser.isFirstUser) return;
    
    try {
      // 1. Update the new manager to be the primary manager
      await supabase.from('profiles').update({ isFirstUser: true, role: 'MANAGER' }).eq('id', newManagerId);
      
      // 2. Update the current user to no longer be the primary manager (but keep them as a co-manager)
      await supabase.from('profiles').update({ isFirstUser: false }).eq('id', state.currentUser.id);

      toast.success("Rôle de gestionnaire principal transféré avec succès");
    } catch (error) {
      console.error("Erreur lors du transfert de rôle:", error);
      toast.error("Erreur lors du transfert de rôle");
    }
  };

  const sendMessage = async (msg: Omit<Message, 'id' | 'timestamp' | 'isRead'>) => {
    const fullMsg = {
      ...msg,
      timestamp: Date.now(),
      isRead: false
    };
    await supabase.from('messages').insert(fullMsg);
  };

  const markMessagesAsRead = async (contactId: string) => {
    if (!state.currentUser) return;
    
    const unreadMessages = state.messages.filter(
      m => m.fromUserId === contactId && m.toUserId === state.currentUser!.id && !m.isRead
    );
    
    if (unreadMessages.length === 0) return;

    // Optimistic update
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(m => 
        (m.fromUserId === contactId && m.toUserId === prev.currentUser!.id && !m.isRead)
          ? { ...m, isRead: true }
          : m
      )
    }));

    // Update in DB
    const { error } = await supabase.from('messages')
      .update({ isRead: true })
      .in('id', unreadMessages.map(m => m.id));
      
    if (error) console.error("Erreur update messages:", error);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 text-emerald-600">
        <Loader2 className="animate-spin" size={48} />
        <p className="font-bold animate-pulse">Synchronisation EcoColis...</p>
      </div>
    );
  }

  if (!state.currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const isManager = state.currentUser.role === 'MANAGER';

  return (
    <div className="min-h-screen bg-slate-50 pt-16 pb-20 md:pb-0">
      <Toaster position="top-center" />
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-30 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
            <Package size={24} />
          </div>
          <h1 className="font-bold text-lg text-slate-800 tracking-tight hidden sm:block">EcoColis</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-700">{state.currentUser.pseudonym}</p>
            <p className="text-xs text-slate-400 flex items-center justify-end gap-1">
              {isManager && <ShieldCheck size={12} className="text-emerald-500" />}
              {isManager ? 'Gestionnaire' : 'Utilisateur'}
            </p>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 px-6 py-2 flex justify-around md:relative md:bottom-auto md:bg-transparent md:border-none md:justify-center md:gap-4 md:pt-8 md:pb-4">
        <NavButton active={activeTab === 'inventory'} onClick={() => handleTabChange('inventory')} icon={<Package size={20} />} label="Stocks" />
        <NavButton active={activeTab === 'reservations'} onClick={() => handleTabChange('reservations')} icon={<ClipboardList size={20} />} label="Suivi" />
        <NavButton 
          active={activeTab === 'messages'} 
          onClick={() => handleTabChange('messages')} 
          icon={<MessageSquare size={20} />} 
          label="Messages" 
          count={state.messages.filter(m => m.toUserId === state.currentUser?.id && !m.isRead).length} 
        />
        {isManager && <NavButton active={activeTab === 'admin'} onClick={() => handleTabChange('admin')} icon={<Users size={20} />} label="Équipe" />}
      </nav>

      <main className="max-w-4xl mx-auto w-full p-4 md:px-8 md:py-4">
        <Dashboard 
          activeTab={activeTab}
          state={state}
          isManager={isManager}
          onReserve={handleReserve}
          onCancel={handleCancelReservation}
          onUpdateItem={updateInventory}
          onDeleteItem={deleteItem}
          onSetRole={setRole}
          onTransferManagerRole={transferManagerRole}
          onSendMessage={sendMessage}
          onMarkMessagesAsRead={markMessagesAsRead}
          onMarkDelivered={handleMarkDelivered}
          onClearDeliveryHistory={handleClearDeliveryHistory}
        />
      </main>
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
  <button onClick={onClick} className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-4 py-2 rounded-xl transition-all ${active ? 'text-emerald-600 bg-emerald-50 md:bg-white md:shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
    <div className="relative">
      {icon}
      {count && count > 0 ? <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{count}</span> : null}
    </div>
    <span className="text-[10px] md:text-sm font-medium">{label}</span>
  </button>
);

export default App;
