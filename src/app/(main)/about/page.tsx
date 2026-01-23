import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { users } from '@/lib/placeholder-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Github, Globe, Mail, Phone, Send } from 'lucide-react';

const developer = users[0];
const devPortfolio = "https://github.com/Guntur-s"; // Replace with actual portfolio URL
const devImage = PlaceHolderImages.find(img => img.id === 'user-avatar-1');

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <Card className="overflow-hidden shadow-lg">
        <CardHeader className="bg-primary/10 p-10 text-center">
            <div className="mx-auto mb-4">
                <Logo className="w-16 h-16" />
            </div>
          <CardTitle className="text-4xl font-headline text-primary">Tentang LiteraVerse</CardTitle>
          <CardDescription className="text-lg text-foreground/80 mt-2">
            Menghubungkan pembaca dan penulis di alam semesta digital modern.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 text-lg text-center">
          <p>
            Visi kami adalah membangun platform sosial yang dinamis untuk literasi digital. Kami menyediakan akses gratis bagi semua orang untuk membaca, menulis, dan terlibat dalam diskusi waktu nyata, membina komunitas global pembaca yang bersemangat dan penulis berbakat.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Pengembang</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-8">
          <Avatar className="w-32 h-32 border-4 border-primary">
            <AvatarImage src={devImage?.imageUrl} alt={developer.name} data-ai-hint={devImage?.imageHint} />
            <AvatarFallback>{developer.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl font-bold">{developer.name}</h3>
            <p className="text-muted-foreground">{developer.bio}</p>
            <div className="flex justify-center md:justify-start gap-2 pt-2">
                <a href={devPortfolio} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm"><Globe className="mr-2 h-4 w-4"/>Portofolio</Button>
                </a>
                <a href="https://github.com/Guntur-s" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm"><Github className="mr-2 h-4 w-4"/>GitHub</Button>
                </a>
            </div>
          </div>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Kontak & Umpan Balik</CardTitle>
          <CardDescription>
            Punya saran atau menghadapi masalah? Beri tahu kami.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <h3 className="font-bold text-lg">Informasi Kontak</h3>
                <a href="mailto:gunturfadilah140@gmail.com" className="flex items-center gap-3 group">
                    <Mail className="h-5 w-5 text-primary" />
                    <span className="text-muted-foreground group-hover:text-primary">gunturfadilah140@gmail.com</span>
                </a>
                 <a href="https://wa.me/6285655548656" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                    <Phone className="h-5 w-5 text-primary" />
                    <span className="text-muted-foreground group-hover:text-primary">0856 5554 8656</span>
                </a>
                <div className="pt-4">
                    <h3 className="font-bold text-lg">Unduh Aplikasinya</h3>
                    <p className="text-muted-foreground text-sm mt-1">Dapatkan pengalaman LiteraVerse lengkap di perangkat seluler Anda.</p>
                     <Button className="mt-4">Unduh Litera.apk</Button>
                </div>
            </div>
          <form className="space-y-4" action="https://wa.me/6285655548656" target="_blank">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama</Label>
              <Input id="name" name="name" placeholder="Nama Anda" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="anda@contoh.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feedback">Umpan Balik</Label>
              <Textarea id="feedback" name="text" placeholder="Pesan Anda..." />
            </div>
            <Button type="submit" className="w-full"><Send className="mr-2 h-4 w-4" /> Kirim ke WhatsApp</Button>
          </form>
        </CardContent>
      </Card>

    </div>
  );
}
