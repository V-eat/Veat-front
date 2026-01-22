import React, { createContext, useContext, useState, useCallback } from 'react';
import { CartItem, MenuItem } from '@/types';

interface CartContextType {
  items: CartItem[];
  restaurantId: string | null;
  addItem: (item: MenuItem, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  arrivalTime: string | null;
  setArrivalTime: (time: string | null) => void;
  isRushed: boolean;
  setIsRushed: (rushed: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [arrivalTime, setArrivalTime] = useState<string | null>(null);
  const [isRushed, setIsRushed] = useState(false);

  const addItem = useCallback((menuItem: MenuItem, quantity: number = 1) => {
    setItems(prev => {
      // If adding from a different restaurant, clear cart first
      if (restaurantId && restaurantId !== menuItem.restaurantId) {
        setRestaurantId(menuItem.restaurantId);
        return [{ menuItem, quantity }];
      }

      if (!restaurantId) {
        setRestaurantId(menuItem.restaurantId);
      }

      const existingIndex = prev.findIndex(item => item.menuItem.id === menuItem.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { menuItem, quantity }];
    });
  }, [restaurantId]);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => {
      const filtered = prev.filter(item => item.menuItem.id !== itemId);
      if (filtered.length === 0) {
        setRestaurantId(null);
        setArrivalTime(null);
      }
      return filtered;
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems(prev => 
      prev.map(item => 
        item.menuItem.id === itemId 
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setRestaurantId(null);
    setArrivalTime(null);
    setIsRushed(false);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      restaurantId,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalAmount,
      arrivalTime,
      setArrivalTime,
      isRushed,
      setIsRushed,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
