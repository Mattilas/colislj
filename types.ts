
export type Role = 'MANAGER' | 'USER';

export interface User {
  id: string;
  pseudonym: string;
  role: Role;
  isFirstUser: boolean;
  avatarSeed: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  description: string;
  quantity: number;
  reservedById: string | null; // null if available
  isDelivered?: boolean;
}

export interface Message {
  id: string;
  toUserId: string;
  fromUserId: string;
  content: string;
  timestamp: number;
  isRead: boolean;
  location?: string;
  pickupTime?: string;
}

export interface AppState {
  users: User[];
  currentUser: User | null;
  inventory: InventoryItem[];
  messages: Message[];
  onlineUserIds: string[];
}
