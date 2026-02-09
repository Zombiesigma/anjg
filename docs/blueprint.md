# **App Name**: LiteraVerse

## Core Features:

- Book Upload: Allows authenticated 'penulis' (author) role users to upload books with title, genre, synopsis, cover, and PDF file, storing them in designated folders and metadata in the SQLite database.  Includes progress bar and preview during upload.
- Book Details Page: Displays book cover, title, author, genre, synopsis, viewer count, and download count. Provides 'Baca Sekarang' (Read Now) and 'Download eBook' buttons with corresponding functionality, along with a real-time comment section.
- Book Reading Page: Presents the book content for reading, including a header with the book title, navigation icons, dark/light mode toggle, and font size adjustment. Content is displayed with vertical scrolling.
- Direct Messaging: Enables users to send direct messages in real-time with a chat list, chatbox, message bubbles, emoji support, and a send button, leveraging a Neon Realtime Channel for instant communication.
- User Profile: Displays user profile information including profile picture, name, bio, role (author/reader), follower/following counts, and a tabbed section for the user's books or favorite books.
- Litera AI Chatbot: AI-powered chatbot that is backed by the Gemini API. It uses system prompts and chat history tool, displays streaming responses, saves conversations, and simulates a thinking process with "Litera Sedang Berfikir..." animation during response generation.
- Admin Dashboard: Provides an administrator interface for managing application data, approving new author registrations, and reviewing new book uploads to prevent spam.

## Style Guidelines:

- Primary color: Modern Blue (#4285F4) to give a cool and modern feeling.
- Background color: Light Cream (#F8F9FA) that is desaturated to 20% from the Blue.
- Accent color: Slightly desaturated, brighter Violet-Blue (#5C6BC0).
- Headline font: 'Playfair Display' (serif) for titles.
- Body font: 'Inter' (sans-serif) for content.
- Note: currently only Google Fonts are supported.
- Use modern and cool icons for navigation and actions, following a consistent style.
- Employ a responsive design that adapts to both mobile and desktop screens. The header and bottom navbar remain fixed during scrolling.
- Incorporate Framer Motion animations for buttons, modals, and transitions to enhance the user experience.