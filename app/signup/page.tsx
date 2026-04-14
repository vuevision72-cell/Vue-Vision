'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    let referredByCodeValidated: string | null = null;

    if (referralCode.trim()) {
        const { data: referringUser, error: referralError } = await supabase
            .from('profiles')
            .select('id')
            .eq('referral_code', referralCode.trim())
            .single();

        if (referralError || !referringUser) {
            setError("Invalid referral code.");
            setIsLoading(false);
            return;
        }
        referredByCodeValidated = referralCode.trim();
    }


    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }
    
    // This is a temporary session while the user confirms their email.
    // We can proceed with profile creation.
    if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: fullName,
            role: 'student',
            referred_by_code: referredByCodeValidated,
        });

        if (profileError) {
            console.error("Failed to create profile, user might be orphaned:", profileError);
            setError(`Could not create your profile: ${profileError.message}`);
            setIsLoading(false);
            return;
        }

      toast({
        title: 'Signup Successful!',
        description: 'Please check your email to verify your account.',
      });
      
      const redirectPath = localStorage.getItem('redirectPath');
      localStorage.removeItem('redirectPath'); // Always clear it after use
      
      // We will still log them in temporarily and redirect them.
      // They will need to verify their email to log in next time.
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      
      if (signInError) {
        // If sign-in fails, send them to the login page as a fallback.
        router.push('/login');
      } else {
         if (redirectPath) {
            router.push(redirectPath);
          } else {
            router.push('/account/dashboard');
          }
      }

    } else {
        setError('An unexpected error occurred during signup.');
        setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold font-headline">Create an Account</CardTitle>
          <CardDescription>Join Zeno Pure Vision today.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {error && <Alert variant="destructive"><AlertTitle>Signup Failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="space-y-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input id="full-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
             <div className="space-y-2">
              <Label htmlFor="referral-code">Referral Code (Optional)</Label>
              <Input id="referral-code" type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'Create Account'}
            </Button>
             <div className="mt-4 text-center text-sm">
                Already have an account?{' '}
                <Link href="/login" className="underline">
                    Sign in
                </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
