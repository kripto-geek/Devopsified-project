"use client";

import type { Note } from "@/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Trash2, FileText } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface NoteListSidebarProps {
  notes: Note[];
  selectedNoteId: string | null;
  onCreateNote: () => void;
  onSelectNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
}

export default function NoteListSidebar({
  notes,
  selectedNoteId,
  onCreateNote,
  onSelectNote,
  onDeleteNote,
}: NoteListSidebarProps) {
  return (
    <aside className="w-64 sm:w-72 border-r border-border flex flex-col bg-card shadow-sm">
      <div className="p-2 sm:p-4">
        <Button onClick={onCreateNote} className="w-full" variant="default">
          <PlusCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          New Note
        </Button>
      </div>
      <ScrollArea className="flex-1 overflow-x-hidden">
        {notes.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <FileText className="mx-auto h-10 w-10 sm:h-12 sm:w-12 mb-2" />
            <p className="text-sm sm:text-base">No notes yet.</p>
            <p className="text-xs sm:text-sm">Click "New Note" to start.</p>
          </div>
        ) : (
          <ul className="p-1 sm:p-2 space-y-1">
            {notes.map((note) => (
              <li key={note.id}>
                {/* Use div instead of button to avoid nesting issues */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectNote(note.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectNote(note.id); }} // Basic keyboard accessibility
                  className={cn(
                    "w-full text-left p-2 sm:p-3 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none cursor-pointer touch-action-manipulation", // Added cursor-pointer and touch-action
                    selectedNoteId === note.id ? "bg-primary/10 text-primary font-medium shadow-sm" : "text-foreground"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-xs sm:text-sm font-medium truncate pr-2 leading-tight">
                      {note.content.split('\n')[0] || "Untitled Note"}
                    </h3>
                     <AlertDialog>
                      <AlertDialogTrigger onClick={(e) => e.stopPropagation()}> {/* Stop propagation here */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                          // onClick moved to Trigger above
                          aria-label="Delete note"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Note?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the note "{note.content.split('\n')[0] || "Untitled Note"}". This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteNote(note.id)} className="bg-destructive hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                  </p>
                </div> {/* Close the div used instead of button */}
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </aside>
  );
}
