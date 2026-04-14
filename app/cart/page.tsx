
"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Plus, Minus, ShoppingCart, ArrowRight, Wallet, Ticket, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

interface Coupon {
  id: number;
  code: string;
  discount_percentage: number;
}

export default function CartPage() {
  const { cartItems, isLoading, updateItemQuantity, removeItem, setCartDataForCheckout } = useCart();
  const { profile } = useUserProfile([]);
  const router = useRouter();
  const { toast } = useToast();

  const [useWallet, setUseWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isWalletLoading, setIsWalletLoading] = useState(true);
  
  const [walletConfig, setWalletConfig] = useState({ usage_percentage: 15.0 });
  const [isConfigLoading, setIsConfigLoading] = useState(true);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInitialData() {
      setIsWalletLoading(true);
      setIsConfigLoading(true);

      const configPromise = supabase
        .from('wallet_config')
        .select('usage_percentage')
        .single();
      
      const walletPromise = profile?.id 
        ? supabase.from('wallets').select('balance').eq('user_id', profile.id).single()
        : Promise.resolve({ data: null, error: null });

      const [configResult, walletResult] = await Promise.all([configPromise, walletPromise]);

      if (configResult.data) {
        setWalletConfig(configResult.data);
      }
      setIsConfigLoading(false);

      if (walletResult.data) {
        setWalletBalance(walletResult.data.balance || 0);
      }
      setIsWalletLoading(false);
    }
    fetchInitialData();
  }, [profile?.id]);

  const subtotal = useMemo(() => cartItems.reduce((acc, item) => {
    const itemPrice = item.lens_config?.totalPrice || item.product?.price || 0;
    const quantity = item.lens_config?.type === 'contact_lenses' ? 1 : item.quantity;
    return acc + itemPrice * quantity;
  }, 0), [cartItems]);

  const maxWalletDiscount = useMemo(() => {
    return subtotal * (walletConfig.usage_percentage / 100);
  }, [subtotal, walletConfig.usage_percentage]);
  
  const actualWalletDiscount = useMemo(() => {
    return Math.min(walletBalance, maxWalletDiscount);
  }, [walletBalance, maxWalletDiscount]);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return subtotal * (appliedCoupon.discount_percentage / 100);
  }, [subtotal, appliedCoupon]);

  const walletDiscount = useWallet ? Math.min(actualWalletDiscount, subtotal - couponDiscount) : 0;
  
  const total = subtotal - walletDiscount - couponDiscount;

  const handleProceedToCheckout = () => {
    setCartDataForCheckout({
        subtotal,
        walletDiscount,
        total,
        couponDiscount,
        appliedCoupon,
    });
    router.push('/checkout');
  };

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    await updateItemQuantity(itemId, newQuantity);
    toast({ title: "Cart updated" });
  };

  const handleRemoveItem = async (itemId: number) => {
    await removeItem(itemId);
    toast({ title: "Item removed from cart" });
  };
  
  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsCouponLoading(true);
    setCouponError(null);
    setAppliedCoupon(null);

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !data) {
      setCouponError('Invalid or expired coupon code.');
    } else {
      setAppliedCoupon(data as Coupon);
      toast({ title: 'Coupon applied!', description: `${data.discount_percentage}% off your order.` });
    }
    setIsCouponLoading(false);
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  }

  const renderCartItem = (item: any) => {
    const imageUrl = item.product?.images?.[0] || 'https://picsum.photos/seed/1/600/400';
    const isContactLens = item.lens_config?.type === 'contact_lenses';
    const itemPrice = item.lens_config?.totalPrice || item.product?.price || 0;
    const displayQuantity = isContactLens ? (item.lens_config?.boxes?.od || 0) + (item.lens_config?.boxes?.os || 0) : item.quantity;
    const displayTotal = isContactLens ? itemPrice : itemPrice * item.quantity;

    return { imageUrl, isContactLens, itemPrice, displayQuantity, displayTotal };
  };

  if (isLoading) {
    return (
       <div className="container mx-auto px-4 py-12">
        <h1 className="font-headline text-4xl md:text-5xl mb-8">Your Cart</h1>
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-4">
             <Skeleton className="h-48 w-full hidden md:block" />
             <Skeleton className="h-48 w-full md:hidden" />
             <Skeleton className="h-48 w-full md:hidden" />
          </div>
          <div>
            <Card>
              <CardHeader><CardTitle className="font-headline text-2xl">Order Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between"><Skeleton className="h-5 w-20" /><Skeleton className="h-5 w-24" /></div>
                <div className="flex justify-between"><Skeleton className="h-5 w-20" /><Skeleton className="h-5 w-16" /></div>
                <Separator />
                <div className="flex justify-between"><Skeleton className="h-6 w-16" /><Skeleton className="h-6 w-28" /></div>
              </CardContent>
              <CardFooter><Skeleton className="h-12 w-full" /></CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoading && cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingCart className="mx-auto h-24 w-24 text-muted-foreground" />
        <h1 className="mt-4 font-headline text-3xl">Your Cart is Empty</h1>
        <p className="mt-2 text-muted-foreground">Looks like you haven't added anything to your cart yet.</p>
        <Button asChild className="mt-6">
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-headline text-4xl md:text-5xl mb-8">Your Cart</h1>
      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
            {/* Desktop View */}
            <Card className="hidden md:block">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[120px]">Product</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Total Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {cartItems.map((item) => {
                    const { imageUrl, isContactLens, displayQuantity, displayTotal } = renderCartItem(item);
                    return (
                        <TableRow key={item.id}>
                        <TableCell>
                            <div className="relative h-24 w-24 rounded-md overflow-hidden">
                            {item.product && <Image src={imageUrl} alt={item.product.name} fill className="object-cover" />}
                            </div>
                        </TableCell>
                        <TableCell className="font-medium align-top">
                            {item.product && <Link href={`/products/${item.product.category}/${item.product.slug}`} className="hover:text-primary">{item.product.name}</Link>}
                            {item.lens_config && (
                                <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                                {item.lens_config.package && <p>Lenses: {item.lens_config.package}</p>}
                                </div>
                            )}
                        </TableCell>
                        <TableCell className="text-center align-top">
                           { !isContactLens ? (
                            <div className="flex items-center justify-center">
                                <Button variant="ghost" size="icon" onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}>
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                                    className="h-8 w-14 text-center mx-1"
                                />
                                <Button variant="ghost" size="icon" onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            ) : (
                                <p className="text-center">{displayQuantity} boxes</p>
                            )}
                        </TableCell>
                        <TableCell className="text-right align-top">₹{displayTotal.toFixed(2)}</TableCell>
                        <TableCell className="text-right align-top">
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                            <X className="h-4 w-4" />
                            </Button>
                        </TableCell>
                        </TableRow>
                    );
                    })}
                </TableBody>
                </Table>
            </Card>
            {/* Mobile View */}
            <div className="space-y-4 md:hidden">
              {cartItems.map(item => {
                 const { imageUrl, isContactLens, displayQuantity, displayTotal } = renderCartItem(item);
                return (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4 flex gap-4">
                       <div className="relative h-24 w-24 rounded-md overflow-hidden shrink-0">
                          {item.product && <Image src={imageUrl} alt={item.product.name} fill className="object-cover" />}
                        </div>
                        <div className="flex flex-col flex-1">
                            <div className="flex justify-between items-start">
                                <h3 className="font-medium text-sm leading-tight pr-2">
                                  {item.product && <Link href={`/products/${item.product.category}/${item.product.slug}`} className="hover:text-primary">{item.product.name}</Link>}
                                </h3>
                                <Button variant="ghost" size="icon" className="-mt-2 -mr-2 h-8 w-8" onClick={() => handleRemoveItem(item.id)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                             {item.lens_config && (
                                <div className="text-xs text-muted-foreground mt-1">
                                {item.lens_config.package && <p>Lenses: {item.lens_config.package}</p>}
                                </div>
                            )}
                             <div className="flex items-center justify-between mt-auto">
                                {!isContactLens ? (
                                    <div className="flex items-center">
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                                        <Input type="number" value={item.quantity} onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)} className="h-7 w-12 text-center mx-1"/>
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                                    </div>
                                ) : (
                                    <p className="text-sm">{displayQuantity} boxes</p>
                                )}
                                 <p className="font-bold text-right">₹{displayTotal.toFixed(2)}</p>
                             </div>
                        </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <Separator />

              {/* Coupon Section */}
              <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-muted-foreground" />
                    <Label htmlFor="coupon-code" className="font-medium">Apply Coupon</Label>
                  </div>
                  {appliedCoupon ? (
                    <Alert variant="default" className="bg-green-50 border-green-200">
                      <AlertDescription className="flex justify-between items-center text-green-700">
                        <span>Code "{appliedCoupon.code}" applied!</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRemoveCoupon}>
                          <X className="h-4 w-4" />
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <div className="flex gap-2">
                          <Input 
                            id="coupon-code" 
                            placeholder="Enter coupon code" 
                            value={couponCode} 
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            disabled={isCouponLoading}
                          />
                          <Button onClick={handleApplyCoupon} disabled={isCouponLoading || !couponCode}>
                              {isCouponLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : "Apply"}
                          </Button>
                      </div>
                      {couponError && <p className="text-sm text-destructive">{couponError}</p>}
                    </>
                  )}
              </div>

              {/* Wallet Section */}
              {isWalletLoading || isConfigLoading ? (
                <div className="space-y-2 p-4">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
              ) : profile && walletBalance > 0 && (
                <div className="space-y-2 rounded-lg border bg-background p-4">
                     <div className="flex items-center space-x-2">
                        <Checkbox id="use-wallet" checked={useWallet} onCheckedChange={(checked) => setUseWallet(!!checked)}/>
                        <div className="grid gap-1.5 leading-none">
                            <label htmlFor="use-wallet" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-muted-foreground"/> Apply Zeno Cash
                            </label>
                            <p className="text-sm text-muted-foreground">
                                Bal: ₹{walletBalance.toFixed(2)} (You can use up to ₹{actualWalletDiscount.toFixed(2)})
                            </p>
                        </div>
                    </div>
                </div>
              )}
            
              {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                      <span>Coupon Discount</span>
                      <span>- ₹{couponDiscount.toFixed(2)}</span>
                  </div>
              )}
              {walletDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                      <span>Zeno Cash Discount</span>
                      <span>- ₹{walletDiscount.toFixed(2)}</span>
                  </div>
              )}

              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleProceedToCheckout} size="lg" className="w-full" disabled={cartItems.length === 0}>
                  Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
