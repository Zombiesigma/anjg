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
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
       <div>
        <h1 className="text-3xl font-headline font-bold">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola akun dan preferensi tampilan Anda.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Beginilah cara orang lain akan melihat Anda di situs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="space-y-2">
            <Label htmlFor="username">Nama Pengguna</Label>
            <Input id="username" defaultValue="@guntur" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input id="name" defaultValue="Guntur Padilah" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" defaultValue="Pengembang Aplikasi LiteraVerse." />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button>Simpan Perubahan</Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Tampilan</CardTitle>
          <CardDescription>Sesuaikan tampilan aplikasi.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme-mode" className="flex flex-col space-y-1">
              <span>Tema</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Pilih tema pilihan Anda.
              </span>
            </Label>
            <Select defaultValue="system">
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tema" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="light">Terang</SelectItem>
                    <SelectItem value="dark">Gelap</SelectItem>
                    <SelectItem value="system">Sistem</SelectItem>
                </SelectContent>
            </Select>
          </div>
           <div className="flex items-center justify-between">
            <Label htmlFor="dense-mode" className="flex flex-col space-y-1">
              <span>Tampilan Ringkas</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Tampilkan konten secara lebih ringkas.
              </span>
            </Label>
            <Switch id="dense-mode" />
          </div>
        </CardContent>
         <CardFooter className="border-t px-6 py-4">
          <Button>Simpan Preferensi</Button>
        </CardFooter>
      </Card>

    </div>
  )
}
