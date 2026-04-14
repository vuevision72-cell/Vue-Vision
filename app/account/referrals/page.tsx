
'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

interface WalletConfig {
    referrer_bonus: number;
    referred_user_bonus: number;
}

export default function ReferralsPage() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<{ referral_code: string } | null>(null);
    const [walletConfig, setWalletConfig] = useState<WalletConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);

            // 1. Get the current authenticated user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsLoading(false);
                return;
            }
            setCurrentUser(user);

            // 2. Fetch wallet config and user profile in parallel
            const walletConfigPromise = supabase
                .from('wallet_config')
                .select('referrer_bonus, referred_user_bonus')
                .limit(1)
                .single();

            const profilePromise = supabase
                .from('profiles')
                .select('referral_code')
                .eq('id', user.id)
                .single();

            const [
                { data: configData },
                { data: profileData, error: profileError }
            ] = await Promise.all([walletConfigPromise, profilePromise]);

            if (configData) {
                setWalletConfig(configData);
            }
            
            if (profileError || !profileData?.referral_code) {
                console.error("Could not fetch user's referral code:", profileError);
                setIsLoading(false);
                return;
            }
            setProfile(profileData);
            setIsLoading(false);
        };

        fetchInitialData();
    }, []);


    const handleCopyCode = () => {
        if (!profile?.referral_code) return;
        navigator.clipboard.writeText(profile.referral_code);
        toast({
            title: "Copied!",
            description: "Your referral code has been copied to the clipboard.",
        });
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Refer & Earn</CardTitle>
                    <CardDescription>Share your code with friends. When they make their first purchase, you both get a reward!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 text-center">
                    {walletConfig && (
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                             <div className="p-4 bg-primary/10 rounded-lg text-primary-foreground flex-1">
                                <p className="text-sm font-semibold text-primary">YOUR FRIEND GETS</p>
                                <p className="text-2xl font-bold text-primary">₹{walletConfig.referred_user_bonus}</p>
                            </div>
                             <div className="p-4 bg-primary/10 rounded-lg text-primary-foreground flex-1">
                                <p className="text-sm font-semibold text-primary">YOU GET</p>
                                <p className="text-2xl font-bold text-primary">₹{walletConfig.referrer_bonus}</p>
                            </div>
                        </div>
                    )}
                    <div>
                        <h3 className="text-lg font-semibold text-muted-foreground">Your Unique Referral Code</h3>
                        {isLoading ? (
                            <Skeleton className="h-16 w-64 mx-auto mt-2" />
                        ) : profile?.referral_code ? (
                            <>
                                <div className="my-4 p-4 bg-secondary rounded-lg inline-block">
                                    <p className="text-4xl font-bold tracking-widest font-mono text-primary">{profile.referral_code}</p>
                                </div>
                                <div>
                                    <Button onClick={handleCopyCode}>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copy Code
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <p className="mt-4 text-destructive">Could not load your referral code. Please try again later.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
    
