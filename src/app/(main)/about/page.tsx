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
          <CardTitle className="text-4xl font-headline text-primary">About LiteraVerse</CardTitle>
          <CardDescription className="text-lg text-foreground/80 mt-2">
            Connecting readers and writers in a modern digital universe.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 text-lg text-center">
          <p>
            Our vision is to build a vibrant social platform for digital literacy. We provide free access for everyone to read, write, and engage in real-time discussions, fostering a global community of passionate readers and talented authors.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">The Developer</CardTitle>
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
                    <Button variant="outline" size="sm"><Globe className="mr-2 h-4 w-4"/>Portfolio</Button>
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
          <CardTitle className="font-headline">Contact & Feedback</CardTitle>
          <CardDescription>
            Have a suggestion or facing an issue? Let us know.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <h3 className="font-bold text-lg">Contact Information</h3>
                <a href="mailto:gunturfadilah140@gmail.com" className="flex items-center gap-3 group">
                    <Mail className="h-5 w-5 text-primary" />
                    <span className="text-muted-foreground group-hover:text-primary">gunturfadilah140@gmail.com</span>
                </a>
                 <a href="https://wa.me/6285655548656" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                    <Phone className="h-5 w-5 text-primary" />
                    <span className="text-muted-foreground group-hover:text-primary">0856 5554 8656</span>
                </a>
                <div className="pt-4">
                    <h3 className="font-bold text-lg">Download The App</h3>
                    <p className="text-muted-foreground text-sm mt-1">Get the full LiteraVerse experience on your mobile device.</p>
                     <Button className="mt-4">Download Litera.apk</Button>
                </div>
            </div>
          <form className="space-y-4" action="https://wa.me/6285655548656" target="_blank">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Your Name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea id="feedback" name="text" placeholder="Your message..." />
            </div>
            <Button type="submit" className="w-full"><Send className="mr-2 h-4 w-4" /> Send to WhatsApp</Button>
          </form>
        </CardContent>
      </Card>

    </div>
  );
}
