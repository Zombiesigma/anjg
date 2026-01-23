'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function RegisterPage() {
  const { toast } = useToast();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate successful registration
    toast({
      title: 'Selamat Bergabung Di Litera!',
      description: 'Semoga harimu menyenangkan.',
    });
    // Here you would typically redirect the user or handle the next step
  };

  return (
    <Card className="mx-auto max-w-sm w-full">
      <CardHeader className="space-y-2 text-center">
        <div className="inline-block mx-auto">
          <Logo className="h-10 w-10" />
        </div>
        <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
        <CardDescription>Enter your information to create an account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="full-name">Full name</Label>
            <Input id="full-name" placeholder="Guntur Padilah" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required />
          </div>
           <div className="grid gap-2">
            <Label htmlFor="picture">Profile picture</Label>
            <Input id="picture" type="file" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required />
          </div>
          <Button type="submit" className="w-full">
            Create account
          </Button>
           <Separator className="my-2" />
           <Button variant="outline" className="w-full">
            Sign up with Google
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
