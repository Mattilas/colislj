
import React, { useState, useMemo } from 'react';
import { InventoryItem, User } from '../types';
import { UserCircle, Package, ArrowRight, CheckCircle, Clock, Trash2, AlertTriangle, BarChart3, X, Calendar, Download } from 'lucide-react';

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
  const [showReport, setShowReport] = useState(false);
  const reservedItems = inventory.filter(item => item.reservedById !== null);
  
  const pendingItems = reservedItems.filter(item => !item.category.includes('[LIVRÉ]'));
  const deliveredItems = reservedItems.filter(item => item.category.includes('[LIVRÉ]'));

  const handleClearHistory = () => {
    onClearDeliveryHistory();
    setShowClearConfirm(false);
  };

  const reportData = useMemo(() => {
    if (!isManager) return null;
    
    const report: Record<string, Record<string, number>> = {};
    
    deliveredItems.forEach(item => {
      const match = item.category.match(/\[LIVRÉ\]\s*([^\s\[]+)/);
      const dateStr = match && match[1] ? match[1] : null;
      const date = dateStr ? new Date(dateStr) : new Date();
      
      const monthYear = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      const key = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
      
      if (!report[key]) {
        report[key] = {};
      }
      
      if (!report[key][item.name]) {
        report[key][item.name] = 0;
      }
      
      report[key][item.name] += item.quantity;
    });
    
    return report;
  }, [deliveredItems, isManager]);

  const handleExportCSV = () => {
    if (!reportData) return;

    const headers = ['Mois', 'Article', 'Nombre'];
    const rows: string[] = [];
    
    rows.push(headers.join(';'));
    
    Object.entries(reportData).sort((a, b) => b[0].localeCompare(a[0])).forEach(([monthYear, items]) => {
      Object.entries(items).sort((a, b) => b[1] - a[1]).forEach(([itemName, quantity]) => {
        const safeItemName = `"${itemName.replace(/"/g, '""')}"`;
        rows.push(`"${monthYear}";${safeItemName};${quantity}`);
      });
    });
    
    const csvContent = rows.join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rapport_livraisons_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="fixed top-16 left-0 right-0 z-30 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-4xl mx-auto w-full px-4 md:px-8 pt-4 pb-4">
          <h2 className="text-2xl font-bold text-slate-900">Suivi des Réservations</h2>
          <p className="text-slate-500 text-sm">Transparence solidaire : voyez quel article est attribué à quel pseudonyme.</p>
        </div>
      </div>

      <div className="pt-[100px] grid grid-cols-1 gap-4">
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
                    const displayCategory = item.category.split(' [LIVRÉ]')[0];
                    const reservationDate = item.reservedAt 
                      ? new Date(item.reservedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) 
                      : null;

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
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{displayCategory}</span>
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Qté: {item.quantity}</span>
                              {reservationDate && (
                                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                  <Clock size={10}/> {reservationDate}
                                </span>
                              )}
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowReport(true)}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <BarChart3 size={14} /> Rapport
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(true)}
                        className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 size={14} /> Nettoyer
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 opacity-70">
                  {deliveredItems.map(item => {
                    const reserver = users.find(u => u.id === item.reservedById);
                    const isMine = item.reservedById === currentUserId;
                    const displayCategory = item.category.replace(/\[LIVRÉ\].*/, '').trim();
                    
                    const match = item.category.match(/\[LIVRÉ\]\s*([^\s\[]+)/);
                    const dateStr = match && match[1] ? match[1] : null;
                    const date = dateStr ? new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Date inconnue';
                    
                    const reservationDate = item.reservedAt 
                      ? new Date(item.reservedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) 
                      : null;

                    return (
                      <div 
                        key={item.id} 
                        className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-2xl bg-slate-200 text-slate-400 flex flex-col items-center justify-center">
                            <CheckCircle size={24} />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-600 line-through">{item.name}</h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{displayCategory}</span>
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">Qté: {item.quantity}</span>
                              {reservationDate && (
                                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1" title="Date de réservation">
                                  <Calendar size={10}/> {reservationDate}
                                </span>
                              )}
                              <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1" title="Date de livraison">
                                <Clock size={10}/> {date}
                              </span>
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

      {showReport && reportData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in duration-200">
            <div className="mb-6 sticky top-0 bg-white pb-4 border-b border-slate-100">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-emerald-600">
                    <div className="p-3 bg-emerald-50 rounded-2xl">
                      <BarChart3 size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Rapport des livraisons</h3>
                  </div>
                  <button 
                    onClick={handleExportCSV}
                    className="w-fit p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors flex items-center gap-2 text-sm font-bold px-4 border border-emerald-100"
                  >
                    <Download size={16} /> Exporter CSV
                  </button>
                </div>
                <button 
                  onClick={() => setShowReport(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="space-y-8">
              {Object.keys(reportData).length === 0 ? (
                <p className="text-center text-slate-500 py-8">Aucune donnée disponible pour le rapport.</p>
              ) : (
                Object.entries(reportData).sort((a, b) => b[0].localeCompare(a[0])).map(([monthYear, items]) => (
                  <div key={monthYear} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <h4 className="text-lg font-bold text-slate-800 mb-4 capitalize flex items-center gap-2">
                      <Calendar size={18} className="text-emerald-500"/> {monthYear}
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(items).sort((a, b) => b[1] - a[1]).map(([itemName, quantity]) => (
                        <div key={itemName} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                          <span className="font-medium text-slate-700">{itemName}</span>
                          <span className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                            {quantity} distribué{quantity > 1 ? 's' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationsView;
