import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { BookUser } from "lucide-react"

export default function JoinAuthorPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                <BookUser className="h-8 w-8 text-primary" />
            </div>
          <CardTitle className="text-3xl font-headline mt-4">Menjadi Penulis</CardTitle>
          <CardDescription>
            Bagikan cerita Anda kepada dunia. Isi formulir di bawah ini untuk mendaftar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input id="name" placeholder="cth., Guntur Padilah" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="email">Alamat Email</Label>
              <Input id="email" type="email" placeholder="anda@contoh.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="portfolio">Portofolio/Situs Web (Opsional)</Label>
            <Input id="portfolio" placeholder="https://portofolio-anda.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="motivation">Mengapa Anda ingin menjadi penulis di LiteraVerse?</Label>
            <Textarea id="motivation" placeholder="Ceritakan tentang hasrat menulis Anda dan apa yang Anda rencanakan untuk diterbitkan..." rows={5}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sample">Contoh Tulisan (Opsional)</Label>
             <Input id="sample" type="file" accept=".pdf,.doc,.docx,.txt" />
             <p className="text-xs text-muted-foreground">Unggah sampel singkat dari karya Anda.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" size="lg">Kirim Lamaran</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
