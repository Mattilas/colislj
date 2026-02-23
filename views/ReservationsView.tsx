
import React, { useState } from 'react';
import { InventoryItem, User } from '../types';
import { UserCircle, Package, ArrowRight, CheckCircle, Clock, Trash2, AlertTriangle } from 'lucide-react';

interface ReservationsViewProps {
  inventory: InventoryItem[];
  users: User[];
  currentUserId: string;
  isManager: boolean;
  onMarkDelivered: (itemId: string) => void;
  onClearDeliveryHistory: () => void;
}

const ReservationsView: React.FC<ReservationsViewProps> = ({ inventory, users, currentUserId, isManager, onMarkDelivered, onClearDeliveryHistory }) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const reservedItems = inventory.filter(item => item.reservedById !== null);
  
  const pendingItems = reservedItems.filter(item => !item.category.endsWith(' [LIVRÉ]'));
  const deliveredItems = reservedItems.filter(item => item.category.endsWith(' [LIVRÉ]'));

  const handleClearHistory = () => {
    onClearDeliveryHistory();
    setShowClearConfirm(false);
  };

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
          <>
            {pendingItems.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Clock size={16} /> En attente de récupération
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {pendingItems.map(item => {
                    const reserver = users.find(u => u.id === item.reservedById);
                    const isMine = item.reservedById === currentUserId;
                    const displayCategory = item.category.replace(' [LIVRÉ]', '');

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
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{displayCategory}</span>
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Qté: {item.quantity}</span>
                            </div>
                          </div>
                        </div>

                        <div className="hidden sm:block text-slate-300">
                          <ArrowRight size={20} />
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-2xl border border-slate-100 shadow-sm min-w-[200px] w-full sm:w-auto">
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
                          
                          {(isMine || isManager) && (
                            <button
                              onClick={() => onMarkDelivered(item.id)}
                              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-2xl font-bold text-sm transition-colors shadow-sm"
                            >
                              <CheckCircle size={18} />
                              Marquer récupéré
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {deliveredItems.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle size={16} /> Historique des livraisons
                  </h3>
                  {isManager && (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 size={14} /> Nettoyer l'historique
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 opacity-70">
                  {deliveredItems.map(item => {
                    const reserver = users.find(u => u.id === item.reservedById);
                    const isMine = item.reservedById === currentUserId;
                    const displayCategory = item.category.replace(' [LIVRÉ]', '');

                    return (
                      <div 
                        key={item.id} 
                        className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-2xl bg-slate-200 text-slate-400">
                            <CheckCircle size={24} />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-600 line-through">{item.name}</h3>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{displayCategory}</span>
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">Qté: {item.quantity}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 bg-white/50 px-4 py-2 rounded-2xl border border-slate-100">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px] bg-slate-300">
                            {reserver?.pseudonym[0] || '?'}
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase leading-none mb-1">Récupéré par</p>
                            <p className="text-xs font-bold text-slate-500">
                              {isMine ? 'Vous-même' : reserver?.pseudonym || 'Anonyme'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
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

      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Nettoyer l'historique ?</h3>
            <p className="text-slate-500 text-center text-sm mb-8">
              Cette action supprimera définitivement tous les articles marqués comme livrés. Cette opération est irréversible.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleClearHistory}
                className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
              >
                Confirmer la suppression
              </button>
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="w-full py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationsView;
