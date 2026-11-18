import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cart } from '../types';
import { cartApi } from '../services/api';
import { useToast } from './ToastContext';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const toast = useToast();

  const fetchCart = async () => {
    try {
      const res = await cartApi.getCart();
      if (res.success && res.data) {
        setCart(res.data);
      }
    } catch (err) {
      console.error('Failed to load cart', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const addToCart = async (productId: string, quantity = 1): Promise<boolean> => {
    try {
      const res = await cartApi.addItem(productId, quantity);
      if (res.success && res.data) {
        setCart(res.data);
        toast.success('Added to shopping bag!');
        setIsDrawerOpen(true);
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to add item to cart';
      toast.error(msg);
      return false;
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    try {
      const res = await cartApi.updateItem(cartItemId, quantity);
      if (res.success && res.data) {
        setCart(res.data);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to update quantity';
      toast.error(msg);
    }
  };

  const removeItem = async (cartItemId: string) => {
    try {
      const res = await cartApi.removeItem(cartItemId);
      if (res.success && res.data) {
        setCart(res.data);
        toast.info('Item removed from cart');
      }
    } catch (err: any) {
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await cartApi.clear();
      await fetchCart();
      toast.info('Cart cleared');
    } catch (err) {
      toast.error('Failed to clear cart');
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isDrawerOpen,
        setIsDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
