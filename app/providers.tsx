
'use client';

import { FirebaseClientProvider } from "@/firebase";
import { CartProvider } from "@/hooks/use-cart";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <FirebaseClientProvider>
            <CartProvider>
                {children}
            </CartProvider>
        </FirebaseClientProvider>
    );
}
