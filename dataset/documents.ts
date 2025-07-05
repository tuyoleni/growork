export interface Document {
  name: string;
  updated: string;
  category: string;
  note?: string;
}

export const DOCUMENT_FILTERS = [
  { icon: 'file-text', label: 'CV' },
  { icon: 'mail', label: 'Cover Letter' },
  { icon: 'award', label: 'Certificate' },
];

export const ALL_DOCUMENT_OPTIONS = [
  { icon: 'file-text', label: 'CV' },
  { icon: 'mail', label: 'Cover Letter' },
  { icon: 'award', label: 'Certificate' },
  { icon: 'file', label: 'Resume' },
  { icon: 'book', label: 'Portfolio' },
  { icon: 'clipboard', label: 'Application' },
  { icon: 'certificate', label: 'Diploma' },
  { icon: 'star', label: 'Reference' },
];

export const DOCUMENT_MENU_OPTIONS = ['Download', 'Share', 'Delete', 'Cancel'];

export const DOCUMENT_UPLOAD_OPTIONS = ['Cancel', 'Replace', 'Remove'];

// Mock document data for search
export const MOCK_DOCUMENTS: Document[] = [
  {
    name: 'Resume_2024.pdf',
    updated: 'Updated 2 days ago',
    category: 'CV',
    note: 'For tech positions',
  },
  {
    name: 'Portfolio_2024.pdf',
    updated: 'Updated 1 week ago',
    category: 'CV',
    note: 'Design portfolio',
  },
  {
    name: 'CoverLetter_Google.pdf',
    updated: 'Updated 3 days ago',
    category: 'Cover Letter',
    note: 'For Google application',
  },
  {
    name: 'Certificate_React.pdf',
    updated: 'Updated 2 months ago',
    category: 'Certificate',
    note: 'React certification',
  },
];

// Mock bookmarked documents
export const BOOKMARKED_DOCUMENTS: Document[] = [
  {
    name: 'Resume_2024.pdf',
    updated: 'Updated 2 days ago',
    category: 'CV',
    note: 'For tech positions',
  },
  {
    name: 'Portfolio_2024.pdf',
    updated: 'Updated 1 week ago',
    category: 'CV',
    note: 'Design portfolio',
  },
  {
    name: 'CoverLetter_Google.pdf',
    updated: 'Updated 3 days ago',
    category: 'Cover Letter',
    note: 'For Google application',
  },
  {
    name: 'Certificate_React.pdf',
    updated: 'Updated 2 months ago',
    category: 'Certificate',
    note: 'React certification',
  },
  {
    name: 'Certificate_NodeJS.pdf',
    updated: 'Updated 1 month ago',
    category: 'Certificate',
    note: 'Node.js certification',
  },
]; 