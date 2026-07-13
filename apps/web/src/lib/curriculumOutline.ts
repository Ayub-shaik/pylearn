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
      { title: 'Operators & Expressions', status: 'built' },
      { title: 'Strings in Depth', status: 'built' },
      { title: 'Input/Output', status: 'built' },
    ],
  },
  {
    title: 'Control Flow & Structure',
    topics: [
      { title: 'Conditionals', status: 'built' },
      { title: 'Loops', status: 'built' },
      { title: 'Functions', status: 'built' },
      { title: 'Lists & Tuples', status: 'built' },
      { title: 'Dictionaries & Sets', status: 'built' },
    ],
  },
  {
    title: 'Intermediate',
    topics: [
      { title: 'Comprehensions', status: 'built' },
      { title: 'Error Handling', status: 'built' },
      { title: 'File Handling', status: 'built' },
      { title: 'Modules & Packages', status: 'built' },
      { title: 'Standard Library Essentials', status: 'built' },
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
