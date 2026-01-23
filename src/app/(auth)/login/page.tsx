'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  return (
    <Card className="mx-auto max-w-sm w-full">
      <CardHeader className="space-y-2 text-center">
        <div className="inline-block mx-auto">
          <Logo className="h-10 w-10" />
        </div>
        <CardTitle className="text-2xl font-headline">Selamat Datang Kembali</CardTitle>
        <CardDescription>Masukkan email Anda di bawah ini untuk masuk ke akun Anda</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Kata Sandi</Label>
              <Link href="#" className="ml-auto inline-block text-sm underline">
                Lupa kata sandi Anda?
              </Link>
            </div>
            <Input id="password" type="password" required />
          </div>
          <Button type="submit" className="w-full">
            Masuk
          </Button>
          <Separator className="my-2" />
          <Button variant="outline" className="w-full">
            Masuk dengan Google
          </Button>
        </div>
        <div className="mt-4 text-center text-sm">
          Belum punya akun?{' '}
          <Link href="/register" className="underline">
            Daftar
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
