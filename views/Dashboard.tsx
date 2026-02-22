
import React from 'react';
import { AppState, InventoryItem, Message, Role } from '../types';
import InventoryView from './InventoryView';
import AdminView from './AdminView';
import MessageView from './MessageView';
import ReservationsView from './ReservationsView';

interface DashboardProps {
  activeTab: 'inventory' | 'admin' | 'messages' | 'reservations';
  state: AppState;
  isManager: boolean;
  onReserve: (id: string, quantity: number) => void;
  onCancel: (id: string) => void;
  onUpdateItem: (item: Omit<InventoryItem, 'id'> & { id?: string }) => void;
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
    case 'reservations':
      return (
        <ReservationsView 
          inventory={state.inventory}
          users={state.users}
          currentUserId={state.currentUser?.id || ''}
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
          messages={state.messages} 
          users={state.users}
          currentUserId={state.currentUser?.id || ''}
          onSendMessage={onSendMessage}
        />
      );
    default:
      return null;
  }
};

export default Dashboard;
