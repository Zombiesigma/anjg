import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { notifications } from "@/lib/placeholder-data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Bell, MessageSquare, UserPlus, Book } from "lucide-react"
import { cn } from "@/lib/utils"

function NotificationIcon({ type }: { type: string }) {
    const commonClass = "h-5 w-5 text-primary";
    switch (type) {
        case 'comment': return <MessageSquare className={commonClass} />;
        case 'follow': return <UserPlus className={commonClass} />;
        case 'new_book': return <Book className={commonClass} />;
        case 'message': return <MessageSquare className={commonClass} />;
        default: return <Bell className={commonClass} />;
    }
}

export default function NotificationsPage() {
  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold">Notifikasi</h1>
          <p className="text-muted-foreground">Anda memiliki {unreadNotifications.length} notifikasi belum dibaca.</p>
        </div>
        <Button variant="outline">Tandai semua telah dibaca</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Baru</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {unreadNotifications.length > 0 ? (
            unreadNotifications.map(notif => (
              <div key={notif.id} className="flex items-start gap-4 p-3 rounded-lg bg-primary/5">
                <div className="bg-primary/10 p-2 rounded-full mt-1">
                    <NotificationIcon type={notif.type} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={notif.user.avatarUrl} alt={notif.user.name} data-ai-hint="person portrait" />
                        <AvatarFallback>{notif.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm">{notif.text}</p>
                  </div>
                  <p className="text-xs text-primary mt-1">{notif.timestamp}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Tidak ada notifikasi baru.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sebelumnya</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {readNotifications.map(notif => (
            <div key={notif.id} className="flex items-start gap-4 p-3 rounded-lg">
                <div className="bg-muted p-2 rounded-full mt-1">
                     <NotificationIcon type={notif.type} />
                </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                   <Avatar className="h-6 w-6">
                        <AvatarImage src={notif.user.avatarUrl} alt={notif.user.name} data-ai-hint="person portrait" />
                        <AvatarFallback>{notif.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-muted-foreground">{notif.text}</p>
                </div>
                 <p className="text-xs text-muted-foreground mt-1">{notif.timestamp}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
