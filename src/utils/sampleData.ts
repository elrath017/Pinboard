import { ImagePin } from '../types';

const toSvgDataUri = (svgString: string): string => {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString.trim())}`;
};

// SVG creators that exactly match the demo image cards
const createAspectCardSvg = (width: number, height: number, bgColor: string, label: string): string => {
  return toSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="auto">
      <rect width="${width}" height="${height}" fill="${bgColor}"/>
      <text x="${width / 2}" y="${height / 2 + 5}" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="16" fill="#18181b" text-anchor="middle">
        ${label}
      </text>
    </svg>
  `);
};

export const SAMPLE_PINS: ImagePin[] = [
  {
    id: 'sample-card-1',
    imageUrl: createAspectCardSvg(640, 360, '#c4b5fd', 'Landscape 16:9'),
    title: 'Project roadmap',
    caption: 'Q4 engineering sprint milestones and technical debt backlog.',
    tags: ['Roadmap', 'Backend', 'Dev'],
    pinnedAt: new Date(2026, 9, 20).getTime(), // Oct 20
    rotation: -1.2,
    pinStyle: 'pin-orange',
    pinSize: 24,
    order: 0,
  },
  {
    id: 'sample-card-2',
    imageUrl: createAspectCardSvg(400, 710, '#fef08a', 'Portrait 9:16'),
    title: 'Trip inspiration',
    caption: 'Hiking trails, travel gear checklist, and weekend getaway notes.',
    tags: ['Travel', 'Personal'],
    pinnedAt: new Date(2026, 9, 18).getTime(), // Oct 18
    rotation: 1.0,
    pinStyle: 'pin-purple',
    pinSize: 18,
    order: 1,
  },
  {
    id: 'sample-card-3',
    imageUrl: createAspectCardSvg(500, 500, '#bbf7d0', 'Square 1:1'),
    title: 'Study notes',
    caption: 'Distributed systems consensus algorithms: Raft vs Paxos comparison.',
    tags: ['CS', 'Algorithms', 'Notes'],
    pinnedAt: new Date(2026, 9, 15).getTime(), // Oct 15
    rotation: -0.9,
    pinStyle: 'pin-orange',
    pinSize: 22,
    order: 2,
  },
  {
    id: 'sample-card-4',
    imageUrl: createAspectCardSvg(600, 450, '#fbcfe8', 'Photo 4:3'),
    title: 'Design moodboard',
    caption: 'Neo-brutalist typography, hard drop shadows, and high-contrast badges.',
    tags: ['Design', 'UI', 'NeoBrutalist'],
    pinnedAt: new Date(2026, 9, 12).getTime(), // Oct 12
    rotation: 1.4,
    pinStyle: 'tape',
    order: 3,
  },
  {
    id: 'sample-card-5',
    imageUrl: createAspectCardSvg(450, 600, '#bfdbfe', 'Portrait 3:4'),
    title: 'Reminder poster',
    caption: 'Daily standup at 10:00 AM. Architecture sync every Thursday.',
    tags: ['Reminders', 'Work'],
    pinnedAt: new Date(2026, 9, 9).getTime(), // Oct 9
    rotation: -1.1,
    pinStyle: 'pin-purple',
    pinSize: 16,
    order: 4,
  },
  {
    id: 'sample-card-6',
    imageUrl: createAspectCardSvg(840, 360, '#fed7aa', 'Wide banner 21:9'),
    title: 'Weekly schedule',
    caption: 'Sprint review, customer interviews, and code deployment schedule.',
    tags: ['Schedule', 'Planning'],
    pinnedAt: new Date(2026, 9, 7).getTime(), // Oct 7
    rotation: 1.2,
    pinStyle: 'pin-orange',
    pinSize: 25,
    order: 5,
  }
];

export const INITIAL_DEMO_TASKS = [
  {
    id: 'task-1',
    title: 'Morning workout',
    completed: true,
    repeatDaily: true,
    createdAt: Date.now() - 3600000 * 5,
  },
  {
    id: 'task-2',
    title: 'Apply to 3 jobs',
    completed: true,
    repeatDaily: true,
    createdAt: Date.now() - 3600000 * 4,
  },
  {
    id: 'task-3',
    title: 'Read for 30 minutes',
    completed: true,
    repeatDaily: true,
    createdAt: Date.now() - 3600000 * 3,
  },
  {
    id: 'task-4',
    title: 'Work on portfolio',
    completed: false,
    repeatDaily: true,
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'task-5',
    title: 'Practice SQL',
    completed: false,
    repeatDaily: true,
    createdAt: Date.now() - 3600000,
  }
];
