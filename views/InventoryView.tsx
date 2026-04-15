
import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { Plus, Trash2, Edit3, CheckCircle, XCircle, PackageOpen, ChevronDown, Search, Filter } from 'lucide-react';

interface InventoryViewProps {
  inventory: InventoryItem[];
  currentUserId: string;
  isManager: boolean;
  onReserve: (id: string, quantity: number) => void;
  onCancel: (id: string) => void;
  onUpdateItem: (item: Omit<InventoryItem, 'id'> & { id?: string }) => void;
  onDeleteItem: (id: string) => void;
}

const InventoryView: React.FC<InventoryViewProps> = ({ 
  inventory, currentUserId, isManager, onReserve, onCancel, onUpdateItem, onDeleteItem 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('Tous');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const item: Omit<InventoryItem, 'id'> & { id?: string } = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      quantity: Number(formData.get('quantity')),
      reservedById: editingItem?.reservedById || null,
    };
    
    if (editingItem?.id) {
      item.id = editingItem.id;
    }
    
    onUpdateItem(item);
    setShowForm(false);
    setEditingItem(null);
  };

  const uniqueNames = Array.from(new Set(
    inventory
      .filter(item => !item.category.includes('[LIVRÉ]'))
      .map(item => item.name)
  )).sort((a, b) => a.localeCompare(b));

  const activeInventory = inventory
    .filter(item => !item.category.includes('[LIVRÉ]'))
    .filter(item => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        item.name.toLowerCase().includes(searchLower) || 
        item.description.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower);
      const matchesCategory = filterCategory === 'Tous' || item.name === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Priority groups:
      // 1. Available (reservedById === null && quantity > 0)
      // 2. Reserved (reservedById !== null)
      // 3. Unavailable (reservedById === null && quantity === 0)
      
      const getPriority = (item: typeof a) => {
        // 1. Available for everyone
        if (item.reservedById === null && item.quantity > 0) return 1;
        // 2. Reserved by current user
        if (item.reservedById === currentUserId) return 2;
        // 3. Reserved by others (shows as "indisponible")
        if (item.reservedById !== null) return 3;
        // 4. Truly out of stock
        return 4;
      };

      const priorityA = getPriority(a);
      const priorityB = getPriority(b);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Within same priority, sort alphabetically by name
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="pb-6">
      <div className="fixed top-16 left-0 right-0 z-30 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-4xl mx-auto w-full px-4 md:px-8 pt-4 pb-4">
          <div className="flex items-center justify-between mb-4">
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
          
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher un article..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm shadow-sm"
              />
            </div>
            <div className="relative w-1/3 min-w-[120px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer text-sm shadow-sm"
              >
                <option value="Tous">Tous</option>
                {uniqueNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-[140px]">
        {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
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
              <div className="relative">
                <select 
                  name="category" 
                  defaultValue={editingItem?.category || "Sec"}
                  required 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer" 
                >
                  <option value="Sec">Sec</option>
                  <option value="Frais">Frais</option>
                  <option value="Surgelé">Surgelé</option>
                  <option value="Conserve">Conserve</option>
                  <option value="Liquide">Liquide</option>
                  <option value="Hygiène">Hygiène</option>
                  <option value="Autre">Autre</option>
                </select>
                <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={20} />
              </div>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        {activeInventory.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 opacity-50">
            <PackageOpen size={64} className="mb-4" />
            <p className="text-lg">L'inventaire est vide</p>
          </div>
        ) : activeInventory.map(item => (
          <ItemCard 
            key={item.id} 
            item={item} 
            currentUserId={currentUserId}
            isManager={isManager}
            onReserve={(qty) => onReserve(item.id, qty)}
            onCancel={() => onCancel(item.id)}
            onEdit={() => { setEditingItem(item); setShowForm(true); }}
            onDelete={() => onDeleteItem(item.id)}
          />
        ))}
      </div>
      </div>
    </div>
  );
};

interface ItemCardProps {
  item: InventoryItem;
  currentUserId: string;
  isManager: boolean;
  onReserve: (quantity: number) => void;
  onCancel: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, currentUserId, isManager, onReserve, onCancel, onEdit, onDelete }) => {
  const isReserved = item.reservedById !== null;
  const isMine = item.reservedById === currentUserId;
  const [reserveQtyStr, setReserveQtyStr] = useState('1');

  // Reset reserveQty if item.quantity changes and is lower
  React.useEffect(() => {
    const qty = parseInt(reserveQtyStr);
    if (!isNaN(qty) && qty > item.quantity) {
      setReserveQtyStr(item.quantity.toString());
    }
  }, [item.quantity, reserveQtyStr]);

  const handleReserveClick = () => {
    let qty = parseInt(reserveQtyStr);
    if (isNaN(qty) || qty < 1) qty = 1;
    if (qty > item.quantity) qty = item.quantity;
    onReserve(qty);
    setReserveQtyStr('1');
  };

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setReserveQtyStr('');
      return;
    }
    const num = parseInt(val);
    if (!isNaN(num)) {
      if (num > item.quantity) {
        setReserveQtyStr(item.quantity.toString());
      } else {
        setReserveQtyStr(num.toString());
      }
    }
  };

  return (
    <div className={`relative bg-white p-5 rounded-3xl border transition-all ${isMine ? 'border-emerald-500 ring-4 ring-emerald-50 shadow-lg' : 'border-slate-100 shadow-sm'}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          {item.category}
        </span>
        <div className="flex gap-1">
          {isManager && (
            <>
              <button onClick={onEdit} title="Modifier" className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"><Edit3 size={16} /></button>
              <button onClick={onDelete} title="Supprimer" className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
            </>
          )}
        </div>
      </div>
      
      <h3 className="font-bold text-slate-800 text-lg">{item.name}</h3>
      <p className="text-slate-500 text-sm mb-4 line-clamp-2">{item.description}</p>
      
      <div className="flex items-center justify-between mt-auto pt-4">
        <span className="text-xs font-medium text-slate-400">
          {isReserved ? `Quantité: ${item.quantity}` : `Restant: ${item.quantity}`}
        </span>
        
        {isReserved ? (
          isMine ? (
            <button 
              onClick={onCancel}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 transition-all hover:bg-emerald-100"
            >
              <CheckCircle size={14} /> Annuler
            </button>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <XCircle size={14} /> indisponible
            </span>
          )
        ) : (
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              min="1" 
              max={item.quantity} 
              value={reserveQtyStr}
              onChange={handleQtyChange}
              onBlur={() => {
                if (reserveQtyStr === '' || parseInt(reserveQtyStr) < 1) {
                  setReserveQtyStr('1');
                }
              }}
              className="w-14 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-center"
            />
            <button 
              onClick={handleReserveClick}
              disabled={reserveQtyStr === '' || parseInt(reserveQtyStr) < 1}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-white px-3 py-1.5 rounded-lg border border-emerald-100 shadow-sm transition-all hover:bg-emerald-50 disabled:opacity-50"
            >
              <CheckCircle size={14} /> Réserver
            </button>
          </div>
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
