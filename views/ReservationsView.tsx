
import React from 'react';
import { InventoryItem, User } from '../types';
import { UserCircle, Package, ArrowRight } from 'lucide-react';

interface ReservationsViewProps {
  inventory: InventoryItem[];
  users: User[];
  currentUserId: string;
}

const ReservationsView: React.FC<ReservationsViewProps> = ({ inventory, users, currentUserId }) => {
  const reservedItems = inventory.filter(item => item.reservedById !== null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Suivi des Réservations</h2>
        <p className="text-slate-500 text-sm">Transparence solidaire : voyez quel article est attribué à quel pseudonyme.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reservedItems.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
            <Package size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium opacity-50">Aucune réservation pour le moment</p>
          </div>
        ) : (
          reservedItems.map(item => {
            const reserver = users.find(u => u.id === item.reservedById);
            const isMine = item.reservedById === currentUserId;

            return (
              <div 
                key={item.id} 
                className={`bg-white p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-sm ${isMine ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${isMine ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Package size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{item.name}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.category}</span>
                  </div>
                </div>

                <div className="hidden sm:block text-slate-300">
                  <ArrowRight size={20} />
                </div>

                <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-2xl border border-slate-100 shadow-sm min-w-[200px]">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${isMine ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                    {reserver?.pseudonym[0] || '?'}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase leading-none mb-1">Réservé par</p>
                    <p className={`text-sm font-bold ${isMine ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {isMine ? 'Vous-même' : reserver?.pseudonym || 'Anonyme'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
        <div className="text-amber-500 shrink-0">
          <UserCircle size={20} />
        </div>
        <p className="text-xs text-amber-800 leading-relaxed">
          Le système de pseudonymisation garantit votre anonymat. Seuls les pseudonymes sont visibles publiquement pour permettre la gestion des stocks sans exposer les données personnelles.
        </p>
      </div>
    </div>
  );
};

export default ReservationsView;
