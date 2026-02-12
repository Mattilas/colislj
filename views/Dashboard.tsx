
import React from 'react';
import { AppState, InventoryItem, Message, Role } from '../types';
import InventoryView from './InventoryView';
import AdminView from './AdminView';
import MessageView from './MessageView';

interface DashboardProps {
  activeTab: 'inventory' | 'admin' | 'messages';
  state: AppState;
  isManager: boolean;
  onReserve: (id: string) => void;
  onCancel: (id: string) => void;
  onUpdateItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onSetRole: (userId: string, role: Role) => void;
  onSendMessage: (msg: Omit<Message, 'id' | 'timestamp' | 'isRead'>) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  activeTab, state, isManager, onReserve, onCancel, 
  onUpdateItem, onDeleteItem, onSetRole, onSendMessage 
}) => {
  switch (activeTab) {
    case 'inventory':
      return (
        <InventoryView 
          inventory={state.inventory} 
          currentUserId={state.currentUser?.id || ''}
          isManager={isManager}
          onReserve={onReserve}
          onCancel={onCancel}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
        />
      );
    case 'admin':
      return isManager ? (
        <AdminView 
          users={state.users} 
          currentUserId={state.currentUser?.id || ''}
          onSetRole={onSetRole}
          onSendMessage={onSendMessage}
          inventory={state.inventory}
        />
      ) : <p>Accès refusé</p>;
    case 'messages':
      return (
        <MessageView 
          messages={state.messages.filter(m => m.toUserId === state.currentUser?.id || m.fromUserId === state.currentUser?.id)} 
          currentUserId={state.currentUser?.id || ''}
        />
      );
    default:
      return null;
  }
};

export default Dashboard;
