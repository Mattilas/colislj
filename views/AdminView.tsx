
import React, { useState } from 'react';
import { User, Role, Message, InventoryItem } from '../types';
import { Shield, UserPlus, Send, Calendar, MapPin, AlertTriangle } from 'lucide-react';

interface AdminViewProps {
  users: User[];
  currentUserId: string;
  onSetRole: (id: string, role: Role) => void;
  onTransferManagerRole: (id: string) => void;
  onSendMessage: (msg: Omit<Message, 'id' | 'timestamp' | 'isRead'>) => void;
  inventory: InventoryItem[];
}

const AdminView: React.FC<AdminViewProps> = ({ users, currentUserId, onSetRole, onTransferManagerRole, onSendMessage, inventory }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageForm, setMessageForm] = useState(false);
  const [transferConfirmUser, setTransferConfirmUser] = useState<User | null>(null);

  const currentUser = users.find(u => u.id === currentUserId);
  const isFirstUser = currentUser?.isFirstUser || false;

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
    <div>
      <div className="fixed top-16 left-0 right-0 z-30 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-4xl mx-auto w-full px-4 md:px-8 pt-4 pb-4">
          <h2 className="text-2xl font-bold text-slate-900">Équipe & Utilisateurs</h2>
          <p className="text-slate-500 text-sm">Gérez les droits et communiquez avec les bénéficiaires</p>
        </div>
      </div>

      <div className="pt-[100px] space-y-8">
        {messageForm && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
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

      {transferConfirmUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4 text-amber-600">
              <AlertTriangle size={24} />
              <h3 className="text-xl font-bold">Transférer le rôle principal</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Êtes-vous sûr de vouloir transférer votre rôle de gestionnaire principal à <strong>{transferConfirmUser.pseudonym}</strong> ? 
              Vous deviendrez un co-gestionnaire et ne pourrez plus transférer ce rôle.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setTransferConfirmUser(null)}
                className="flex-1 py-3 text-slate-500 font-semibold bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={() => {
                  onTransferManagerRole(transferConfirmUser.id);
                  setTransferConfirmUser(null);
                }}
                className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl shadow-md hover:bg-amber-600 transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
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
                      {user.role === 'MANAGER' ? (user.isFirstUser ? 'Gestionnaire principal' : 'Co-gestionnaire') : 'Bénéficiaire'}
                      {userReservations.length > 0 && ` • ${userReservations.length} réservation(s)`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
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
                    <>
                      {isFirstUser && !user.isFirstUser && (
                        <button 
                          onClick={() => setTransferConfirmUser(user)}
                          className="flex-1 sm:flex-none py-2 px-4 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 flex items-center justify-center gap-2"
                        >
                          <Shield size={14} /> Transférer rôle principal
                        </button>
                      )}
                      <button 
                        onClick={() => onSetRole(user.id, 'USER')}
                        className="flex-1 sm:flex-none py-2 px-4 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={user.isFirstUser}
                      >
                        Retirer droits
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
};

export default AdminView;
