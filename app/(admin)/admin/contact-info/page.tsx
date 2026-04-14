
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

const contactInfoSchema = z.object({
  phone_number: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email address'),
});

type ContactInfoFormValues = z.infer<typeof contactInfoSchema>;

export default function ContactInfoPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactInfoFormValues>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: {
      phone_number: '',
      email: '',
    },
  });

  useEffect(() => {
    const fetchContactInfo = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('contact_info')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (data) {
        form.reset(data);
      }
      setIsLoading(false);
    };
    fetchContactInfo();
  }, [form]);

  async function onSubmit(values: ContactInfoFormValues) {
    setIsSubmitting(true);
    const { error } = await supabase
      .from('contact_info')
      .update(values)
      .eq('id', 1);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error updating details',
        description: error.message,
      });
    } else {
      toast({
        title: 'Contact Info Updated',
        description: 'The website contact details have been successfully updated.',
      });
    }
    setIsSubmitting(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Manage Contact Info</CardTitle>
        <CardDescription>
          Update the primary phone number and email address used across the website.
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
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., 91xxxxxxxxxx" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., support@example.com" />
                    </FormControl>
                    <FormMessage />
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
