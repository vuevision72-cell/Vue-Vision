
'use client';
import { useUserProfile } from "@/hooks/use-user-profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";

interface Order {
    id: number;
}

export default function DashboardPage() {
    const { profile, isLoading: isProfileLoading } = useUserProfile([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isOrdersLoading, setIsOrdersLoading] = useState(true);

     useEffect(() => {
        const fetchData = async () => {
            if (!profile?.id) return;
            
            setIsOrdersLoading(true);

            const { data: ordersResult } = await supabase
                .from('orders')
                .select('id')
                .eq('user_id', profile.id);
            
            if (ordersResult) {
                setOrders(ordersResult);
            }

            setIsOrdersLoading(false);
        };
        
        if (!isProfileLoading && profile?.id) {
            fetchData();
        } else if (!isProfileLoading) {
            setIsOrdersLoading(false);
        }
    }, [profile?.id, isProfileLoading]);


    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold font-headline">Welcome, {profile?.full_name || 'User'}!</h1>
                    <p className="text-muted-foreground">Here's a quick overview of your account.</p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Website
                    </Link>
                </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Your Orders</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isProfileLoading || isOrdersLoading ? (
                            <Skeleton className="h-8 w-1/4" />
                        ) : (
                            <div className="text-2xl font-bold">{orders.length}</div>
                        )}
                        <p className="text-xs text-muted-foreground">total orders placed</p>
                         <Button variant="outline" size="sm" className="mt-4" asChild>
                            <Link href="/account/orders">View All Orders</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
