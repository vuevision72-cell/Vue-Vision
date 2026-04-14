
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setIsSubmitted(false);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    setIsLoading(false);

    if (error) {
      setError(error.message);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } else {
      setIsSubmitted(true);
      toast({
        title: 'Check your email',
        description: 'Password reset instructions have been sent to your email.',
      });
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold font-headline">Forgot Password</CardTitle>
          <CardDescription>
            {isSubmitted 
              ? 'Please check your inbox for reset instructions.' 
              : 'Enter your email and we\'ll send you a link to reset your password.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
             <div className="text-center">
                <p className="text-muted-foreground">If you don't see the email, please check your spam folder.</p>
                <Button asChild variant="outline" className="mt-6 w-full">
                    <Link href="/login">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
                    </Link>
                </Button>
             </div>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : 'Send Reset Instructions'}
              </Button>
              <div className="mt-4 text-center text-sm">
                  Remember your password?{' '}
                  <Link href="/login" className="underline">
                      Sign in
                  </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
