
import { AppState, User, Role } from '../types';

const STORAGE_KEY = 'ecocolis_state_v1';

const ADJECTIVES = ['Joyeux', 'Agile', 'Calme', 'Solaire', 'Rapide', 'Sage', 'Noble', 'Vif', 'Franc', 'Zélé'];
const FOODS = ['Pêche', 'Abricot', 'Cerise', 'Citron', 'Mangue', 'Litchi', 'Kiwi', 'Ananas', 'Melon', 'Banane'];

export const generatePseudonym = () => {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const food = FOODS[Math.floor(Math.random() * FOODS.length)];
  const num = Math.floor(Math.random() * 999);
  return `${adj} ${food} ${num}`;
};

export const loadState = (): AppState => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    users: [],
    currentUser: null,
    inventory: [
      { id: '1', name: 'Panier de Fruits', category: 'Frais', description: 'Assortiment de saison', quantity: 5, reservedById: null },
      { id: '2', name: 'Pack Riz 5kg', category: 'Sec', description: 'Riz long grain', quantity: 10, reservedById: null },
      { id: '3', name: 'Lait demi-écrémé', category: 'Boisson', description: '6 briques de 1L', quantity: 8, reservedById: null },
    ],
    messages: []
  };
};

export const saveState = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  // Dispatch a custom event to sync across tabs if needed
  window.dispatchEvent(new Event('storage_update'));
};
