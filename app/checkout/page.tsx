
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { ArrowLeft, CreditCard, Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useState, useEffect, useMemo } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const addressSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  postal_code: z.string().min(1, "Postal code is required"),
  phone_number: z
    .string()
    .min(7, "Please enter a valid mobile number.")
    .max(15, "Please enter a valid mobile number."),
});

const checkoutSchema = z.object({
  address: addressSchema,
  saveAddress: z.boolean().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function CheckoutPage() {
  const { toast } = useToast();
  const { cartItems, cartDataForCheckout, clearCart, isLoading: isCartLoading } = useCart();
  const { profile } = useUserProfile([]);
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [paymentMethod, setPaymentMethod] = useState<'Prepaid' | 'COD'>('Prepaid');
  const [codConfig, setCodConfig] = useState({ percentage: 20 });
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    mode: "onChange",
    defaultValues: {
      saveAddress: true,
      address: {
        first_name: '',
        last_name: '',
        address: '',
        city: '',
        country: 'India',
        postal_code: '',
        phone_number: '',
      }
    },
  });

  const subtotal = cartDataForCheckout?.subtotal || 0;
  const walletDiscount = cartDataForCheckout?.walletDiscount || 0;
  const couponDiscount = cartDataForCheckout?.couponDiscount || 0;
  const grandTotal = cartDataForCheckout?.total || 0;
  
  const amountToPay = useMemo(() => {
    if (paymentMethod === 'COD') {
        return Math.round(grandTotal * (codConfig.percentage / 100));
    }
    return grandTotal;
  }, [grandTotal, paymentMethod, codConfig.percentage]);

  const codPendingAmount = useMemo(() => {
      if (paymentMethod === 'COD') {
          return grandTotal - amountToPay;
      }
      return 0;
  }, [grandTotal, amountToPay, paymentMethod]);


  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
        document.body.removeChild(script);
    }
  }, []);
  
  useEffect(() => {
    if (!isCartLoading && cartItems.length > 0 && !cartDataForCheckout) {
        toast({variant: 'destructive', title: 'Error', description: 'Please calculate your total from the cart page first.'});
        router.push('/cart');
    }
  }, [isCartLoading, cartItems, cartDataForCheckout, router, toast]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsConfigLoading(true);
      
      const codConfigPromise = supabase
        .from("wallet_config")
        .select("cod_token_percentage")
        .single();
        
      const addressesPromise = profile 
        ? supabase.from("addresses").select("*").eq("user_id", profile.id)
        : Promise.resolve({ data: null });

      const [
          { data: configData },
          { data: addressData },
      ] = await Promise.all([codConfigPromise, addressesPromise]);
      
      if (configData) {
          setCodConfig({ percentage: configData.cod_token_percentage || 20 });
      }

      if (addressData) {
        setSavedAddresses(addressData);
        if (addressData.length > 0) {
          setSelectedAddressId(addressData[0].id.toString());
          form.reset({ address: addressData[0], saveAddress: false });
        } else {
          setSelectedAddressId('new');
        }
      }
      setIsConfigLoading(false);
    };
    fetchInitialData();
  }, [profile, form]);

  const handleAddressSelection = (id: string) => {
    setSelectedAddressId(id);
    if (id === 'new') {
        form.reset({
            saveAddress: true,
            address: { first_name: '', last_name: '', address: '', city: '', country: 'India', postal_code: '', phone_number: '' }
        });
    } else {
        const selected = savedAddresses.find(addr => addr.id.toString() === id);
        if (selected) {
            form.reset({ address: selected, saveAddress: false });
        }
    }
  };

  async function onSubmit(data: CheckoutFormValues) {
    if (!profile) {
        toast({ variant: "destructive", title: "You must be logged in." });
        return;
    }
    if (cartItems.length === 0 || !cartDataForCheckout) {
        toast({ variant: "destructive", title: "Your cart is empty or total is not calculated." });
        router.push('/cart');
        return;
    }
    setIsProcessing(true);

    let shippingAddress = data.address;

    try {
        if (selectedAddressId === 'new' && data.saveAddress) {
            const { error: saveAddrError } = await supabase.from('addresses').insert({
                ...data.address,
                user_id: profile.id,
            });
            if (saveAddrError) throw new Error(`Could not save new address: ${saveAddrError.message}`);
        }
        
        const { count: orderCount, error: countError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id);

        if (countError) throw countError;

        const isFirstOrder = orderCount === 0;

        const res = await fetch('/api/create-razorpay-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: amountToPay }),
        });

        if (!res.ok) {
            const errorBody = await res.json();
            throw new Error(errorBody.error || 'Failed to create Razorpay order');
        }
        
        const razorpayOrder = await res.json();
        
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: profile.id,
                total: grandTotal,
                subtotal: subtotal,
                wallet_discount: walletDiscount,
                coupon_code: cartDataForCheckout.appliedCoupon?.code,
                coupon_discount: couponDiscount,
                status: 'Pending Payment',
                shipping_address: shippingAddress,
                razorpay_order_id: razorpayOrder.id,
                is_first_order: isFirstOrder,
                payment_method: paymentMethod,
                cod_pending_amount: codPendingAmount
            })
            .select()
            .single();

        if (orderError) throw orderError;
        
        const ourOrderId = orderData.id;

        const orderItems = cartItems.map(item => ({
            order_id: ourOrderId,
            product_id: item.product?.id,
            product_type: item.product?.category || 'unknown',
            quantity: item.quantity,
            price: item.lens_config?.totalPrice || item.product?.price || 0,
            lens_config: item.lens_config
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) throw itemsError;

        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: "Zeno Pure Vision",
            description: `Order #${ourOrderId}`,
            order_id: razorpayOrder.id,
            handler: async function (response: any) {
                try {
                  const { error: updateError } = await supabase
                    .from('orders')
                    .update({
                      status: 'Processing',
                      razorpay_payment_id: response.razorpay_payment_id
                    })
                    .eq('id', ourOrderId);

                  if (updateError) throw updateError;
                  
                  if (isFirstOrder && profile.referred_by_code) {
                      const { data: config } = await supabase.from('wallet_config').select('referred_user_bonus').limit(1).single();
                      const bonus = config?.referred_user_bonus || 0;
                      if (bonus > 0) {
                          const { data: wallet, error: walletError } = await supabase.from('wallets').select('balance').eq('user_id', profile.id).single();
                          if (wallet && !walletError) {
                              const newBalance = wallet.balance + bonus;
                              await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', profile.id);
                              await supabase.from('wallet_transactions').insert({
                                  user_id: profile.id,
                                  order_id: ourOrderId,
                                  amount: bonus,
                                  transaction_type: 'cashback_earned',
                                  description: 'Referral signup bonus on first order'
                              });
                          }
                      }
                  }

                  if (cartDataForCheckout.walletDiscount > 0) {
                      const { data: wallet, error: walletError } = await supabase.from('wallets').select('balance').eq('user_id', profile.id).single();
                      if (wallet && !walletError) {
                          const newBalance = wallet.balance - cartDataForCheckout.walletDiscount;
                          await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', profile.id);
                          await supabase.from('wallet_transactions').insert({
                              user_id: profile.id,
                              order_id: ourOrderId,
                              amount: -cartDataForCheckout.walletDiscount,
                              transaction_type: 'cash_spent',
                              description: `Used for Order #${ourOrderId}`
                          });
                      }
                  }

                  await clearCart();
                  toast({
                      title: "Order Placed!",
                      description: "Your order has been successfully placed.",
                  });
                  router.push('/account/orders');

                } catch (e: any) {
                  toast({ variant: 'destructive', title: "Error updating order", description: e.message });
                  setIsProcessing(false);
                }
            },
            prefill: {
                name: `${profile.full_name}`,
                email: profile.email,
                contact: data.address.phone_number
            },
            notes: {
                order_id: ourOrderId,
            },
            theme: {
                color: "#8A2C40"
            },
            modal: {
                ondismiss: async function() {
                  const { data: currentOrder } = await supabase.from('orders').select('status').eq('id', ourOrderId).single();
                  if (currentOrder && currentOrder.status === 'Pending Payment') {
                    await supabase.from('orders').update({ status: 'Cancelled' }).eq('id', ourOrderId);
                  }
                  setIsProcessing(false);
                }
            }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', async function (response: any) {
            await supabase.from('orders').update({ status: 'Cancelled' }).eq('id', ourOrderId);
            toast({
                variant: 'destructive',
                title: "Payment Failed",
                description: response.error.description,
            });
            setIsProcessing(false);
        });

        rzp.open();

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: "Order failed",
            description: error.message,
        });
        setIsProcessing(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="icon" asChild>
            <Link href="/cart">
                <ArrowLeft />
            </Link>
        </Button>
        <h1 className="font-headline text-4xl md:text-5xl ml-4">Checkout</h1>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {(savedAddresses.length > 0) && (
                    <RadioGroup
                        value={selectedAddressId}
                        onValueChange={handleAddressSelection}
                        className="flex flex-col space-y-1"
                    >
                        {savedAddresses.map(addr => (
                            <FormItem key={addr.id} className="flex items-center space-x-3 space-y-0 border p-4 rounded-md">
                                <FormControl>
                                    <RadioGroupItem value={addr.id.toString()} />
                                </FormControl>
                                <FormLabel className="font-normal flex-1 cursor-pointer">
                                    {addr.first_name} {addr.last_name}, {addr.address}, {addr.city}, {addr.postal_code}
                                </FormLabel>
                            </FormItem>
                        ))}
                        <FormItem className="flex items-center space-x-3 space-y-0 border p-4 rounded-md">
                            <FormControl>
                                <RadioGroupItem value="new" />
                            </FormControl>
                            <FormLabel className="font-normal">
                                Add a new address
                            </FormLabel>
                        </FormItem>
                    </RadioGroup>
                )}

                 <div className="space-y-4 pt-4 border-t">
                    <div className="grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="address.first_name" render={({ field }) => ( <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="address.last_name" render={({ field }) => ( <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    </div>
                    <FormField control={form.control} name="address.phone_number" render={({ field }) => ( <FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    <FormField control={form.control} name="address.address" render={({ field }) => ( <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    <div className="grid md:grid-cols-3 gap-6">
                        <FormField control={form.control} name="address.city" render={({ field }) => ( <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="address.country" render={({ field }) => ( <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="address.postal_code" render={({ field }) => ( <FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    </div>
                    {selectedAddressId === 'new' && (
                         <FormField
                            control={form.control}
                            name="saveAddress"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange}/>
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                    Save this address for future orders
                                    </FormLabel>
                                </div>
                                </FormItem>
                            )}
                        />
                    )}
                 </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                    <RadioGroup
                        value={paymentMethod}
                        onValueChange={(val) => setPaymentMethod(val as 'Prepaid' | 'COD')}
                        className="space-y-2"
                    >
                         <Label htmlFor="prepaid-method" className={cn("flex items-center space-x-3 p-4 border rounded-lg cursor-pointer", {"ring-2 ring-primary border-primary": paymentMethod === 'Prepaid'})}>
                            <RadioGroupItem value="Prepaid" id="prepaid-method" />
                            <div className="flex flex-col">
                                <span className="font-medium flex items-center gap-2"><CreditCard /> Pay Online</span>
                                <span className="text-xs text-muted-foreground">Pay the full amount now.</span>
                            </div>
                        </Label>
                         <Label htmlFor="cod-method" className={cn("flex items-center space-x-3 p-4 border rounded-lg cursor-pointer", {"ring-2 ring-primary border-primary": paymentMethod === 'COD'})}>
                            <RadioGroupItem value="COD" id="cod-method" />
                            <div className="flex flex-col">
                                <span className="font-medium flex items-center gap-2"><Truck/> Cash on Delivery</span>
                                <span className="text-xs text-muted-foreground">Pay {codConfig.percentage}% token now, rest on delivery.</span>
                            </div>
                        </Label>
                    </RadioGroup>
                </CardContent>
            </Card>
            <Card className="bg-secondary">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Final Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                 {walletDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                        <span className="font-medium">Zeno Cash Discount</span>
                        <span>- ₹{walletDiscount.toFixed(2)}</span>
                    </div>
                )}
                {couponDiscount > 0 && cartDataForCheckout?.appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                        <span className="font-medium">Coupon "{cartDataForCheckout.appliedCoupon.code}"</span>
                        <span>- ₹{couponDiscount.toFixed(2)}</span>
                    </div>
                )}
                 <div className="flex justify-between font-bold">
                  <span>Grand Total</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
                <Separator />
                {paymentMethod === 'COD' && (
                    <>
                        <div className="flex justify-between font-bold text-lg text-primary">
                            <span>Token Amount to Pay Now</span>
                            <span>₹{amountToPay.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Amount to Pay on Delivery</span>
                            <span>₹{codPendingAmount.toFixed(2)}</span>
                        </div>
                    </>
                )}
                {paymentMethod === 'Prepaid' && (
                     <div className="flex justify-between font-bold text-lg text-primary">
                        <span>Amount to Pay Now</span>
                        <span>₹{amountToPay.toFixed(2)}</span>
                    </div>
                )}
              </CardContent>
               <CardFooter>
                 <Button type="submit" size="lg" className="w-full" disabled={isProcessing || isCartLoading || cartItems.length === 0 || !form.formState.isValid}>
                    {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
                    Pay Now
                </Button>
               </CardFooter>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}

