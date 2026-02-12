
import React, { useState } from 'react';
import { User, Role, Message, InventoryItem } from '../types';
import { Shield, UserPlus, Send, Calendar, MapPin } from 'lucide-react';

interface AdminViewProps {
  users: User[];
  currentUserId: string;
  onSetRole: (id: string, role: Role) => void;
  onSendMessage: (msg: Omit<Message, 'id' | 'timestamp' | 'isRead'>) => void;
  inventory: InventoryItem[];
}

const AdminView: React.FC<AdminViewProps> = ({ users, currentUserId, onSetRole, onSendMessage, inventory }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageForm, setMessageForm] = useState(false);

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) return;
    const formData = new FormData(e.currentTarget);
    onSendMessage({
      toUserId: selectedUser.id,
      fromUserId: currentUserId,
      content: formData.get('content') as string,
      location: formData.get('location') as string,
      pickupTime: formData.get('time') as string,
    });
    setMessageForm(false);
    setSelectedUser(null);
  };

  const otherUsers = users.filter(u => u.id !== currentUserId);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Équipe & Utilisateurs</h2>
        <p className="text-slate-500 text-sm">Gérez les droits et communiquez avec les bénéficiaires</p>
      </div>

      {messageForm && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleSendMessage}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-8 duration-300"
          >
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">
                  {selectedUser.pseudonym[0]}
               </div>
               <h3 className="text-xl font-bold">Message à {selectedUser.pseudonym}</h3>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input 
                  name="location" 
                  placeholder="Lieu de retrait (ex: Entrepôt Nord)" 
                  required 
                  className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input 
                  name="time" 
                  placeholder="Date et Heure (ex: Demain 14h)" 
                  required 
                  className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>
              <textarea 
                name="content" 
                placeholder="Instructions complémentaires..." 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]" 
              />
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                type="button" 
                onClick={() => setMessageForm(false)}
                className="flex-1 py-3 text-slate-500 font-semibold"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
              >
                Envoyer <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {otherUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 italic">
              Aucun autre utilisateur connecté pour le moment.
            </div>
          ) : otherUsers.map(user => {
            const userReservations = inventory.filter(i => i.reservedById === user.id);
            return (
              <div key={user.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-bold shadow-sm">
                    {user.pseudonym[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{user.pseudonym}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      {user.role === 'MANAGER' ? <Shield size={10} className="text-emerald-500" /> : null}
                      {user.role === 'MANAGER' ? 'Co-gestionnaire' : 'Bénéficiaire'}
                      {userReservations.length > 0 && ` • ${userReservations.length} réservation(s)`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setSelectedUser(user); setMessageForm(true); }}
                    className="flex-1 sm:flex-none py-2 px-4 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm flex items-center justify-center gap-2"
                  >
                    <Send size={14} /> Instructions
                  </button>
                  {user.role !== 'MANAGER' ? (
                    <button 
                      onClick={() => onSetRole(user.id, 'MANAGER')}
                      className="flex-1 sm:flex-none py-2 px-4 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl hover:bg-emerald-100 flex items-center justify-center gap-2"
                    >
                      <UserPlus size={14} /> Nommer Co-gestionnaire
                    </button>
                  ) : (
                    <button 
                      onClick={() => onSetRole(user.id, 'USER')}
                      className="flex-1 sm:flex-none py-2 px-4 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100"
                    >
                      Retirer droits
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminView;
