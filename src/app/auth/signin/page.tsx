'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react'; // Import useState
import { useToast } from "@/hooks/use-toast"; // Import useToast

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Import CardDescription
import { Input } from '@/components/ui/input'; // Import Input component
import { Label } from '@/components/ui/label'; // Import Label component

export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast(); // Initialize useToast
  const [email, setEmail] = useState(''); // State for email input
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if the user is already logged in
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/'); // Redirect to home page or dashboard after login
    }
  }, [status, router]);

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSigningIn(true);
    setError(null);

    const result = await signIn('email', {
      email,
      redirect: false, // Prevent default redirect
      // callbackUrl: '/' // Optional: specify where to redirect after successful email verification
    });

    setIsSigningIn(false);

    if (result?.error) {
      setError(result.error);
    } else if (result?.ok) {
        // If using redirect: false, handle success here (e.g., show a message)
        // If callbackUrl is set, NextAuth.js will handle the redirect after email verification
        // For email provider, result.ok means email was sent successfully.
        // The actual sign-in happens after the user clicks the link in the email.
        toast({
            title: "Check your email",
            description: "A sign-in link has been sent to your email address.",
        });
        // Optionally, redirect the user to a page informing them to check their email
        // router.push('/auth/verify-request');
    }
     if (!result?.ok && !result?.error) {
          // This case might happen if redirect: false is used but no error or ok is returned,
          // which can occur after the email is sent successfully.
           toast({
            title: "Check your email",
            description: "A sign-in link has been sent to your email address.",
        });
     }

  };

   // Assuming you have a useToast hook setup similarly to the useNotes hook
   // If not, you would need to add it or handle notifications differently.
     // Assuming you have a useToast hook setup similarly to the useNotes hook
     // If not, you would need to add it or handle notifications differently.
     // This is now handled by the useToast hook imported above.
     /*
     const toast = ({ title, description, variant }: any) => {
         console.log('Toast:', title, description, variant);
         // Placeholder for actual toast implementation
     };
     */


  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>; // Or a better loading state component
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle className="text-center">Sign In</CardTitle>
           <CardDescription className="text-center">Enter your email to receive a magic link</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form onSubmit={handleEmailSignIn} className="flex flex-col gap-4">
             <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            <Button type="submit" className="w-full" disabled={isSigningIn}>
              {isSigningIn ? 'Sending Link...' : 'Sign in with Email'}
            </Button>
             {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          </form>

          {/* You could add dividers or other methods here */}
          {/* <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div> */}

          {/* Add other providers here if configured */}
          {/* <Button variant="outline" className="w-full" onClick={() => signIn('github')}>
            Sign in with GitHub
          </Button> */}
        </CardContent>
      </Card>
    </div>
  );
}

// The useToast hook is now imported and used directly within the component.
// No need for this placeholder function.
