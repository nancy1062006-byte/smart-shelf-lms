// Smart-Shelf Library Catalog - 12 Categories with at least 5 books each
// Keeps all original books intact and guarantees full coverage of all 12 categories.

export const ALL_CATEGORIES = [
  "Psychology",
  "Biology",
  "Science",
  "Chemistry",
  "Self-Help",
  "Computer Science",
  "Economics",
  "History",
  "Literature",
  "Management",
  "Mathematics",
  "Physics",
] as const;

export type Category = (typeof ALL_CATEGORIES)[number];

export type CatalogBook = {
  id?: string;
  title: string;
  author: string;
  category: string;
  isbn?: string | null;
  description?: string | null;
  total_copies: number;
  available_copies: number;
  cover_url?: string | null;
  created_at?: string;
};

export const DEFAULT_BOOKS: CatalogBook[] = [
  {
    "id": "4bff3217-57b2-4c81-add6-c1b0b8230181",
    "title": "One Hundred Years of Solitude",
    "author": "Gabriel Garcia Marquez",
    "category": "Literature",
    "isbn": "9780060883287",
    "description": "The multi-generational story of the Buendia family.",
    "total_copies": 2,
    "available_copies": 2,
    "created_at": "2026-08-22T15:06:17.585517+00:00",
    "cover_url": "/__l5e/assets-v1/9ff37da8-208c-4087-92e0-2a4851e1f743/9780060883287.jpg"
  },
  {
    "id": "6ab260c1-a1b5-4ea4-b8ff-352723a008fc",
    "title": "Principles of Economics",
    "author": "N. Gregory Mankiw",
    "category": "Economics",
    "isbn": "9780357038314",
    "description": "A standard introduction to modern economics.",
    "total_copies": 3,
    "available_copies": 3,
    "created_at": "2026-08-22T15:06:17.585517+00:00",
    "cover_url": "/__l5e/assets-v1/f0279293-cc9e-4dc5-870c-841c67f3ebde/9780357038314.jpg"
  },
  {
    "id": "16b5a5b6-2db0-4e95-ab42-fb95ec28d0c0",
    "title": "Thinking, Fast and Slow",
    "author": "Daniel Kahneman",
    "category": "Psychology",
    "isbn": "9780374533557",
    "description": "How two systems drive the way we think.",
    "total_copies": 3,
    "available_copies": 3,
    "created_at": "2026-08-22T15:06:17.585517+00:00",
    "cover_url": "/__l5e/assets-v1/3476277a-22ab-42f3-a96c-2beb5ef73aa4/9780374533557.jpg"
  },
  {
    "id": "73eaced3-7f52-4ada-9879-a23dc809d11c",
    "title": "The Pragmatic Programmer",
    "author": "Andrew Hunt",
    "category": "Computer Science",
    "isbn": "9780201616224",
    "description": "Your journey to mastery, 20th anniversary edition.",
    "total_copies": 2,
    "available_copies": 2,
    "created_at": "2026-08-22T15:06:17.585517+00:00",
    "cover_url": "/__l5e/assets-v1/4f65858c-9ad1-44ba-80c7-4659947c1f32/9780201616224.jpg"
  },
  {
    "id": "d6fef7c2-3a25-4ebe-991c-336bb5b87732",
    "title": "A Brief History of Time",
    "author": "Stephen Hawking",
    "category": "Science",
    "isbn": "9780553380163",
    "description": "From the Big Bang to black holes.",
    "total_copies": 3,
    "available_copies": 2,
    "created_at": "2026-08-22T15:06:17.585517+00:00",
    "cover_url": "/__l5e/assets-v1/f2a6eeb1-5194-4f6e-bdd1-a32955f3b945/9780553380163.jpg"
  },
  {
    "id": "c1d95134-000c-47e7-b2de-73ff81d5617a",
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "category": "Computer Science",
    "isbn": "9780132350884",
    "description": "A handbook of agile software craftsmanship.",
    "total_copies": 3,
    "available_copies": 3,
    "created_at": "2026-08-22T15:06:17.585517+00:00",
    "cover_url": "/__l5e/assets-v1/850f9202-0645-4846-bea9-d4d09701ff53/9780132350884.jpg"
  },
  {
    "id": "5536bb1d-8bec-4c05-83ef-0a1c0b34b89d",
    "title": "Sapiens: A Brief History of Humankind",
    "author": "Yuval Noah Harari",
    "category": "History",
    "isbn": "9780062316097",
    "description": "A sweeping history of our species.",
    "total_copies": 5,
    "available_copies": 4,
    "created_at": "2026-08-22T15:06:17.585517+00:00",
    "cover_url": "/__l5e/assets-v1/9d331bf3-1723-4833-b61f-cd15cda438c5/9780062316097.jpg"
  },
  {
    "id": "bf6da58a-7feb-451b-82aa-37f982702ee6",
    "title": "Organic Chemistry",
    "author": "Paula Yurkanis Bruice",
    "category": "Chemistry",
    "isbn": "9780134042282",
    "description": "Core concepts of organic chemistry for undergraduates.",
    "total_copies": 3,
    "available_copies": 3,
    "created_at": "2026-08-22T15:06:17.585517+00:00",
    "cover_url": "/__l5e/assets-v1/d3c74011-e02b-4b11-b4e5-f06a5332c5fa/9780134042282.jpg"
  },
  {
    "id": "18577ecb-e519-4599-bcdc-741d0e1d63be",
    "title": "Pride and Prejudice",
    "author": "Jane Austen",
    "category": "Literature",
    "isbn": "9780141439518",
    "description": "A classic novel of manners.",
    "total_copies": 4,
    "available_copies": 4,
    "created_at": "2026-08-22T15:06:17.585517+00:00",
    "cover_url": "/__l5e/assets-v1/cfb1df57-4bdc-4c31-bedb-4fd9b7c9a4cb/9780141439518.jpg"
  },
  {
    "id": "fba27c30-8364-44fe-a34f-ab5d5ecfae8e",
    "title": "The Selfish Gene",
    "author": "Richard Dawkins",
    "category": "Science",
    "isbn": "9780198788607",
    "description": "A gene-centred view of evolution.",
    "total_copies": 2,
    "available_copies": 2,
    "created_at": "2026-08-22T15:06:17.585517+00:00",
    "cover_url": "/__l5e/assets-v1/8e8a43da-1bc2-438c-aa6c-e040fa4e69a7/9780198788607.jpg"
  },
  {
    "id": "17d92a2e-fa58-4014-8767-f27b33f332ac",
    "title": "Introduction to Algorithms",
    "author": "Thomas H. Cormen",
    "category": "Computer Science",
    "isbn": "9780262046305",
    "description": "The definitive reference on algorithms and data structures.",
    "total_copies": 4,
    "available_copies": 4,
    "created_at": "2026-08-22T15:06:17.585517+00:00",
    "cover_url": "/__l5e/assets-v1/6e06fdef-90d2-45cc-9bd0-3af8bb65819b/9780262046305.jpg"
  },
  {
    "id": "c7fcc835-810b-4f9a-bde2-722c68acb47e",
    "title": "Fundamentals of Physics",
    "author": "David Halliday",
    "category": "Physics",
    "isbn": "9781118230718",
    "description": "Comprehensive undergraduate physics text.",
    "total_copies": 4,
    "available_copies": 4,
    "created_at": "2026-08-22T15:06:17.585517+00:00",
    "cover_url": "/__l5e/assets-v1/0f8b7497-e0d1-4ee9-b639-bd2957af004a/9781118230718.jpg"
  },
  {
    "id": "63cfaa60-df66-4e24-9193-d70d21767bbd",
    "title": "Structure and Interpretation of Computer Programs",
    "author": "Harold Abelson",
    "category": "Computer Science",
    "isbn": "9780262510875",
    "description": "Structure and interpretation of computer programs with Scheme.",
    "total_copies": 3,
    "available_copies": 3,
    "created_at": "2026-10-22T07:38:13.472232+00:00",
    "cover_url": "/__l5e/assets-v1/fcbd8660-7854-47d9-8df3-9b09de1b879d/9780262510875.jpg"
  },
  {
    "id": "88d3de4d-f49e-4fa5-a443-d30bbbdd3c6f",
    "title": "The C Programming Language",
    "author": "Brian W. Kernighan",
    "category": "Computer Science",
    "isbn": "9780131103627",
    "description": "The definitive guide to the C programming language.",
    "total_copies": 3,
    "available_copies": 3,
    "created_at": "2026-10-22T07:38:13.472232+00:00",
    "cover_url": "/__l5e/assets-v1/308fa497-9ce3-4358-a187-865f35a47116/9780131103627.jpg"
  },
  {
    "id": "8133151c-42f8-447c-a573-9c03e68e7a77",
    "title": "Hands-On Machine Learning",
    "author": "Aurelien Gerone",
    "category": "Computer Science",
    "isbn": "9781492032649",
    "description": "Practical machine learning with Scikit-Learn, Keras and TensorFlow.",
    "total_copies": 2,
    "available_copies": 2,
    "created_at": "2026-10-22T07:38:13.472232+00:00",
    "cover_url": "/__l5e/assets-v1/b3712853-6962-4fdf-a274-1a71ba469011/9781492032649.jpg"
  },
  {
    "id": "d4e7548e-0a30-4bee-ba89-4f2a7f6a5d52",
    "title": "Head First Java",
    "author": "Kathy Sierra",
    "category": "Computer Science",
    "isbn": "9780596009205",
    "description": "A brain-friendly guide to Java and object-oriented programming.",
    "total_copies": 3,
    "available_copies": 3,
    "created_at": "2026-10-22T07:38:13.472232+00:00",
    "cover_url": "/__l5e/assets-v1/c3d2aee6-d94c-479a-9233-69748e6deeab/9780596009205.jpg"
  },
  {
    "id": "bc7e9402-152b-496b-856e-69709e226d95",
    "title": "Discrete Mathematics and Its Applications",
    "author": "Kenneth Rosen",
    "category": "Mathematics",
    "isbn": "9780073383095",
    "description": "Logic, sets, graphs and combinatorics for computer science students.",
    "total_copies": 2,
    "available_copies": 2,
    "created_at": "2026-10-22T07:38:13.472232+00:00",
    "cover_url": "/__l5e/assets-v1/4568978e-e98a-4aba-a893-f228c81ab188/9780073383095.jpg"
  },
  {
    "id": "fa5e4f73-bd44-4611-93a4-5e8f38391161",
    "title": "Introduction to Linear Algebra",
    "author": "Gilbert Strang",
    "category": "Mathematics",
    "isbn": "9780980232776",
    "description": "Vectors, matrices and linear transformations, explained clearly.",
    "total_copies": 3,
    "available_copies": 3,
    "created_at": "2026-10-22T07:38:13.472232+00:00",
    "cover_url": "/__l5e/assets-v1/b81599ca-145b-4530-a42c-c12d23c41d6a/9780980232776.jpg"
  },
  {
    "id": "6464cb4d-6dd5-42ce-8ddf-d4d6d113427a",
    "title": "University Physics with Modern Physics",
    "author": "Hugh D. Young",
    "category": "Physics",
    "isbn": "9780321973610",
    "description": "Calculus-based university physics with worked examples.",
    "total_copies": 2,
    "available_copies": 2,
    "created_at": "2026-10-22T07:38:13.472232+00:00",
    "cover_url": "/__l5e/assets-v1/e83f9341-5c5c-4e7d-b851-487fa1ab268b/9780321973610.jpg"
  },
  {
    "id": "dbba0321-85cc-462e-97c4-5a3fc2411d7e",
    "title": "Campbell Biology",
    "author": "Lisa A. Urry",
    "category": "Biology",
    "isbn": "9780134093413",
    "description": "The standard text for general biology courses.",
    "total_copies": 2,
    "available_copies": 2,
    "created_at": "2026-10-22T07:38:13.472232+00:00",
    "cover_url": "/__l5e/assets-v1/5db127fd-1d44-411e-9296-4d803a7b6e27/9780134093413.jpg"
  },
  {
    "id": "987a03b9-72ae-4c52-919c-a49e1354d09e",
    "title": "1984",
    "author": "George Orwell",
    "category": "Literature",
    "isbn": "9780451524935",
    "description": "A dystopian novel of surveillance and totalitarian control.",
    "total_copies": 4,
    "available_copies": 4,
    "created_at": "2026-10-22T07:38:13.472232+00:00",
    "cover_url": "/__l5e/assets-v1/35586102-738e-43af-800e-dfce0865c435/9780451524935.jpg"
  },
  {
    "id": "0b954ce1-d02a-41e4-a504-af842d53d5d5",
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "category": "Literature",
    "isbn": "9780743273565",
    "description": "The Jazz Age story of Jay Gatsby and the American Dream.",
    "total_copies": 3,
    "available_copies": 3,
    "created_at": "2026-10-22T07:38:13.472232+00:00",
    "cover_url": "/__l5e/assets-v1/84ff57d2-0db5-4a7e-b7d4-d3643d69a84d/9780743273565.jpg"
  },
  {
    "id": "fda4b270-7577-4eb2-a453-41fde6b5790a",
    "title": "The Alchemist",
    "author": "Paulo Coelho",
    "category": "Literature",
    "isbn": "9780062315007",
    "description": "A shepherd boy follows his dream across the desert.",
    "total_copies": 3,
    "available_copies": 3,
    "created_at": "2026-10-22T07:38:13.472232+00:00",
    "cover_url": "/__l5e/assets-v1/82a6b3a9-0251-4be8-98f5-5de99a18da3b/9780062315007.jpg"
  },
  {
    "id": "32ebc7b1-c831-445c-a8fa-38bad7e78a94",
    "title": "The Wealth of Nations",
    "author": "Adam Smith",
    "category": "Economics",
    "isbn": "9780553585971",
    "description": "The foundational text of classical economics.",
    "total_copies": 2,
    "available_copies": 2,
    "created_at": "2026-10-22T07:38:13.472232+00:00",
    "cover_url": "/__l5e/assets-v1/2cacdb9c-c15a-4e7a-9a73-25c8bd35b613/9780553585971.jpg"
  },
  {
    "id": "75bba297-2f4a-4d44-b836-db602bb863a9",
    "title": "The 7 Habits of Highly Effective People",
    "author": "Stephen R. Covey",
    "category": "Management",
    "isbn": "9780743269513",
    "description": "A principle-centered approach to personal effectiveness.",
    "total_copies": 2,
    "available_copies": 2,
    "created_at": "2026-10-22T07:38:13.472232+00:00",
    "cover_url": "/__l5e/assets-v1/f79cf2f9-2ff0-488b-8950-707cb5fa09d1/9780743269513.jpg"
  },
  {
    "id": "a8a6b766-9f9c-4cb6-b29d-28a1494182ef",
    "title": "Atomic Habits",
    "author": "James Clear",
    "category": "Self-Help",
    "isbn": "9780735211292",
    "description": "Tiny changes, remarkable results: a guide to building good habits.",
    "total_copies": 3,
    "available_copies": 2,
    "created_at": "2026-10-22T07:38:13.472232+00:00",
    "cover_url": "/__l5e/assets-v1/dded81cf-a175-4c8f-a75a-b355c671a3eb/9780735211292.jpg"
  },
  {
    "id": "987603bc-276e-4f6e-9046-4e5455e0b8b6",
    "title": "Animal Farm",
    "author": "George Orwell",
    "category": "Literature",
    "isbn": "9780452284242",
    "description": "A satirical allegory of revolution and power.",
    "total_copies": 3,
    "available_copies": 3,
    "created_at": "2026-10-22T07:38:13.472232+00:00",
    "cover_url": "/__l5e/assets-v1/7352e62b-51f1-43e2-8174-df3b22f5cffb/9780452284242.jpg"
  },
  {
    "id": "63149be9-83e3-431b-bf69-ec36e3222819",
    "title": "Python Crash Course",
    "author": "Eric Matthes",
    "category": "Computer Science",
    "isbn": "9781593279288",
    "description": "A hands-on, project-based introduction to programming with Python.",
    "total_copies": 4,
    "available_copies": 4,
    "created_at": "2026-10-22T07:38:13.472232+00:00",
    "cover_url": "/__l5e/assets-v1/6a23ca6b-db02-45bb-be2d-dbac134a258c/9781593279288.jpg"
  },
  {
    "title": "Man's Search for Meaning",
    "author": "Viktor E. Frankl",
    "category": "Psychology",
    "isbn": "9780807014295",
    "description": "A psychiatrist experiences life in Nazi death camps and illuminates psychotherapeutic principles.",
    "total_copies": 3,
    "available_copies": 3,
    "cover_url": null
  },
  {
    "title": "The Man Who Mistook His Wife for a Hat",
    "author": "Oliver Sacks",
    "category": "Psychology",
    "isbn": "9780563406983",
    "description": "Clinical tales of patients struggling with perceptual and intellectual neurological disorders.",
    "total_copies": 3,
    "available_copies": 3,
    "cover_url": null
  },
  {
    "title": "Influence: The Psychology of Persuasion",
    "author": "Robert B. Cialdini",
    "category": "Psychology",
    "isbn": "9780061241895",
    "description": "Foundational work explaining why people say yes and how to apply these understandings.",
    "total_copies": 4,
    "available_copies": 4,
    "cover_url": null
  },
  {
    "title": "Quiet: The Power of Introverts",
    "author": "Susan Cain",
    "category": "Psychology",
    "isbn": "9780307352156",
    "description": "How society undervalues introverts and the tremendous benefits they bring to a noisy world.",
    "total_copies": 3,
    "available_copies": 3,
    "cover_url": null
  },
  {
    "title": "Molecular Biology of the Cell",
    "author": "Bruce Alberts",
    "category": "Biology",
    "isbn": "9780815344322",
    "description": "The definitive text in cell biology covering structure, function, and genetics.",
    "total_copies": 3,
    "available_copies": 3,
    "cover_url": null
  },
  {
    "title": "The Origin of Species",
    "author": "Charles Darwin",
    "category": "Biology",
    "isbn": "9780451529060",
    "description": "The foundational work of evolutionary biology introducing the principle of natural selection.",
    "total_copies": 4,
    "available_copies": 4,
    "cover_url": null
  },
  {
    "title": "The Immortal Life of Henrietta Lacks",
    "author": "Rebecca Skloot",
    "category": "Biology",
    "isbn": "9781400052189",
    "description": "The story of HeLa cells and their profound impact on modern medicine and bioethics.",
    "total_copies": 3,
    "available_copies": 3,
    "cover_url": null
  },
  {
    "title": "Silent Spring",
    "author": "Rachel Carson",
    "category": "Biology",
    "isbn": "9780618249060",
    "description": "The landmark environmental science text exposing the hazards of indiscriminate pesticide use.",
    "total_copies": 2,
    "available_copies": 2,
    "cover_url": null
  },
  {
    "title": "Cosmos",
    "author": "Carl Sagan",
    "category": "Science",
    "isbn": "9780345331359",
    "description": "The sweeping story of cosmic evolution, science, astronomy, and human civilization.",
    "total_copies": 4,
    "available_copies": 4,
    "cover_url": null
  },
  {
    "title": "A Short History of Nearly Everything",
    "author": "Bill Bryson",
    "category": "Science",
    "isbn": "9780767908184",
    "description": "An entertaining and accessible quest to understand how the universe and life came to be.",
    "total_copies": 3,
    "available_copies": 3,
    "cover_url": null
  },
  {
    "title": "The Structure of Scientific Revolutions",
    "author": "Thomas S. Kuhn",
    "category": "Science",
    "isbn": "9780262510882",
    "description": "A landmark study on paradigm shifts and how true scientific breakthroughs occur.",
    "total_copies": 3,
    "available_copies": 3,
    "cover_url": null
  },
  {
    "title": "Chemistry: The Central Science",
    "author": "Theodore L. Brown",
    "category": "Chemistry",
    "isbn": "9780134414232",
    "description": "Comprehensive foundation of chemical principles, reactions, and laboratory applications.",
    "total_copies": 4,
    "available_copies": 4,
    "cover_url": null
  },
  {
    "title": "Inorganic Chemistry",
    "author": "Gary L. Miessler",
    "category": "Chemistry",
    "isbn": "9780321811059",
    "description": "Thorough introduction to bonding theories, coordination chemistry, and organometallics.",
    "total_copies": 3,
    "available_copies": 3,
    "cover_url": null
  },
  {
    "title": "Physical Chemistry",
    "author": "Peter Atkins",
    "category": "Chemistry",
    "isbn": "9780198769866",
    "description": "Core principles of thermodynamics, quantum mechanics, and chemical reaction kinetics.",
    "total_copies": 3,
    "available_copies": 3,
    "cover_url": null
  },
  {
    "title": "The Disappearing Spoon",
    "author": "Sam Kean",
    "category": "Chemistry",
    "isbn": "9780316051644",
    "description": "Fascinating stories of history, human ambition, and elements across the periodic table.",
    "total_copies": 3,
    "available_copies": 3,
    "cover_url": null
  },
  {
    "title": "Deep Work",
    "author": "Cal Newport",
    "category": "Self-Help",
    "isbn": "9781455586691",
    "description": "Rules for focused success in a distracted world and cultivating deep, uninterrupted focus.",
    "total_copies": 4,
    "available_copies": 4,
    "cover_url": null
  },
  {
    "title": "Mindset: The New Psychology of Success",
    "author": "Carol S. Dweck",
    "category": "Self-Help",
    "isbn": "9780345472328",
    "description": "How developing a growth mindset unlocks resilience, achievement, and lifelong learning.",
    "total_copies": 3,
    "available_copies": 3,
    "cover_url": null
  },
  {
    "title": "The Subtle Art of Not Giving a F*ck",
    "author": "Mark Manson",
    "category": "Self-Help",
    "isbn": "9780062457714",
    "description": "A counterintuitive guide to living a good life by choosing what problems are worth having.",
    "total_copies": 3,
    "available_copies": 3,
    "cover_url": null
  },
  {
    "title": "Grit: The Power of Passion and Perseverance",
    "author": "Angela Duckworth",
    "category": "Self-Help",
    "isbn": "9781501111105",
    "description": "Why effort and persistence matter more than raw talent in reaching long-term goals.",
    "total_copies": 3,
    "available_copies": 3,
    "cover_url": null
  },
  {
    "title": "Freakonomics",
    "author": "Steven D. Levitt & Stephen J. Dubner",
    "category": "Economics",
    "isbn": "9780060731335",
    "description": "A rogue economist explores the hidden side of everyday phenomena using economic data.",
    "total_copies": 4,
    "available_copies": 4,
    "cover_url": null
  },
  {
    "title": "Capital in the Twenty-First Century",
    "author": "Thomas Piketty",
    "category": "Economics",
    "isbn": "9780674430006",
    "description": "A groundbreaking empirical analysis of historical wealth accumulation and inequality.",
    "total_copies": 3,
    "available_copies": 3,
    "cover_url": null
  },
  {
    "title": "Basic Economics",
    "author": "Thomas Sowell",
    "category": "Economics",
    "isbn": "9780465060733",
    "description": "A clear, common-sense explanation of economic principles without mathematical jargon.",
    "total_copies": 3,
    "available_copies": 3,
    "cover_url": null
  },
  {
    "title": "Guns, Germs, and Steel",
    "author": "Jared Diamond",
    "category": "History",
    "isbn": "9780393317558",
    "description": "The fates of human societies shaped by geographic and environmental advantages.",
    "total_copies": 4,
    "available_copies": 4,
    "cover_url": null
  },
  {
    "title": "The Silk Roads: A New History of the World",
    "author": "Peter Frankopan",
    "category": "History",
    "isbn": "9781101912379",
    "description": "An expansive reassessment of world history centred on the great trade arteries of Eurasia.",
    "total_copies": 3,
    "available_copies": 3,
    "cover_url": null
  },
  {
    "title": "Postwar: A History of Europe Since 1945",
    "author": "Tony Judt",
    "category": "History",
    "isbn": "9780143037750",
    "description": "Magisterial history of Europe's rebuilding and identity after the devastation of World War II.",
    "total_copies": 3,
    "available_copies": 3,
    "cover_url": null
  },
  {
    "title": "1491: New Revelations of the Americas Before Columbus",
    "author": "Charles C. Mann",
    "category": "History",
    "isbn": "9781400032051",
    "description": "Compelling archaeological evidence of thriving, sophisticated pre-Columbian societies.",
    "total_copies": 3,
    "available_copies": 3,
    "cover_url": null
  },
  {
    "title": "Good to Great",
    "author": "Jim Collins",
    "category": "Management",
    "isbn": "9780066620992",
    "description": "Why some companies make the leap to enduring greatness and others do not.",
    "total_copies": 4,
    "available_copies": 4,
    "cover_url": null
  },
  {
    "title": "The Lean Startup",
    "author": "Eric Ries",
    "category": "Management",
    "isbn": "9780307887894",
    "description": "How modern entrepreneurs use validated learning and rapid iteration to build products.",
    "total_copies": 3,
    "available_copies": 3,
    "cover_url": null
  },
  {
    "title": "The Hard Thing About Hard Things",
    "author": "Ben Horowitz",
    "category": "Management",
    "isbn": "9780062273208",
    "description": "Practical insights and battle-tested advice for leading teams through crisis and uncertainty.",
    "total_copies": 3,
    "available_copies": 3,
    "cover_url": null
  },
  {
    "title": "Zero to One",
    "author": "Peter Thiel",
    "category": "Management",
    "isbn": "9780804139298",
    "description": "How innovators create completely new paradigms rather than copying existing formulas.",
    "total_copies": 4,
    "available_copies": 4,
    "cover_url": null
  },
  {
    "title": "Calculus: Early Transcendentals",
    "author": "James Stewart",
    "category": "Mathematics",
    "isbn": "9781285741550",
    "description": "The quintessential calculus textbook combining mathematical rigour with applications.",
    "total_copies": 4,
    "available_copies": 4,
    "cover_url": null
  },
  {
    "title": "Higher Engineering Mathematics",
    "author": "B. S. Grewal",
    "category": "Mathematics",
    "isbn": "9788193328491",
    "description": "Comprehensive engineering mathematics with solved problems and applications.",
    "total_copies": 3,
    "available_copies": 3,
    "cover_url": "/__l5e/assets-v1/b81599ca-145b-4530-a42c-c12d23c41d6a/9788193328491.jpg"
  },
  {
    "title": "Principles of Mathematical Analysis",
    "author": "Walter Rudin",
    "category": "Mathematics",
    "isbn": "9780070542358",
    "description": "The classic 'Baby Rudin' introduction to real analysis, topology, and metric spaces.",
    "total_copies": 2,
    "available_copies": 2,
    "cover_url": null
  },
  {
    "title": "The Feynman Lectures on Physics",
    "author": "Richard P. Feynman",
    "category": "Physics",
    "isbn": "9780465023820",
    "description": "The legendary physics lectures presenting mechanics, radiation, and quantum phenomena.",
    "total_copies": 4,
    "available_copies": 4,
    "cover_url": null
  },
  {
    "title": "Concepts of Physics",
    "author": "H. C. Verma",
    "category": "Physics",
    "isbn": "9788177091878",
    "description": "Conceptual clarity and structured problem-solving across all major areas of physics.",
    "total_copies": 3,
    "available_copies": 3,
    "cover_url": "/__l5e/assets-v1/0f8b7497-e0d1-4ee9-b639-bd2957af004a/9788177091878.jpg"
  },
  {
    "title": "Introduction to Electrodynamics",
    "author": "David J. Griffiths",
    "category": "Physics",
    "isbn": "9781108420419",
    "description": "Renowned undergraduate text on electrostatics, magnetostatics, and Maxwell's equations.",
    "total_copies": 3,
    "available_copies": 3,
    "cover_url": null
  }
];

/**
 * Merges remote database books with the local catalog to ensure every one of the 12
 * categories always has at least 5 books displayed while keeping existing remote records intact.
 */
export function mergeBooksWithCatalog(remoteBooks: any[] = []): CatalogBook[] {
  if (!remoteBooks || remoteBooks.length === 0) {
    return DEFAULT_BOOKS;
  }

  const existingTitles = new Set(remoteBooks.map((b) => b.title.trim().toLowerCase()));
  const existingIsbns = new Set(remoteBooks.filter((b) => b.isbn).map((b) => b.isbn.trim()));

  const merged = [...remoteBooks];

  for (const book of DEFAULT_BOOKS) {
    const titleKey = book.title.trim().toLowerCase();
    const isbnKey = book.isbn ? book.isbn.trim() : null;

    if (!existingTitles.has(titleKey) && (!isbnKey || !existingIsbns.has(isbnKey))) {
      merged.push({
        ...book,
        id: book.id || `local-${book.isbn || Math.random().toString(36).slice(2)}`,
      });
      existingTitles.add(titleKey);
      if (isbnKey) existingIsbns.add(isbnKey);
    }
  }

  return merged.sort((a, b) => a.title.localeCompare(b.title));
}
