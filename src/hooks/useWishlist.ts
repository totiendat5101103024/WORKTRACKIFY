/**
 * Custom hook for Wishlist / Sinking Funds CRUD with IndexedDB.
 */

import { useState, useEffect, useCallback } from 'react';
import type { WishlistItem } from '../types/finance';
import * as db from '../lib/db';
import { generateId } from '../lib/uid';

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.getAllWishlistItems();
      setItems(data.sort((a, b) => a.createdAt - b.createdAt));
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(async (data: Omit<WishlistItem, 'id' | 'createdAt'>) => {
    const item: WishlistItem = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
    };
    await db.addWishlistItem(item);
    await refresh();
    return item;
  }, [refresh]);

  const update = useCallback(async (item: WishlistItem) => {
    await db.updateWishlistItem(item);
    await refresh();
  }, [refresh]);

  const addFunds = useCallback(async (id: string, amount: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const updated: WishlistItem = {
      ...item,
      savedAmount: Math.min(item.targetAmount, item.savedAmount + amount),
    };
    await db.updateWishlistItem(updated);
    await refresh();
  }, [items, refresh]);

  const remove = useCallback(async (id: string) => {
    await db.deleteWishlistItem(id);
    await refresh();
  }, [refresh]);

  const totalSaved = items.reduce((sum, i) => sum + i.savedAmount, 0);
  const totalTarget = items.reduce((sum, i) => sum + i.targetAmount, 0);

  return {
    items,
    loading,
    add,
    update,
    addFunds,
    remove,
    refresh,
    totalSaved,
    totalTarget,
  };
}
