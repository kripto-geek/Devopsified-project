export interface Note {
  id: string;
  userId: string; // Add userId to link notes to users
  content: string;
  tags: string[];
  createdAt: string; // ISO string date
  updatedAt: string; // ISO string date
}
