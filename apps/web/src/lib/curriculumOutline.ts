export type TopicStatus = 'built' | 'planned' | 'elective';

export interface CurriculumTopic {
  title: string;
  status: TopicStatus;
}

export interface CurriculumTier {
  title: string;
  topics: CurriculumTopic[];
}

/**
 * The full target Python curriculum, agreed as a tiered outline — most of
 * this has no lesson content yet ('planned'). This is a preview of where
 * the course is going, separate from the per-lesson progress roadmap on
 * /tracks, which only reflects content that actually exists today.
 */
export const CURRICULUM: CurriculumTier[] = [
  {
    title: 'Foundations',
    topics: [
      { title: 'Getting Started', status: 'built' },
      { title: 'Variables & Data Types', status: 'built' },
      { title: 'Working with Types', status: 'built' },
      { title: 'Operators & Expressions', status: 'planned' },
      { title: 'Strings in Depth', status: 'planned' },
      { title: 'Input/Output', status: 'planned' },
    ],
  },
  {
    title: 'Control Flow & Structure',
    topics: [
      { title: 'Conditionals', status: 'planned' },
      { title: 'Loops', status: 'planned' },
      { title: 'Functions', status: 'planned' },
      { title: 'Lists & Tuples', status: 'planned' },
      { title: 'Dictionaries & Sets', status: 'planned' },
    ],
  },
  {
    title: 'Intermediate',
    topics: [
      { title: 'Comprehensions', status: 'planned' },
      { title: 'Error Handling', status: 'planned' },
      { title: 'File Handling', status: 'planned' },
      { title: 'Modules & Packages', status: 'planned' },
      { title: 'Standard Library Essentials', status: 'planned' },
    ],
  },
  {
    title: 'Object-Oriented Python',
    topics: [
      { title: 'Classes & Objects', status: 'planned' },
      { title: 'Inheritance & Polymorphism', status: 'planned' },
      { title: 'Dunder Methods', status: 'planned' },
      { title: 'Composition vs Inheritance', status: 'planned' },
    ],
  },
  {
    title: 'Advanced Python',
    topics: [
      { title: 'Iterators & Generators', status: 'planned' },
      { title: 'Decorators', status: 'planned' },
      { title: 'Context Managers', status: 'planned' },
      { title: 'Functional Tools', status: 'planned' },
      { title: 'Type Hints', status: 'planned' },
    ],
  },
  {
    title: 'Practical Python',
    topics: [
      { title: 'Testing with pytest', status: 'planned' },
      { title: 'Debugging & Logging', status: 'planned' },
      { title: 'Project Structure & Packaging', status: 'planned' },
      { title: 'Working with APIs', status: 'planned' },
      { title: 'Regular Expressions', status: 'planned' },
    ],
  },
  {
    title: 'Electives',
    topics: [
      { title: 'Automation & Scripting', status: 'elective' },
      { title: 'Networking Automation', status: 'elective' },
      { title: 'Data Handling (pandas)', status: 'elective' },
      { title: 'Web with Python (Flask/FastAPI)', status: 'elective' },
      { title: 'GUI (tkinter)', status: 'elective' },
    ],
  },
];
