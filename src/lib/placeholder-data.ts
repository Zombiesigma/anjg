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
    bio: 'Pengembang Aplikasi LiteraVerse. Pengembang tumpukan penuh dengan hasrat untuk menciptakan aplikasi web yang indah dan fungsional.',
    role: 'penulis',
    followers: 1200,
    following: 150,
  },
  {
    id: '2',
    name: 'Jane Doe',
    username: 'janedoe',
    avatarUrl: getImage('user-avatar-2'),
    bio: 'Pembaca yang rajin dan calon penulis. Suka fantasi dan fiksi ilmiah.',
    role: 'pembaca',
    followers: 300,
    following: 500,
  },
  {
    id: '3',
    name: 'Alex Ray',
    username: 'alexray',
    avatarUrl: getImage('user-avatar-3'),
    bio: 'Penulis buku terlaris dari seri "Chronicles of The Void".',
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
    genre: 'Pengembangan Diri',
    synopsis: 'Di antara kehidupan dan kematian ada sebuah perpustakaan, dan di dalam perpustakaan itu, rak-raknya terbentang selamanya. Setiap buku memberikan kesempatan untuk mencoba kehidupan lain yang bisa Anda jalani. Untuk melihat bagaimana jadinya jika Anda membuat pilihan lain... Apakah Anda akan melakukan sesuatu yang berbeda, jika Anda memiliki kesempatan untuk memperbaiki penyesalan Anda?',
    coverUrl: getImage('book-cover-1'),
    viewCount: 15234,
    downloadCount: 7890,
  },
  {
    id: '2',
    title: 'Atomic Habits',
    author: users[0],
    genre: 'Pengembangan Diri',
    synopsis: 'Cara yang mudah & terbukti untuk membangun kebiasaan baik & menghentikan kebiasaan buruk. Perubahan kecil, hasil yang luar biasa.',
    coverUrl: getImage('book-cover-2'),
    viewCount: 250000,
    downloadCount: 120000,
  },
  {
    id: '3',
    title: 'Project Hail Mary',
    author: users[2],
    genre: 'Novel',
    synopsis: 'Ryland Grace adalah satu-satunya yang selamat dalam misi putus asa, kesempatan terakhir—dan jika dia gagal, umat manusia dan bumi itu sendiri akan musnah. Kecuali saat ini, dia tidak tahu itu. Dia bahkan tidak bisa mengingat namanya sendiri, apalagi sifat tugasnya atau cara menyelesaikannya.',
    coverUrl: getImage('book-cover-3'),
    viewCount: 89000,
    downloadCount: 45000,
  },
  {
    id: '4',
    title: 'The Silent Patient',
    author: users[0],
    genre: 'Kesehatan Mental',
    synopsis: 'Kehidupan Alicia Berenson tampaknya sempurna. Seorang pelukis terkenal yang menikah dengan fotografer mode yang banyak diminati, dia tinggal di sebuah rumah besar dengan jendela-jendela besar yang menghadap ke taman di salah satu daerah paling diminati di London. Suatu malam suaminya Gabriel pulang terlambat dari pemotretan mode, dan Alicia menembaknya lima kali di wajah, dan kemudian tidak pernah mengucapkan sepatah kata pun.',
    coverUrl: getImage('book-cover-4'),
    viewCount: 120000,
    downloadCount: 65000,
  },
  {
    id: '5',
    title: 'Dune',
    author: users[2],
    genre: 'Novel',
    synopsis: "Berlatar di planet gurun Arrakis, Dune adalah kisah tentang anak laki-laki Paul Atreides, pewaris keluarga bangsawan yang ditugaskan untuk memerintah dunia yang tidak ramah di mana satu-satunya hal yang berharga adalah 'rempah-rempah' melange, obat yang mampu memperpanjang hidup dan meningkatkan kesadaran.",
    coverUrl: getImage('book-cover-5'),
    viewCount: 300000,
    downloadCount: 150000,
  },
  {
    id: '6',
    title: 'Sapiens: A Brief History of Humankind',
    author: users[0],
    genre: 'Pengembangan Diri',
    synopsis: 'Sebuah narasi inovatif tentang penciptaan dan evolusi umat manusia—buku terlaris internasional #1 yang mengeksplorasi cara-cara di mana biologi dan sejarah telah mendefinisikan kita dan meningkatkan pemahaman kita tentang apa artinya menjadi “manusia.”',
    coverUrl: getImage('book-cover-6'),
    viewCount: 220000,
    downloadCount: 95000,
  },
];

export const comments: Comment[] = [
    {
        id: 'c1',
        user: users[1],
        text: 'Buku ini benar-benar mengubah perspektif saya tentang kehidupan. Wajib dibaca!',
        timestamp: '2 hari yang lalu',
        replies: [
            {
                id: 'r1',
                user: users[2],
                text: "Saya senang Anda menikmatinya! Sangat menyenangkan untuk menulisnya.",
                timestamp: '1 hari yang lalu',
                replies: []
            }
        ]
    },
    {
        id: 'c2',
        user: users[0],
        text: "Tidak bisa berhenti membacanya. Alur ceritanya ditangani dengan sangat ahli.",
        timestamp: '5 jam yang lalu',
        replies: []
    }
];

export const chatThreads: ChatThread[] = [
    {
        id: 't1',
        participants: [users[1], users[0]],
        lastMessage: { id: 'm1', sender: users[1], text: 'Hei, apakah kamu sudah selesai membaca bab terakhirku?', timestamp: '14:45' },
        unreadCount: 2,
    },
    {
        id: 't2',
        participants: [users[2], users[0]],
        lastMessage: { id: 'm2', sender: users[2], text: 'Saya punya beberapa ide untuk sampul buku saya berikutnya. Bisakah kita diskusikan?', timestamp: 'Kemarin' },
        unreadCount: 0,
    }
];

export const notifications: Notification[] = [
    { id: 'n1', type: 'comment', user: users[1], text: 'Jane Doe mengomentari buku Anda "The Silent Patient".', timestamp: '2 jam yang lalu', read: false },
    { id: 'n2', type: 'follow', user: users[2], text: 'Alex Ray mulai mengikuti Anda.', timestamp: '1 hari yang lalu', read: false },
    { id: 'n3', type: 'new_book', user: users[2], text: 'Alex Ray menerbitkan buku baru "Chronicles of The Void II".', timestamp: '3 hari yang lalu', read: true },
    { id: 'n4', type: 'message', user: users[1], text: 'Anda memiliki pesan baru dari Jane Doe.', timestamp: '5 jam yang lalu', read: true },
];

export const bookContentSample = `
Di jantung kota metropolis Aethelburg yang luas, tempat menara-menara krom menembus langit yang selalu temaram, sesosok tubuh sendirian berdiri di tepi atap yang licin karena hujan. Inilah Kaelen, seorang pencuri data dengan reputasi yang bergema di dunia digital bawah tanah kota, hantu di dalam mesin. Namun, malam ini, dia tidak sedang berburu data; dia sedang diburu.

Dengungan rendah bergetar melalui sol sepatunya, pertanda mendekatnya drone perusahaan. Dia melirik ke belakang, papan-papan neon kota terpantul di mata sibernetiknya. Drone itu, sebuah pesawat ramping dan mengancam, memutari sebuah gedung pencakar langit yang jauh, lampu sorotnya membelah hujan yang gerimis.

"Hanya hari Selasa biasa," gumam Kaelen, senyum masam tersungging di bibirnya. Dia berlari, mantelnya mengepul di belakangnya seperti sayap gelap, dan melompati jurang yang memisahkan atapnya dari atap berikutnya. Dia mendarat dengan gerakan berguling yang terlatih, benturannya diredam oleh sendi-sendi yang diperkuat di kakinya.

Drone itu menyesuaikan arahnya, suaranya yang otomatis terdengar dingin dan monoton. "Hentikan semua gerakan tidak sah. Anda melanggar jam malam Sektor 7."

Kaelen mengabaikannya, berlari melintasi atap baru menuju palka layanan yang gelap. Jari-jarinya, yang dilengkapi dengan neuro-jack, menari di atas kunci elektronik. Serangkaian klik, desis lembut hidrolik, dan palka itu terbuka. Dia menyelinap masuk tepat saat cahaya drone menyapu tempat dia berdiri.

Tenggelam dalam jeroan mekanis gedung, dikelilingi oleh labirin pipa dan saluran, Kaelen akhirnya membiarkan dirinya bernapas sejenak. Dia bersandar di dinding logam yang dingin, mengeluarkan proyektor holografik kecil dari sakunya. Sebuah gambar berkedip-kedip di telapak tangannya: sebuah skema, rumit dan bersinar dengan cahaya biru lembut. Inilah hadiahnya, alasan dia menjadi orang yang paling dicari di Aethelburg. Itu adalah rencana arsitektur untuk inti AI pusat kota, sebuah benteng data yang konon tidak bisa ditembus.

"Mereka benar-benar tidak ingin ada yang melihat ini," bisiknya ke koridor kosong. Data yang dicurinya lebih dari sekadar cetak biru; itu adalah kunci. Kunci rahasia yang akan dibunuh oleh perusahaan penguasa kota, OmniCorp, untuk dilindungi. Com-link-nya berbunyi di telinganya, suara terenkripsi dari kontaknya, Oracle, memecah kesunyian.

"Kau telah membangunkan sarang lebah, Kaelen," katanya, suaranya campuran antara kekhawatiran dan kekaguman. "Mereka telah mengunci jaringan. Mengeluarkan data itu tidak akan mudah."

"Hal-hal terbaik dalam hidup tidak pernah mudah," jawab Kaelen, kilatan tekad di matanya. Dia mendorong dirinya dari dinding dan mulai bergerak lebih dalam ke inti gedung. "Waktunya bekerja."
`.repeat(20);
