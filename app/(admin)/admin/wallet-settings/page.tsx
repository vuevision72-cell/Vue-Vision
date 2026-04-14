
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

const walletSettingsSchema = z.object({
  cashback_percentage: z.coerce.number().min(0).max(100, 'Percentage must be between 0 and 100.'),
  cod_token_percentage: z.coerce.number().min(0).max(100, 'Percentage must be between 0 and 100.'),
  usage_percentage: z.coerce.number().min(0).max(100, 'Percentage must be between 0 and 100.'),
});

type WalletSettingsFormValues = z.infer<typeof walletSettingsSchema>;

export default function WalletSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<WalletSettingsFormValues>({
    resolver: zodResolver(walletSettingsSchema),
    defaultValues: {
      cashback_percentage: 10,
      cod_token_percentage: 20,
      usage_percentage: 15,
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('wallet_config')
        .select('cashback_percentage, cod_token_percentage, usage_percentage')
        .limit(1)
        .single();
      
      if (data) {
        form.reset({
          cashback_percentage: data.cashback_percentage || 10,
          cod_token_percentage: data.cod_token_percentage || 20,
          usage_percentage: data.usage_percentage || 15,
        });
      }
      setIsLoading(false);
    };
    fetchSettings();
  }, [form]);

  async function onSubmit(values: WalletSettingsFormValues) {
    setIsSubmitting(true);
    const { error } = await supabase
      .from('wallet_config')
      .update(values)
      .eq('id', 1);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error updating settings',
        description: error.message,
      });
    } else {
      toast({
        title: 'Wallet Settings Updated',
        description: 'The wallet and COD settings have been successfully updated.',
      });
    }
    setIsSubmitting(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Zeno Cash & COD Settings</CardTitle>
        <CardDescription>
          Configure the cashback and Cash on Delivery rules for your store.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-8">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-8">
              <FormField
                control={form.control}
                name="cashback_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Cashback Percentage (%)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} placeholder="e.g., 10" />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">Percentage of the order total awarded as cashback upon delivery.</p>
                  </FormItem>
                )}
              />
              <Separator />
               <FormField
                control={form.control}
                name="usage_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zeno Cash Usage Percentage (%)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} placeholder="e.g., 15" />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">Maximum percentage of the cart total that can be paid for with Zeno Cash.</p>
                  </FormItem>
                )}
              />
              <Separator />
               <FormField
                control={form.control}
                name="cod_token_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cash on Delivery - Upfront Token (%)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} placeholder="e.g., 20" />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">Percentage of the order total a user must pay upfront for COD orders.</p>
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
