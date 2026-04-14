
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

const referralSettingsSchema = z.object({
  referrer_bonus: z.coerce.number().min(0, 'Bonus must be a positive number.'),
  referred_user_bonus: z.coerce.number().min(0, 'Bonus must be a positive number.'),
});

type ReferralSettingsFormValues = z.infer<typeof referralSettingsSchema>;

export default function ReferralSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReferralSettingsFormValues>({
    resolver: zodResolver(referralSettingsSchema),
    defaultValues: {
      referrer_bonus: 50,
      referred_user_bonus: 20,
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('wallet_config')
        .select('referrer_bonus, referred_user_bonus')
        .limit(1)
        .single();
      
      if (data) {
        form.reset(data);
      }
      setIsLoading(false);
    };
    fetchSettings();
  }, [form]);

  async function onSubmit(values: ReferralSettingsFormValues) {
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
        title: 'Referral Settings Updated',
        description: 'The referral bonus amounts have been successfully updated.',
      });
    }
    setIsSubmitting(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Manage Referral Settings</CardTitle>
        <CardDescription>
          Set the bonus amounts for your "Refer and Earn" program.
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
                name="referrer_bonus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referrer Bonus (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} placeholder="e.g., 50" />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">Amount awarded to the person who shared their code.</p>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="referred_user_bonus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Customer Bonus (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} placeholder="e.g., 20" />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">Amount awarded to the new customer who used a referral code.</p>
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
