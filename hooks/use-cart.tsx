
'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/hooks/use-user-profile';
import type { Product } from '@/lib/types';

export interface CartItem {
  id: number;
  user_id: string;
  product_id: string;
  quantity: number;
  lens_config: any;
  created_at: string;
  product?: Product;
}

interface Coupon {
  id: number;
  code: string;
  discount_percentage: number;
}

interface CartSummary {
    subtotal: number;
    walletDiscount: number;
    total: number;
    couponDiscount?: number;
    appliedCoupon?: Coupon | null;
}

interface CartContextType {
  cartItems: CartItem[];
  isLoading: boolean;
  error: Error | null;
  addItem: (productId: string, quantity: number, lensConfig?: any) => Promise<void>;
  updateItemQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: number;
  cartDataForCheckout: CartSummary | null;
  setCartDataForCheckout: (data: CartSummary) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useUserProfile([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [cartDataForCheckout, setCartDataForCheckout] = useState<CartSummary | null>(null);
  const isInitialLoad = useRef(true);

  const fetchCartItems = useCallback(async () => {
    if (!profile) {
      if (isInitialLoad.current) {
        setCartItems([]);
        setIsLoading(false);
      }
      return;
    }

    if (isInitialLoad.current) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const { data: items, error: fetchError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      
      const productIds = [...new Set(items.map(item => item.product_id))];
      if (productIds.length === 0) {
        setCartItems([]);
      } else {
        const productPromises = [
            supabase.from('eyeglasses').select('*').in('id', productIds),
            supabase.from('sunglasses').select('*').in('id', productIds),
            supabase.from('screen_glasses').select('*').in('id', productIds),
            supabase.from('contact_lenses').select('*').in('id', productIds),
        ];
        
        const productResults = await Promise.all(productPromises);
        
        const allDbProducts = productResults.flatMap(res => res.data || []);
        
        const itemsWithProductData = items.map(item => {
            const productData = allDbProducts.find(p => p.id.toString() === item.product_id);
            if (!productData) return null; // Return null if product not found
            
            let category = 'unknown';
            if ('frame_type' in productData) {
                // Could be eyeglass, sunglass, or screen_glass. We'll need a better way if they diverge.
                // For now, let's try to determine from which table it came. A bit hacky.
                 if (productResults[0].data?.some(p => p.id === productData.id)) category = 'eyeglasses';
                 else if (productResults[1].data?.some(p => p.id === productData.id)) category = 'sunglasses';
                 else if (productResults[2].data?.some(p => p.id === productData.id)) category = 'screen-glasses';
            } else if ('brand' in productData) {
                category = 'contact-lenses';
            }

            return { 
              ...item, 
              product: {
                  ...productData,
                  id: productData.id.toString(),
                  slug: productData.id.toString(),
                  category: category,
                  images: productData.image_urls,
                  imageId: productData.image_urls?.[0] || 'product-1',
              },
            };
        }).filter((item): item is CartItem => item !== null); // Filter out nulls and type guard

        setCartItems(itemsWithProductData);
      }
    } catch (e: any) {
      setError(e);
      console.error("Error fetching cart items:", e.message);
    } finally {
      if (isInitialLoad.current) {
        setIsLoading(false);
        isInitialLoad.current = false;
      }
    }
  }, [profile]);

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  const addItem = async (productId: string, quantity: number, lensConfig: any = null) => {
    if (!profile) {
        setError(new Error("You must be logged in to add items to the cart."));
        return;
    }

    if (!lensConfig || Object.keys(lensConfig).length === 0 || lensConfig.type === 'frame_only') {
        const existingItem = cartItems.find(item => 
            item.product_id === productId && 
            (!item.lens_config || Object.keys(item.lens_config).length === 0 || item.lens_config.type === 'frame_only')
        );

        if (existingItem) {
            await updateItemQuantity(existingItem.id, existingItem.quantity + quantity);
            return;
        }
    }
    
    const finalQuantity = lensConfig?.type === 'contact_lenses' ? 1 : quantity;

    const { error: insertError } = await supabase
    .from('cart_items')
    .insert({
        user_id: profile.id,
        product_id: productId,
        quantity: finalQuantity,
        lens_config: lensConfig,
    });

    if (insertError) {
        setError(insertError);
        console.error("Error adding item:", insertError.message);
    } else {
        await fetchCartItems();
    }
  };

  const updateItemQuantity = async (itemId: number, quantity: number) => {
    if (quantity <= 0) {
        await removeItem(itemId);
        return;
    }

    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId);
    
    if (updateError) {
        setError(updateError);
        console.error("Error updating quantity:", updateError.message);
    } else {
        await fetchCartItems();
    }
  };

  const removeItem = async (itemId: number) => {
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
        setError(deleteError);
        console.error("Error removing item:", deleteError.message);
    } else {
        await fetchCartItems();
    }
  };
  
  const clearCart = async () => {
    if (!profile) return;
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', profile.id);
      
    if (deleteError) {
        setError(deleteError);
        console.error("Error clearing cart:", deleteError.message);
    } else {
        setCartItems([]);
    }
  };

  const itemCount = useMemo(() => {
    return cartItems.length;
  }, [cartItems]);

  const value = {
    cartItems,
    isLoading,
    error,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    itemCount,
    cartDataForCheckout,
    setCartDataForCheckout
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
