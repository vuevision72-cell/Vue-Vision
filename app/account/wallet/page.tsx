
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

interface WalletTransaction {
    id: number;
    amount: number;
    transaction_type: 'cashback_earned' | 'cash_spent';
    description: string;
    created_at: string;
}

export default function WalletPage() {
    const { profile } = useUserProfile([]);
    const [balance, setBalance] = useState<number | null>(null);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchWalletData = async () => {
            if (!profile?.id) return;
            
            setIsLoading(true);

            const walletPromise = supabase
                .from('wallets')
                .select('balance')
                .eq('user_id', profile.id)
                .single();

            const transactionsPromise = supabase
                .from('wallet_transactions')
                .select('*')
                .eq('user_id', profile.id)
                .order('created_at', { ascending: false });

            const [{ data: walletData }, { data: transactionsData }] = await Promise.all([
                walletPromise,
                transactionsPromise,
            ]);

            setBalance(walletData?.balance || 0);
            setTransactions(transactionsData || []);
            setIsLoading(false);
        };

        if (profile?.id) {
            fetchWalletData();
        }
    }, [profile?.id]);


    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">My Wallet</CardTitle>
                    <CardDescription>Your Zeno Cash balance and transaction history.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <Card className="bg-secondary p-8 flex flex-col items-center justify-center text-center">
                        <p className="text-muted-foreground text-sm">ZENO CASH BALANCE</p>
                        {isLoading ? (
                            <Skeleton className="h-12 w-48 mt-2" />
                        ) : (
                            <p className="text-5xl font-bold text-primary">₹{balance?.toFixed(2) || '0.00'}</p>
                        )}
                    </Card>

                    <div>
                        <h3 className="font-headline text-xl mb-4">Transaction History</h3>
                        <div className="border rounded-lg">
                            {isLoading ? (
                                <div className="space-y-2 p-4">
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ) : transactions.length > 0 ? (
                                transactions.map(tx => (
                                    <div key={tx.id} className="flex justify-between items-center p-4 border-b">
                                        <div>
                                            <p className="font-medium">{tx.description}</p>
                                            <p className="text-sm text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
                                        </div>
                                        <p className={`font-bold text-lg ${tx.transaction_type === 'cashback_earned' ? 'text-green-600' : 'text-destructive'}`}>
                                            {tx.transaction_type === 'cashback_earned' ? '+' : '-'} ₹{Math.abs(tx.amount).toFixed(2)}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="p-8 text-center text-muted-foreground">No transactions yet.</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
