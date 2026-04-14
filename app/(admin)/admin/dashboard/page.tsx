
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DollarSign, ShoppingBag, Eye, Contact, Glasses, Sun } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Order {
    id: number;
    user_id: string;
    total: number;
    created_at: string;
    status: string;
    refunded_amount: number;
}

interface Stats {
    totalRevenue: number;
    totalOrders: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalRevenue: 0, totalOrders: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        
        // This is a simple check to see if the client is misconfigured.
        if (supabase.from('users').select().error) {
            const errorMessage = "Supabase client is not configured. Please check your .env.local file for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";
            console.error(errorMessage);
            setError(errorMessage);
            setIsLoading(false);
            return;
        }

        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id, user_id, total, created_at, status, refunded_amount')
            .order('created_at', { ascending: false });

        if (ordersError) {
            const errorMsg = ordersError.message || "An unknown error occurred.";
            console.error("Error fetching dashboard data:", errorMsg);
            setError(`Failed to fetch dashboard data: ${errorMsg}`);
        } else {
            const deliveredRevenue = (orders || [])
              .filter(order => order.status === 'Delivered')
              .reduce((acc, order) => acc + order.total, 0);

            const totalRefunds = (orders || []).reduce((acc, order) => acc + (order.refunded_amount || 0), 0);
            
            const netRevenue = deliveredRevenue - totalRefunds;
            const totalOrders = (orders || []).filter(o => o.status !== 'Pending Payment' && o.status !== 'Cancelled').length;
            
            setStats({ totalRevenue: netRevenue, totalOrders });
            setRecentOrders(orders?.slice(0, 5) || []);
        }
        setIsLoading(false);
    }
    fetchData();
  }, []);
  
  const productCategories = [
      { name: "Eyeglasses", href: "/admin/products/eyeglasses", icon: Glasses },
      { name: "Sunglasses", href: "/admin/products/sunglasses", icon: Sun },
      { name: "Screen Glasses", href: "/admin/products/screen-glasses", icon: Eye },
      { name: "Contact Lenses", href: "/admin/products/contact-lenses", icon: Contact },
  ]

  if (error) {
    return (
        <Alert variant="destructive">
            <AlertTitle>Error Loading Dashboard</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
  }
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
        case 'Delivered': return 'default';
        case 'Cancelled': return 'destructive';
        default: return 'secondary';
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="font-headline text-4xl">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>}
                 <p className="text-xs text-muted-foreground">Net revenue from delivered orders, minus refunds</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">+{stats.totalOrders}</div>}
                 <p className="text-xs text-muted-foreground">Active and completed orders</p> 
            </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading && Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-12 w-full mb-2"/>)}
                {!isLoading && recentOrders.length > 0 ? (
                     <div className="space-y-2">
                        {recentOrders.map((order) => (
                        <div key={order.id} className={cn("flex items-center gap-4 p-2 rounded-md", {
                            'border border-destructive bg-destructive/10': order.status === 'Cancelled'
                        })}>
                            <Avatar className="hidden sm:flex h-9 w-9">
                                <AvatarFallback>{order.id}</AvatarFallback>
                            </Avatar>
                            <div className="grid gap-1 flex-1">
                                <p className="text-sm font-medium leading-none truncate" title={order.user_id}>User ID: ...{order.user_id.slice(-6)}</p>
                                <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className='flex flex-col items-end'>
                                <Badge variant={getStatusBadgeVariant(order.status)} className='mb-1'>{order.status}</Badge>
                                <div className={cn("font-medium", {
                                    'line-through text-muted-foreground': order.status === 'Cancelled'
                                })}>+₹{order.total.toFixed(2)}</div>
                            </div>
                        </div>
                        ))}
                    </div>
                ) : (
                    !isLoading && <p className="text-muted-foreground">No recent orders found.</p>
                )}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Product Management</CardTitle>
                <CardDescription>Add and manage products in your catalog.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                {productCategories.map((cat) => (
                    <Button asChild variant="outline" key={cat.name} className="justify-start text-left">
                        <Link href={cat.href}>
                            <cat.icon className="mr-2 h-4 w-4" />
                            <span className="truncate">{cat.name}</span>
                        </Link>
                    </Button>
                ))}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
