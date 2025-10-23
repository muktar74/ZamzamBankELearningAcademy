
import { User, Course, UserRole, ExternalResource, Notification, NotificationType, Badge } from './types';
import { ShieldCheckIcon, SparklesIcon, TrophyIcon, AcademicCapIcon } from './components/icons';

// SECURITY WARNING: This is for demonstration purposes ONLY.
// Storing plaintext passwords in client-side code is a major security vulnerability.
// In a real-world application, authentication must be handled by a secure backend server
// that stores hashed passwords and uses a token-based system (like JWT).
export const INITIAL_USERS: User[] = [
  { id: 'user-1', name: 'Aisha Ahmed', email: 'aisha.ahmed@zamzambank.com', role: UserRole.EMPLOYEE, password: 'password123', approved: true, points: 150, badges: [], profileImageUrl: undefined },
  { id: 'user-2', name: 'Muktar Abdella', email: 'muktarabdella6@gmail.com', role: UserRole.ADMIN, password: '12345', approved: true, points: 0, badges: [], profileImageUrl: undefined },
  { id: 'user-3', name: 'Fatima Yusuf', email: 'fatima.yuf@zamzambank.com', role: UserRole.EMPLOYEE, password: 'password123', approved: true, points: 275, badges: [], profileImageUrl: undefined },
  { id: 'user-4', name: 'Omar Hassan', email: 'omar.hassan@zamzambank.com', role: UserRole.EMPLOYEE, password: 'password123', approved: false, points: 0, badges: [], profileImageUrl: undefined },
];

export const BADGE_DEFINITIONS: { [key: string]: Badge } = {
    'first-course': {
        id: 'first-course',
        name: 'First Step',
        description: 'Completed your first course.',
        icon: AcademicCapIcon,
        points: 25,
    },
    'prolific-learner': {
        id: 'prolific-learner',
        name: 'Prolific Learner',
        description: 'Completed 3 courses.',
        icon: TrophyIcon,
        points: 75,
    },
    'quiz-master': {
        id: 'quiz-master',
        name: 'Quiz Master',
        description: 'Achieved a perfect score (100%) on a quiz.',
        icon: SparklesIcon,
        points: 50,
    },
    'completionist': {
        id: 'completionist',
        name: 'Completionist',
        description: 'Completed all available courses.',
        icon: ShieldCheckIcon,
        points: 150,
    },
};


export const INITIAL_COURSES: Course[] = [
  {
    id: 'course-1',
    title: 'Introduction to Murabaha',
    description: 'Understand the principles and application of Murabaha (cost-plus financing) in Islamic banking.',
    imageUrl: 'https://picsum.photos/seed/murabaha/600/400',
    modules: [
      { id: 'm1-1', title: 'What is Murabaha?', content: '<p>Murabaha is a particular kind of sale where the seller expressly mentions the cost of the sold commodity he has incurred, and sells it to another person by adding some profit thereon. It is one of the most popular modes of financing used by Islamic banks.</p>' },
      { id: 'm1-2', title: 'Key Features', content: '<ul><li><strong>Transparency:</strong> The cost and profit margin are known to the buyer.</li><li><strong>Asset Ownership:</strong> The bank must own the asset before selling it to the client.</li><li><strong>Deferred Payment:</strong> The sale is typically on a deferred payment basis, allowing the client to pay in installments.</li></ul>' },
      { id: 'm1-3', title: 'Practical Application', content: '<p>It is commonly used for financing assets like vehicles, machinery, and real estate. The bank purchases the asset from a third party and sells it to the client at an agreed price, which includes the original cost plus a profit margin.</p>' },
    ],
    quiz: [
      { question: 'What is the core principle of Murabaha?', options: ['Interest-based lending', 'Cost-plus financing', 'Profit sharing', 'Leasing'], correctAnswer: 'Cost-plus financing' },
      { question: 'Who must own the asset before it is sold to the client in a Murabaha transaction?', options: ['The client', 'A third party', 'The bank', 'A broker'], correctAnswer: 'The bank' },
    ],
    reviews: [
      { id: 'rev1-1', authorId: 'user-1', authorName: 'Aisha Ahmed', rating: 5, comment: 'Excellent course! The content was clear and the practical examples were very helpful.', timestamp: new Date(Date.now() - 86400000 * 3).toISOString() },
      { id: 'rev1-2', authorId: 'user-3', authorName: 'Fatima Yusuf', rating: 4, comment: 'Good overview of Murabaha. I wish there was a bit more detail in the final module, but overall very informative.', timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
    ],
    discussion: [
      { id: 'd1-1', authorId: 'user-3', authorName: 'Fatima Yusuf', text: "Can anyone clarify the difference between Murabaha and a conventional loan?", timestamp: new Date(Date.now() - 86400000).toISOString(), replies: [
        { id: 'd1-2', authorId: 'user-1', authorName: 'Aisha Ahmed', text: "Great question! The key is that Murabaha is a sale of an asset at a marked-up price, not a loan of money. The bank takes ownership risk of the asset, which is fundamentally different from just lending cash and charging interest.", timestamp: new Date().toISOString(), replies: [] }
      ]}
    ]
  },
  {
    id: 'course-2',
    title: 'Fundamentals of Ijarah',
    description: 'Explore the concept of Ijarah (leasing) and its role in providing Sharia-compliant financing solutions.',
    imageUrl: 'https://picsum.photos/seed/ijarah/600/400',
    modules: [
      { id: 'm2-1', title: 'Defining Ijarah', content: '<p>Ijarah is an Islamic financing structure where a bank purchases an asset and then leases it to a customer for a specified period and for an agreed-upon rental payment.</p>' },
      { id: 'm2-2', title: 'Types of Ijarah', content: '<p>The two main types are <strong>Ijarah-wal-iqtina</strong> (lease to own) and <strong>operating Ijarah</strong>. In the former, the lessee can purchase the asset at the end of the lease term.</p>' },
    ],
    quiz: [
      { question: 'Ijarah is the Islamic equivalent of which conventional financial product?', options: ['Loan', 'Mortgage', 'Leasing', 'Stock'], correctAnswer: 'Leasing' },
    ],
    reviews: [
        { id: 'rev2-1', authorId: 'user-1', authorName: 'Aisha Ahmed', rating: 5, comment: 'This was a perfect introduction to Ijarah. Straight to the point and easy to understand.', timestamp: new Date(Date.now() - 86400000).toISOString() },
    ],
    discussion: [],
  },
  {
    id: 'course-3',
    title: 'Mudarabah: Profit-Sharing Partnership',
    description: 'Learn about the Mudarabah contract, a cornerstone of Islamic investment and partnership financing.',
    imageUrl: 'https://picsum.photos/seed/mudarabah/600/400',
    modules: [
        { id: 'm3-1', title: 'What is Mudarabah?', content: '<p>Mudarabah is a partnership where one partner provides the capital (<strong>Rabb-ul-Mal</strong>) and the other provides expertise and management (<strong>Mudarib</strong>). Profits are shared based on a pre-agreed ratio.</p>' },
        { id: 'm3-2', title: 'Roles and Responsibilities', content: '<p>The Rabb-ul-Mal bears any financial loss, while the Mudarib loses the reward for their effort. This structure promotes risk-sharing and ethical investment.</p>' },
    ],
    quiz: [
        { question: 'In a Mudarabah contract, who provides the capital?', options: ['The Mudarib', 'The Rabb-ul-Mal', 'Both partners equally', 'An external investor'], correctAnswer: 'The Rabb-ul-Mal' },
    ],
    reviews: [],
    discussion: [],
  },
];

export const INITIAL_EXTERNAL_RESOURCES: ExternalResource[] = [
  {
    title: 'Islamic Finance: A Practical Guide',
    description: 'An essential book covering the fundamental principles and instruments of Islamic Finance.',
    url: '#',
    type: 'book',
  },
  {
    title: 'Understanding Sharia-Compliant Investments',
    description: 'An in-depth article from a leading financial journal on ethical investing.',
    url: '#',
    type: 'article',
  },
  {
    title: 'Webinar: The Future of IFB',
    description: 'A recorded webinar discussing the trends and future outlook for Islamic Finance Banking.',
    url: '#',
    type: 'video',
  },
   {
    title: 'Journal of Islamic Banking and Finance',
    description: 'A leading academic journal with research papers on contemporary issues in the field.',
    url: '#',
    type: 'article',
  },
  {
    title: 'Animated Intro to Islamic Finance',
    description: 'A short, engaging video that explains the core concepts of IFB in a simple way.',
    url: '#',
    type: 'video',
  },
  {
    title: 'Glossary of Islamic Finance Terms',
    description: 'A comprehensive digital glossary to help you understand key Arabic terminology.',
    url: '#',
    type: 'book',
  },
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
    {
        id: 'notif-1',
        userId: 'user-1',
        type: NotificationType.CERTIFICATE,
        message: 'Congratulations! You have earned a certificate for completing "Introduction to Murabaha".',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        read: true,
    },
    {
        id: 'notif-2',
        userId: 'user-4',
        type: NotificationType.APPROVAL,
        message: 'Welcome to the platform! Your registration has been approved by an administrator.',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        read: false,
    }
];
