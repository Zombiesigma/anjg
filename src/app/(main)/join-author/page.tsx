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
          <CardTitle className="text-3xl font-headline mt-4">Become an Author</CardTitle>
          <CardDescription>
            Share your stories with the world. Fill out the form below to apply.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="e.g., Guntur Padilah" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="portfolio">Portfolio/Website (Optional)</Label>
            <Input id="portfolio" placeholder="https://your-portfolio.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="motivation">Why do you want to be an author on LiteraVerse?</Label>
            <Textarea id="motivation" placeholder="Tell us about your writing passion and what you plan to publish..." rows={5}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sample">Writing Sample (Optional)</Label>
             <Input id="sample" type="file" accept=".pdf,.doc,.docx,.txt" />
             <p className="text-xs text-muted-foreground">Upload a short sample of your work.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" size="lg">Submit Application</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
