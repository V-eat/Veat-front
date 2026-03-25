/**
 * Types TypeScript pour l'application V'EAT
 * 
 * Définit toutes les interfaces et types utilisés dans l'application.
 * Ces types sont utilisés pour typer les données échangées entre les composants,
 * les hooks et les services.
 */

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  allergies?: string[];
  preferences?: string[];
  avatarUrl?: string;
  role: 'client' | 'restaurateur';
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  cuisineType?: string;
  email: string;
  phone: string;
  address: string;
  openingHours: OpeningHours;
  preparationTime: number; // in minutes
  rating: number;
  reviewCount: number;
  priceRange: 1 | 2 | 3;
  isFavorite?: boolean;
  distance?: number; // in km
  ownerId: string;
  siret?: string;
  kbisDocumentUrl?: string;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  verificationComment?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface OpeningHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface TimeSlot {
  open: string;
  close: string;
}

export interface DayHours {
  slots: TimeSlot[];
  isClosed: boolean;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  allergens: Allergen[];
  isAvailable: boolean;
}

export type Allergen = 
  | 'gluten'
  | 'crustaceans'
  | 'eggs'
  | 'fish'
  | 'peanuts'
  | 'soybeans'
  | 'milk'
  | 'nuts'
  | 'celery'
  | 'mustard'
  | 'sesame'
  | 'sulphites'
  | 'lupin'
  | 'molluscs';

export const ALLERGEN_LABELS: Record<Allergen, string> = {
  gluten: 'Gluten',
  crustaceans: 'Crustacés',
  eggs: 'Œufs',
  fish: 'Poisson',
  peanuts: 'Arachides',
  soybeans: 'Soja',
  milk: 'Lait',
  nuts: 'Fruits à coque',
  celery: 'Céleri',
  mustard: 'Moutarde',
  sesame: 'Sésame',
  sulphites: 'Sulfites',
  lupin: 'Lupin',
  molluscs: 'Mollusques',
};

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  restaurantId: string;
  userId: string;
  items: CartItem[];
  status: OrderStatus;
  totalAmount: number;
  arrivalTime: string;
  tableNumber?: number;
  isRushed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface Review {
  id: string;
  restaurantId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface VirtualTable {
  id: string;
  hostUserId: string;
  restaurantId: string;
  participants: TableParticipant[];
  orders: Order[];
  status: 'active' | 'completed';
  createdAt: string;
}

export interface TableParticipant {
  userId: string;
  userName: string;
  hasPaid: boolean;
  amount: number;
}
