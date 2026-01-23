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
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UploadCloud, File, X } from "lucide-react"

export default function UploadPage() {
  // Mock state for progress bar and file preview
  const progress = 65;
  const fileName = "my-awesome-book.pdf";

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Upload Your Book</CardTitle>
          <CardDescription>Fill in the details below to publish your work on LiteraVerse.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Book Title</Label>
            <Input id="title" placeholder="The Adventure Begins" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="genre">Genre</Label>
            <Select>
              <SelectTrigger id="genre">
                <SelectValue placeholder="Select a genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self-improvement">Self-improvement</SelectItem>
                <SelectItem value="novel">Novel</SelectItem>
                <SelectItem value="mental-health">Mental-health</SelectItem>
                <SelectItem value="sci-fi">Science Fiction</SelectItem>
                <SelectItem value="fantasy">Fantasy</SelectItem>
                <SelectItem value="mystery">Mystery</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="synopsis">Synopsis</Label>
            <Textarea id="synopsis" placeholder="A brief summary of your book..." rows={4} />
          </div>

          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file-cover" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, or GIF (MAX. 800x400px)</p>
                    </div>
                    <Input id="dropzone-file-cover" type="file" className="hidden" />
                </label>
            </div> 
          </div>

          <div className="space-y-2">
            <Label>Book File (PDF)</Label>
            <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file-book" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PDF only</p>
                    </div>
                    <Input id="dropzone-file-book" type="file" className="hidden" />
                </label>
            </div> 
          </div>

          {/* Mock upload progress */}
          <div className="space-y-2 pt-4">
            <Label>Upload Progress</Label>
            <div className="border rounded-lg p-3 flex items-center gap-4">
              <File className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">{fileName}</p>
                  <p className="text-sm text-muted-foreground">{progress}%</p>
                </div>
                <Progress value={progress} className="h-2 mt-1" />
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

        </CardContent>
        <CardFooter>
          <Button size="lg" className="w-full">
            Submit for Review
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
