import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function NotificationsPage() {
  
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold">Notifikasi</h1>
          <p className="text-muted-foreground">Anda tidak memiliki notifikasi belum dibaca.</p>
        </div>
        <Button variant="outline" disabled>Tandai semua telah dibaca</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Notifikasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center py-8">Tidak ada notifikasi untuk ditampilkan saat ini.</p>
        </CardContent>
      </Card>

    </div>
  )
}
