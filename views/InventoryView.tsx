
import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { Plus, Trash2, Edit3, CheckCircle, XCircle, PackageOpen } from 'lucide-react';

interface InventoryViewProps {
  inventory: InventoryItem[];
  currentUserId: string;
  isManager: boolean;
  onReserve: (id: string) => void;
  onCancel: (id: string) => void;
  onUpdateItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
}

const InventoryView: React.FC<InventoryViewProps> = ({ 
  inventory, currentUserId, isManager, onReserve, onCancel, onUpdateItem, onDeleteItem 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const item: InventoryItem = {
      id: editingItem?.id || Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      quantity: Number(formData.get('quantity')),
      reservedById: editingItem?.reservedById || null,
    };
    onUpdateItem(item);
    setShowForm(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Inventaire</h2>
          <p className="text-slate-500 text-sm">Consultez et réservez des colis</p>
        </div>
        {isManager && (
          <button 
            onClick={() => setShowForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-2xl shadow-lg transition-transform active:scale-95"
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200"
          >
            <h3 className="text-xl font-bold mb-4">{editingItem ? 'Modifier' : 'Ajouter'} un article</h3>
            <div className="space-y-4">
              <input 
                name="name" 
                defaultValue={editingItem?.name}
                placeholder="Nom de l'article" 
                required 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
              />
              <input 
                name="category" 
                defaultValue={editingItem?.category}
                placeholder="Catégorie (Frais, Sec, etc.)" 
                required 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
              />
              <textarea 
                name="description" 
                defaultValue={editingItem?.description}
                placeholder="Description" 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
              />
              <input 
                name="quantity" 
                type="number" 
                defaultValue={editingItem?.quantity || 1}
                placeholder="Quantité" 
                required 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                type="button" 
                onClick={() => { setShowForm(false); setEditingItem(null); }}
                className="flex-1 py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-md hover:bg-emerald-700"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {inventory.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 opacity-50">
            <PackageOpen size={64} className="mb-4" />
            <p className="text-lg">L'inventaire est vide</p>
          </div>
        ) : inventory.map(item => (
          <ItemCard 
            key={item.id} 
            item={item} 
            currentUserId={currentUserId}
            isManager={isManager}
            onReserve={() => onReserve(item.id)}
            onCancel={() => onCancel(item.id)}
            onEdit={() => { setEditingItem(item); setShowForm(true); }}
            onDelete={() => onDeleteItem(item.id)}
          />
        ))}
      </div>
    </div>
  );
};

interface ItemCardProps {
  item: InventoryItem;
  currentUserId: string;
  isManager: boolean;
  onReserve: () => void;
  onCancel: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, currentUserId, isManager, onReserve, onCancel, onEdit, onDelete }) => {
  const isReserved = item.reservedById !== null;
  const isMine = item.reservedById === currentUserId;

  return (
    <div className={`relative bg-white p-5 rounded-3xl border transition-all ${isMine ? 'border-emerald-500 ring-4 ring-emerald-50 shadow-lg' : 'border-slate-100 shadow-sm'}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          {item.category}
        </span>
        <div className="flex gap-1">
          {isManager && (
            <>
              <button onClick={onEdit} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"><Edit3 size={16} /></button>
              <button onClick={onDelete} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
            </>
          )}
        </div>
      </div>
      
      <h3 className="font-bold text-slate-800 text-lg">{item.name}</h3>
      <p className="text-slate-500 text-sm mb-4 line-clamp-2">{item.description}</p>
      
      <div className="flex items-center justify-between mt-auto">
        <span className="text-xs font-medium text-slate-400">Restant: {item.quantity}</span>
        
        {isReserved ? (
          isMine ? (
            <button 
              onClick={onCancel}
              className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 px-4 py-2 rounded-xl border border-red-100 transition-all hover:bg-red-100"
            >
              <XCircle size={14} /> Annuler
            </button>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              Indisponible
            </span>
          )
        ) : (
          <button 
            onClick={onReserve}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-white px-4 py-2 rounded-xl border border-emerald-100 shadow-sm transition-all hover:bg-emerald-50"
          >
            <CheckCircle size={14} /> Réserver
          </button>
        )}
      </div>

      {isMine && (
        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg">
          <CheckCircle size={14} />
        </div>
      )}
    </div>
  );
};

export default InventoryView;
