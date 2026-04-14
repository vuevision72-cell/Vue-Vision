
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface Coupon {
  id: number;
  code: string;
  discount_percentage: number;
  is_active: boolean;
  created_at: string;
}

const couponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').toUpperCase(),
  discount_percentage: z.coerce.number().min(1, 'Percentage must be at least 1').max(100, 'Percentage cannot exceed 100'),
});

type CouponFormValues = z.infer<typeof couponSchema>;

export default function CouponsPage() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: '',
      discount_percentage: 10,
    }
  });

  const fetchCoupons = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching coupons', description: error.message });
    } else {
      setCoupons(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (values: CouponFormValues) => {
    const { error } = await supabase.from('coupons').insert({
      code: values.code,
      discount_percentage: values.discount_percentage,
      is_active: true,
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Error creating coupon', description: error.code === '23505' ? 'This coupon code already exists.' : error.message });
    } else {
      toast({ title: 'Coupon Created', description: `Coupon "${values.code}" has been created.` });
      form.reset();
      await fetchCoupons();
    }
  };

  const toggleCouponStatus = async (coupon: Coupon) => {
    const { error } = await supabase
      .from('coupons')
      .update({ is_active: !coupon.is_active })
      .eq('id', coupon.id);
    
    if (error) {
        toast({ variant: 'destructive', title: 'Error updating coupon', description: error.message });
    } else {
        toast({ title: 'Coupon Updated', description: `Coupon "${coupon.code}" has been ${!coupon.is_active ? 'activated' : 'deactivated'}.` });
        await fetchCoupons();
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Create New Coupon</CardTitle>
            <CardDescription>Add a new discount code to your store.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateCoupon)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coupon Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., SUMMER24" {...field} onChange={e => field.onChange(e.target.value.toUpperCase())} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discount_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Percentage (%)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 15" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Coupon
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Manage Coupons</CardTitle>
            <CardDescription>View and manage all existing coupons.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center"><Loader2 className="animate-spin mx-auto"/></TableCell></TableRow>
                ) : coupons.length > 0 ? (
                  coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-mono font-medium">{coupon.code}</TableCell>
                      <TableCell>{coupon.discount_percentage}%</TableCell>
                      <TableCell>
                        <Badge variant={coupon.is_active ? 'default' : 'destructive'}>
                          {coupon.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={coupon.is_active}
                          onCheckedChange={() => toggleCouponStatus(coupon)}
                          aria-label={`Toggle coupon ${coupon.code}`}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No coupons found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
