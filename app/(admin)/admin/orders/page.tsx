
'use client';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal, Download, User, Home, Phone, Search, Wallet, Gift, Loader2, Star, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';


type OrderStatus = 'Processing' | 'Bagged' | 'Shipped' | 'Delivered to Nearest Hub' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Pending Payment';

interface OrderItem {
    id: number;
    product_type: string;
    quantity: number;
    price: number;
    lens_config: any;
    product_id: string;
}

interface ShippingAddress {
    first_name: string;
    last_name: string;
    address: string;
    city: string;
    postal_code: string;
    country: string;
    phone_number?: string;
}

interface Order {
  id: number;
  user_id: string;
  created_at: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  wallet_discount: number;
  order_items: OrderItem[];
  shipping_address: ShippingAddress;
  cashback_awarded?: number;
  is_first_order?: boolean;
  payment_method: 'Prepaid' | 'COD';
  cod_pending_amount: number;
}

interface WalletTransaction {
    order_id: number;
    amount: number;
    transaction_type: string;
}

interface AwardInfo {
    order: Order;
    cashbackPercentage: number;
    cashbackAmount: number;
    referralBonus?: {
        referrerBonus: number;
        referredUserBonus: number;
        referringUserId: string;
    }
}

const LensConfigDetail = ({ label, value }: { label: string, value: any }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;
    return (
        <div className="flex justify-between text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium text-right">{Array.isArray(value) ? value.join(', ') : value}</dd>
        </div>
    );
};

export default function AdminOrdersPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [awardInfo, setAwardInfo] = useState<AwardInfo | null>(null);
  const [isAwardDialogOpen, setIsAwardDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const ORDER_STATUSES: OrderStatus[] = ['Processing', 'Bagged', 'Shipped', 'Delivered to Nearest Hub', 'Out for Delivery', 'Delivered', 'Cancelled'];

  const fetchOrders = async () => {
    setIsLoading(true);

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch orders.' });
        setIsLoading(false);
        return;
    } 

    const orderIds = data.map(o => o.id);
    if (orderIds.length === 0) {
        setAllOrders([]);
        setIsLoading(false);
        return;
    }

    const { data: transactions } = await supabase
        .from('wallet_transactions')
        .select('order_id, amount, transaction_type')
        .in('order_id', orderIds)
        .eq('transaction_type', 'cashback_earned');

    const transactionsMap = (transactions || []).reduce((acc, t) => {
        acc[t.order_id] = t.amount;
        return acc;
    }, {} as Record<number, number>);

    const enrichedOrders = data.map(order => ({
        ...order,
        cashback_awarded: transactionsMap[order.id] || 0
    })) as Order[];


    setAllOrders(enrichedOrders);
    setIsLoading(false);
  };


  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let orders = [...allOrders];

    if (searchTerm) {
        orders = orders.filter(order => {
            const fullName = `${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`.toLowerCase();
            return fullName.includes(searchTerm.toLowerCase()) || order.id.toString().includes(searchTerm);
        });
    }

    if (statusFilter !== 'All') {
        orders = orders.filter(order => order.status === statusFilter);
    }
    
    setFilteredOrders(orders.filter(o => o.status !== 'Pending Payment'));

  }, [searchTerm, statusFilter, allOrders]);


  const handleStatusUpdate = async (orderId: number, newStatus: OrderStatus) => {
    const orderToUpdate = allOrders.find(o => o.id === orderId);
    if (!orderToUpdate) return;
    
    if (newStatus === 'Delivered' && orderToUpdate.status !== 'Delivered') {
        try {
            const { data: configData, error: configError } = await supabase
                .from('wallet_config')
                .select('cashback_percentage, referrer_bonus, referred_user_bonus')
                .limit(1)
                .single();
            
            if (configError) throw configError;

            const cashbackPercentage = configData?.cashback_percentage || 0;
            const cashbackAmount = orderToUpdate.total * (cashbackPercentage / 100);
            
            let awardDetails: AwardInfo = {
                order: orderToUpdate,
                cashbackPercentage: cashbackPercentage,
                cashbackAmount: cashbackAmount,
            };

            // Check for referral bonus
            if (orderToUpdate.is_first_order) {
                const { data: profile } = await supabase.from('profiles').select('referred_by_code').eq('id', orderToUpdate.user_id).single();
                if (profile?.referred_by_code) {
                    const { data: referringUser } = await supabase.from('profiles').select('id').eq('referral_code', profile.referred_by_code).single();
                    if (referringUser) {
                        awardDetails.referralBonus = {
                            referrerBonus: configData?.referrer_bonus || 0,
                            referredUserBonus: configData?.referred_user_bonus || 0,
                            referringUserId: referringUser.id
                        };
                    }
                }
            }
            
            setAwardInfo(awardDetails);
            setIsAwardDialogOpen(true);
            
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Award Prep Error', description: `Could not fetch award configurations: ${error.message}`});
        }
    } else {
      await updateOrderStatus(orderId, newStatus);
    }
  }

  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    const { error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
    
    if (updateError) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update order status.' });
    } else {
        toast({ title: 'Success', description: `Order #${orderId} status updated to ${newStatus}` });
        await fetchOrders(); 
    }
  }

  const addToWallet = async (userId: string, amount: number) => {
    const { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "exact-one-row-not-found"
      throw new Error(`Could not fetch wallet for user ${userId}: ${fetchError.message}`);
    }

    const currentBalance = wallet?.balance || 0;
    const newBalance = currentBalance + amount;
    
    const { error: updateError } = await supabase
        .from('wallets')
        .upsert({ user_id: userId, balance: newBalance }, { onConflict: 'user_id' });

    if (updateError) {
      throw new Error(`Could not update wallet for user ${userId}: ${updateError.message}`);
    }
  };

  const handleAwardAndDeliver = async () => {
    if (!awardInfo) return;
    setIsSubmitting(true);
    
    const { order, cashbackAmount, referralBonus } = awardInfo;
    
    try {
        // 1. Award regular cashback
        if (cashbackAmount > 0) {
            await addToWallet(order.user_id, cashbackAmount);
            
            await supabase.from('wallet_transactions').insert({
                user_id: order.user_id,
                order_id: order.id,
                amount: cashbackAmount,
                transaction_type: 'cashback_earned',
                description: `Cashback for Order #${order.id}`
            });
        }

        // 2. Award referral bonuses
        if (referralBonus && referralBonus.referrerBonus > 0) {
            await addToWallet(referralBonus.referringUserId, referralBonus.referrerBonus);
            
            await supabase.from('wallet_transactions').insert({
                user_id: referralBonus.referringUserId,
                order_id: order.id,
                amount: referralBonus.referrerBonus,
                transaction_type: 'cashback_earned',
                description: `Referral bonus from user ${order.user_id}'s first order`
            });
        }
        
        await updateOrderStatus(order.id, 'Delivered');

        toast({ title: 'Awards Processed', description: `Cashback and any applicable bonuses have been awarded.` });

    } catch (awardError: any) {
        toast({ variant: 'destructive', title: 'Action Failed', description: `Could not process awards: ${awardError.message}`});
    } finally {
        setIsSubmitting(false);
        setIsAwardDialogOpen(false);
        setAwardInfo(null);
    }
  }

  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
        case 'Delivered': return 'default';
        case 'Processing':
        case 'Bagged':
        case 'Shipped':
        case 'Delivered to Nearest Hub':
        case 'Out for Delivery':
            return 'secondary';
        case 'Cancelled': return 'destructive';
        case 'Pending Payment': return 'outline';
        default: return 'outline';
    }
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Orders</CardTitle>
        <CardDescription>
          A list of all recent orders from your store.
        </CardDescription>
        <div className="flex flex-col md:flex-row gap-4 pt-4">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by customer name or order ID..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filter by status..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Orders</SelectItem>
                    {ORDER_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
            <div className="hidden md:grid md:grid-cols-6 gap-4 p-4 font-medium text-muted-foreground border-b">
                <div className="md:col-span-1">Order ID</div>
                <div className="md:col-span-1">Customer</div>
                <div className="md:col-span-1">Date</div>
                <div className="md:col-span-1">Status</div>
                <div className="md:col-span-1 text-right">Total</div>
                <div className="md:col-span-1 text-right pr-8">Actions</div>
            </div>
            {isLoading && (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            )}
            {!isLoading && filteredOrders?.length > 0 && (
                <Accordion type="single" collapsible>
                    {filteredOrders.map(order => (
                        <AccordionItem value={order.id.toString()} key={order.id}>
                            <div className="flex items-center hover:bg-muted/50">
                                <AccordionTrigger className="grid md:grid-cols-6 gap-4 p-4 flex-1 text-left hover:no-underline">
                                    <div className="md:col-span-1 font-medium flex items-center gap-2">
                                        #{order.id}
                                        {order.payment_method === 'COD' && <Badge variant="outline" className="border-yellow-600 text-yellow-600">COD</Badge>}
                                    </div>
                                    <div className="md:col-span-1 text-muted-foreground text-sm truncate">{`${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`.trim() || 'N/A'}</div>
                                    <div className="md:col-span-1">{new Date(order.created_at).toLocaleDateString()}</div>
                                    <div className="md:col-span-1"><Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge></div>
                                    <div className="md:col-span-1 text-right font-medium">₹{order.total.toFixed(2)}</div>
                                    <div className="md:col-span-1" />
                                </AccordionTrigger>
                                <div className="px-4">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                            {ORDER_STATUSES.map(status => (
                                                <DropdownMenuItem
                                                    key={status}
                                                    disabled={order.status === status}
                                                    onSelect={() => handleStatusUpdate(order.id, status)}
                                                >
                                                    Set to {status}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                            <AccordionContent className="p-4 pt-0 bg-secondary/50">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-semibold mb-2">Order Items</h4>
                                        <div className="space-y-4">
                                        {order.order_items && order.order_items.map(item => (
                                            <div key={item.id} className="p-3 border rounded-md bg-background relative">
                                                {item.lens_config?.prescription_details?.type === 'whatsapp' && (
                                                    <div className="absolute top-2 right-2 p-1 bg-yellow-100 rounded-full" title="Prescription to be submitted via WhatsApp">
                                                        <AlertCircle className="h-4 w-4 text-yellow-600"/>
                                                    </div>
                                                )}
                                                <p><strong>Product ID:</strong> {item.product_id} ({item.product_type})</p>
                                                <p><strong>Quantity:</strong> {item.quantity}</p>
                                                <p><strong>Price:</strong> ₹{item.price.toFixed(2)}</p>
                                                 {item.lens_config && (
                                                    <div className="mt-2 text-xs text-muted-foreground p-3 bg-secondary rounded-md">
                                                        <h5 className="font-semibold text-foreground mb-2">Lens Configuration:</h5>
                                                        <dl className="space-y-1">
                                                            {item.lens_config?.prescription_details?.type === 'whatsapp' && (
                                                                <div className="flex justify-between items-center text-sm font-bold text-yellow-700">
                                                                    <dt>Prescription</dt>
                                                                    <dd>SUBMIT VIA WHATSAPP</dd>
                                                                </div>
                                                            )}
                                                            <LensConfigDetail label="Lens Type" value={item.lens_config.type} />
                                                            <LensConfigDetail label="Package" value={item.lens_config.package} />
                                                            <LensConfigDetail label="Add-ons" value={item.lens_config.addons} />
                                                            <LensConfigDetail label="Tint Color" value={item.lens_config.tintColor || item.lens_config.color} />
                                                            <LensConfigDetail label="Power" value={item.lens_config.power} />
                                                            
                                                            {item.lens_config.type === 'contact_lenses' && item.lens_config.boxes && (
                                                                <>
                                                                    <LensConfigDetail label="Right Eye (OD) Boxes" value={item.lens_config.boxes.od} />
                                                                    <LensConfigDetail label="Left Eye (OS) Boxes" value={item.lens_config.boxes.os} />
                                                                </>
                                                            )}
                                                            
                                                            {(item.lens_config.prescription?.od || item.lens_config.prescription?.manual?.right) && (
                                                                <div className='text-xs pt-2 mt-2 border-t'>
                                                                    <p className='font-bold text-foreground'>Right Eye (OD):</p>
                                                                    <p>SPH: {item.lens_config.prescription?.od?.sph || item.lens_config.prescription?.manual?.right?.sph}, CYL: {item.lens_config.prescription?.od?.cyl || item.lens_config.prescription?.manual?.right?.cyl}, Axis: {item.lens_config.prescription?.od?.axis || item.lens_config.prescription?.manual?.right?.axis}, AP: {item.lens_config.prescription?.od?.ap || item.lens_config.prescription?.manual?.right?.add}</p>
                                                                </div>
                                                            )}
                                                            {(item.lens_config.prescription?.os || item.lens_config.prescription?.manual?.left) && (
                                                                <div className='text-xs pt-1'>
                                                                    <p className='font-bold text-foreground'>Left Eye (OS):</p>
                                                                    <p>SPH: {item.lens_config.prescription?.os?.sph || item.lens_config.prescription?.manual?.left?.sph}, CYL: {item.lens_config.prescription?.os?.cyl || item.lens_config.prescription?.manual?.left?.cyl}, Axis: {item.lens_config.prescription?.os?.axis || item.lens_config.prescription?.manual?.left?.axis}, AP: {item.lens_config.prescription?.os?.ap || item.lens_config.prescription?.manual?.left?.add}</p>
                                                                </div>
                                                            )}


                                                            {item.lens_config.customColorUrl && (
                                                                <div className="flex justify-between items-center text-sm">
                                                                    <dt className="text-muted-foreground">Custom Color</dt>
                                                                    <dd>
                                                                        <Button variant="link" size="sm" asChild className="h-auto p-0">
                                                                            <Link href={item.lens_config.customColorUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                                                                View Upload <Download className="h-3 w-3" />
                                                                            </Link>
                                                                        </Button>
                                                                    </dd>
                                                                </div>
                                                            )}

                                                            {(item.lens_config.prescriptionUrl || item.lens_config.prescription_details?.url) && (
                                                            <div className="flex justify-between items-center text-sm">
                                                                <dt className="text-muted-foreground">Prescription</dt>
                                                                <dd>
                                                                    <Button variant="link" size="sm" asChild className="h-auto p-0">
                                                                    <Link href={item.lens_config.prescriptionUrl || item.lens_config.prescription_details.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                                                        View Upload <Download className="h-3 w-3" />
                                                                    </Link>
                                                                    </Button>
                                                                </dd>
                                                            </div>
                                                            )}
                                                        </dl>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {order.shipping_address && (
                                            <div className="p-3 border rounded-md bg-background">
                                                <h4 className="font-semibold mb-3 flex items-center gap-2"><Home className="h-4 w-4"/> Shipping Details</h4>
                                                <address className="not-italic text-sm space-y-1">
                                                    <p className="font-medium">{order.shipping_address.first_name} {order.shipping_address.last_name}</p>
                                                    <p>{order.shipping_address.address}</p>
                                                    <p>{order.shipping_address.city}, {order.shipping_address.postal_code}</p>
                                                    <p>{order.shipping_address.country}</p>
                                                </address>
                                                <div className="mt-3 pt-3 border-t">
                                                    <h5 className="font-semibold mb-2 flex items-center gap-2"><User className="h-4 w-4"/> Contact</h5>
                                                    <div className="text-sm space-y-1">
                                                        {order.shipping_address.phone_number && <p className="flex items-center gap-2"><Phone className="h-3 w-3"/>{order.shipping_address.phone_number}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="p-3 border rounded-md bg-background">
                                            <h4 className="font-semibold mb-3 flex items-center gap-2"><Wallet className="h-4 w-4"/> Payment Summary</h4>
                                            <dl className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <dt>Subtotal</dt>
                                                    <dd>₹{order.subtotal?.toFixed(2) || 'N/A'}</dd>
                                                </div>
                                                {order.wallet_discount > 0 && (
                                                    <div className="flex justify-between text-destructive">
                                                        <dt>Zeno Cash Discount</dt>
                                                        <dd>- ₹{order.wallet_discount.toFixed(2)}</dd>
                                                    </div>
                                                )}
                                                <Separator />
                                                <div className="flex justify-between font-bold text-base">
                                                    <dt>Grand Total</dt>
                                                    <dd>₹{order.total.toFixed(2)}</dd>
                                                </div>
                                                <Separator />
                                                {order.payment_method === 'COD' && (
                                                    <>
                                                        <div className="flex justify-between text-blue-600">
                                                            <dt>Prepaid Token Amount</dt>
                                                            <dd>₹{(order.total - order.cod_pending_amount).toFixed(2)}</dd>
                                                        </div>
                                                         <div className="flex justify-between font-medium text-yellow-700">
                                                            <dt>Pending on Delivery</dt>
                                                            <dd>₹{order.cod_pending_amount.toFixed(2)}</dd>
                                                        </div>
                                                        <Separator />
                                                    </>
                                                )}
                                                {order.cashback_awarded > 0 && (
                                                     <div className="flex justify-between text-green-600 font-medium">
                                                        <dt>Cashback Awarded</dt>
                                                        <dd>+ ₹{order.cashback_awarded.toFixed(2)}</dd>
                                                    </div>
                                                )}
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
             {!isLoading && (!filteredOrders || filteredOrders.length === 0) && (
              <div className="text-center h-24 flex items-center justify-center text-muted-foreground">
                  No orders found for the current filters.
              </div>
            )}
        </div>
      </CardContent>
    </Card>

    <Dialog open={isAwardDialogOpen} onOpenChange={setIsAwardDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <Gift className="h-6 w-6 text-primary"/>
                    Confirm Awards for Delivery
                </DialogTitle>
                <DialogDescription>
                    Review the details before awarding bonuses and marking the order as delivered. This action cannot be undone.
                </DialogDescription>
            </DialogHeader>
            {awardInfo && (
                <div className="py-4 space-y-4">
                    <div className="p-4 rounded-md border bg-secondary space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Order ID:</span>
                            <span className="font-medium">#{awardInfo.order.id}</span>
                        </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Customer Paid:</span>
                            <span className="font-medium">₹{awardInfo.order.total.toFixed(2)}</span>
                        </div>
                        <Separator />
                         <div className="flex justify-between font-bold">
                            <span className="text-primary">Cashback to Award ({awardInfo.cashbackPercentage}%):</span>
                            <span className="text-primary">₹{awardInfo.cashbackAmount.toFixed(2)}</span>
                        </div>
                        {awardInfo.referralBonus && (
                            <>
                                <div className="flex justify-between text-sm font-semibold pt-2 border-t mt-2 text-green-600">
                                    <span className="flex items-center gap-1"><Star className="h-4 w-4"/>Referred User's First Order!</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Referrer Bonus:</span>
                                    <span className="font-medium">₹{awardInfo.referralBonus.referrerBonus.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">New Customer Bonus:</span>
                                    <span className="font-medium text-green-600">Already awarded at checkout</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsAwardDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAwardAndDeliver} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Award & Deliver
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
