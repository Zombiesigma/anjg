'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  return (
    <Card className="mx-auto max-w-sm w-full text-center">
      <CardHeader className="space-y-4">
        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <MailCheck className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl font-headline">Verifikasi Email Anda</CardTitle>
        <CardDescription>
          Kami telah mengirimkan tautan verifikasi ke alamat email Anda. Silakan periksa kotak masuk (dan folder spam) Anda untuk menyelesaikan pendaftaran.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link href="/login">Kembali ke Halaman Login</Link>
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
            Tidak menerima email? Coba daftar lagi setelah beberapa saat atau hubungi dukungan.
        </p>
      </CardContent>
    </Card>
  );
}
