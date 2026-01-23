import type { User, Book, Comment, ChatThread, Notification } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const getImage = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || '';
const getImageHint = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageHint || '';


export const users: User[] = [
  {
    id: '1',
    name: 'Guntur Padilah',
    username: 'guntur',
    avatarUrl: getImage('user-avatar-1'),
    bio: 'Pengembang Aplikasi LiteraVerse. Full-stack developer with a passion for creating beautiful and functional web applications.',
    role: 'penulis',
    followers: 1200,
    following: 150,
  },
  {
    id: '2',
    name: 'Jane Doe',
    username: 'janedoe',
    avatarUrl: getImage('user-avatar-2'),
    bio: 'Avid reader and aspiring author. Loves fantasy and sci-fi.',
    role: 'pembaca',
    followers: 300,
    following: 500,
  },
  {
    id: '3',
    name: 'Alex Ray',
    username: 'alexray',
    avatarUrl: getImage('user-avatar-3'),
    bio: 'Bestselling author of the "Chronicles of The Void" series.',
    role: 'penulis',
    followers: 25000,
    following: 10,
  },
];

export const books: Book[] = [
  {
    id: '1',
    title: 'The Midnight Library',
    author: users[2],
    genre: 'Self-improvement',
    synopsis: 'Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived. To see how things would be if you had made other choices... Would you have done anything different, if you had the chance to undo your regrets?',
    coverUrl: getImage('book-cover-1'),
    viewCount: 15234,
    downloadCount: 7890,
  },
  {
    id: '2',
    title: 'Atomic Habits',
    author: users[0],
    genre: 'Self-improvement',
    synopsis: 'An easy & proven way to build good habits & break bad ones. Tiny changes, remarkable results.',
    coverUrl: getImage('book-cover-2'),
    viewCount: 250000,
    downloadCount: 120000,
  },
  {
    id: '3',
    title: 'Project Hail Mary',
    author: users[2],
    genre: 'Novel',
    synopsis: 'Ryland Grace is the sole survivor on a desperate, last-chance mission—and if he fails, humanity and the earth itself will perish. Except that right now, he doesn’t know that. He can’t even remember his own name, let alone the nature of his assignment or how to complete it.',
    coverUrl: getImage('book-cover-3'),
    viewCount: 89000,
    downloadCount: 45000,
  },
  {
    id: '4',
    title: 'The Silent Patient',
    author: users[0],
    genre: 'Mental-health',
    synopsis: 'Alicia Berenson’s life is seemingly perfect. A famous painter married to an in-demand fashion photographer, she lives in a grand house with big windows overlooking a park in one of London’s most desirable areas. One evening her husband Gabriel returns home late from a fashion shoot, and Alicia shoots him five times in the face, and then never speaks another word.',
    coverUrl: getImage('book-cover-4'),
    viewCount: 120000,
    downloadCount: 65000,
  },
  {
    id: '5',
    title: 'Dune',
    author: users[2],
    genre: 'Novel',
    synopsis: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only thing of value is the 'spice' melange, a drug capable of extending life and enhancing consciousness.",
    coverUrl: getImage('book-cover-5'),
    viewCount: 300000,
    downloadCount: 150000,
  },
  {
    id: '6',
    title: 'Sapiens: A Brief History of Humankind',
    author: users[0],
    genre: 'Self-improvement',
    synopsis: 'A groundbreaking narrative of humanity’s creation and evolution—a #1 international bestseller that explores the ways in which biology and history have defined us and enhanced our understanding of what it means to be “human.”',
    coverUrl: getImage('book-cover-6'),
    viewCount: 220000,
    downloadCount: 95000,
  },
];

export const comments: Comment[] = [
    {
        id: 'c1',
        user: users[1],
        text: 'This book completely changed my perspective on life. A must-read!',
        timestamp: '2 days ago',
        replies: [
            {
                id: 'r1',
                user: users[2],
                text: "I'm glad you enjoyed it! It was a pleasure to write.",
                timestamp: '1 day ago',
                replies: []
            }
        ]
    },
    {
        id: 'c2',
        user: users[0],
        text: "Couldn't put it down. The plot twists were masterfully handled.",
        timestamp: '5 hours ago',
        replies: []
    }
];

export const chatThreads: ChatThread[] = [
    {
        id: 't1',
        participants: [users[1], users[0]],
        lastMessage: { id: 'm1', sender: users[1], text: 'Hey, did you finish reading my last chapter?', timestamp: '2:45 PM' },
        unreadCount: 2,
    },
    {
        id: 't2',
        participants: [users[2], users[0]],
        lastMessage: { id: 'm2', sender: users[2], text: 'I have some ideas for my next book cover. Can we discuss?', timestamp: 'Yesterday' },
        unreadCount: 0,
    }
];

export const notifications: Notification[] = [
    { id: 'n1', type: 'comment', user: users[1], text: 'Jane Doe commented on your book "The Silent Patient".', timestamp: '2 hours ago', read: false },
    { id: 'n2', type: 'follow', user: users[2], text: 'Alex Ray started following you.', timestamp: '1 day ago', read: false },
    { id: 'n3', type: 'new_book', user: users[2], text: 'Alex Ray published a new book "Chronicles of The Void II".', timestamp: '3 days ago', read: true },
    { id: 'n4', type: 'message', user: users[1], text: 'You have a new message from Jane Doe.', timestamp: '5 hours ago', read: true },
];

export const bookContentSample = `
In the heart of the sprawling metropolis of Aethelburg, where chrome towers pierced the perpetually twilight sky, a lone figure stood on the precipice of a rain-slicked rooftop. This was Kaelen, a data-thief with a reputation that echoed in the digital underbelly of the city, a ghost in the machine. Tonight, however, he wasn't hunting for data; he was being hunted.

A low hum vibrated through the soles of his boots, the tell-tale sign of an approaching corporate drone. He glanced over his shoulder, the neon signs of the city reflecting in his cybernetic eyes. The drone, a sleek, menacing craft, rounded a distant skyscraper, its searchlight cutting a swath through the drizzling rain.

"Just another Tuesday," Kaelen muttered, a wry smile playing on his lips. He took a running start, his trench coat billowing behind him like a dark wing, and leaped across the chasm separating his rooftop from the next. He landed with a practiced roll, the impact absorbed by the reinforced joints in his legs.

The drone adjusted its course, its automated voice a cold, synthetic monotone. "Cease all unauthorized movement. You are in violation of Sector 7 curfew."

Kaelen ignored it, sprinting across the new rooftop towards a darkened service hatch. His fingers, tipped with neuro-jacks, danced across the electronic lock. A series of clicks, a soft hiss of hydraulics, and the hatch slid open. He slipped inside just as the drone's light washed over the spot where he had been standing.

Plunged into the mechanical guts of the building, surrounded by a labyrinth of pipes and conduits, Kaelen finally allowed himself a moment to breathe. He leaned against a cool metal wall, pulling a small, holographic projector from his pocket. An image flickered to life in his palm: a schematic, intricate and glowing with a soft blue light. This was his prize, the reason he was Aethelburg's most wanted. It was the architectural plan for the city's central AI core, a fortress of data said to be impenetrable.

"They really don't want anyone seeing this," he whispered to the empty corridor. The data he had stolen was more than just a blueprint; it was a key. A key to a secret the city's ruling corporation, OmniCorp, would kill to protect. His com-link chirped in his ear, the encrypted voice of his contact, Oracle, cutting through the silence.

"You've stirred the hornet's nest, Kaelen," she said, her voice a mix of concern and admiration. "They've locked down the network. Getting that data out won't be easy."

"The best things in life never are," Kaelen replied, a determined glint in his eyes. He pushed himself off the wall and started moving deeper into the building's core. "Time to go to work."
`.repeat(20);
