"use client";

import AppHeader from "@/components/quick-note/app-header";
import NoteListSidebar from "@/components/quick-note/note-list-sidebar";
import NoteEditor from "@/components/quick-note/note-editor";
import { useNotes } from "@/hooks/use-notes";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Inbox } from "lucide-react";
import { useSession, signOut } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation'; // Import useRouter
import { useEffect } from 'react'; // Import useEffect

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter(); // Initialize useRouter

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const {
    notes,
    selectedNote,
    isLoading: areNotesLoading, // Rename to avoid conflict with session loading
    currentEditorContent,
    setCurrentEditorContent,
    currentEditorTags,
    addTagToSelectedNote,
    removeTagFromSelectedNote,
    handleSelectNote,
    handleCreateNewNote,
    handleSaveSelectedNote,
    handleDeleteNote,
    isAISuggesting,
    aiSuggestedTags,
    fetchAISuggestions,
    clearAISuggestions,
    saveStatus, // Add saveStatus
  } = useNotes();

  const isLoading = status === 'loading' || areNotesLoading; // Combined loading state

  if (isLoading) {
    // Only show skeleton if loading session or notes, and user is not unauthenticated (will redirect)
    if (status !== 'unauthenticated') {
      // Refined Skeleton Loader with improved responsiveness
      return (
        <div className="flex flex-col h-screen antialiased">
          {/* Skeleton for Header */}
          <header className="flex items-center h-16 px-6 border-b border-border bg-card">
             <Skeleton className="h-8 w-8 rounded-full" />
             <Skeleton className="h-6 w-24 ml-3" />
          </header>
          <div className="flex flex-1 overflow-hidden">
            {/* Skeleton for Sidebar */}
            <aside className="w-64 md:w-72 border-r border-border flex flex-col bg-card p-2 space-y-2">
                <Skeleton className="h-10 w-full mb-2" /> {/* New Note Button */}
                <div className="flex-1 space-y-1 p-2 overflow-y-auto">
                    <Skeleton className="h-14 w-full" /> {/* Note Item Skeleton */}
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full opacity-70" />
                    <Skeleton className="h-14 w-full opacity-50" />
                </div>
            </aside>
            {/* Skeleton for Editor Area */}
            <main className="flex-1 flex flex-col space-y-2 md:space-y-4 h-full overflow-auto">
                <div className="h-10 flex justify-end px-4 py-2">
                    <Skeleton className="h-8 w-20" /> {/* Sign out button */}
                </div>
                <div className="flex-1 mx-2 md:mx-4 flex flex-col overflow-hidden p-4 md:p-6 border rounded-lg bg-card space-y-4 shadow-sm">
                   {/* Header */}
                   <div>
                       <Skeleton className="h-7 w-1/3 mb-1" /> {/* Title */}
                       <Skeleton className="h-4 w-1/4" /> {/* Description */}
                   </div>
                   {/* Text Area */}
                   <Skeleton className="flex-1 min-h-[200px] md:min-h-[300px]" />
                   {/* Tags */}
                   <Skeleton className="h-5 w-16 mb-2" /> {/* Tags Label */}
                   <Skeleton className="h-8 w-full mb-2" /> {/* Tags Input */}
                   {/* AI Suggestions */}
                   <div className="p-3 rounded-md border border-border/30 bg-accent/20">
                     <div className="flex justify-between items-center mb-2">
                       <Skeleton className="h-5 w-32" /> {/* AI Label */}
                       <Skeleton className="h-8 w-32" /> {/* AI Button */}
                     </div>
                     <Skeleton className="h-8 w-full" /> {/* AI Tags */}
                   </div>
                   {/* Footer */}
                   <div className="flex justify-between border-t pt-3">
                       <Skeleton className="h-8 w-28" /> {/* AI Suggestions button */}
                       <Skeleton className="h-6 w-20 rounded-full" /> {/* Save Status */}
                   </div>
                </div>
            </main>
          </div>
        </div>
      );
    }
    return null; // Return null or a simple loading indicator while redirecting
  }

  // Don't render the main content if not authenticated (redirection handled by useEffect)
  if (status === 'unauthenticated') {
      return null;
  }

  return (
    <div className="flex flex-col h-screen antialiased">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        {/* Pass notes and handlers only if authenticated */}
        {session && (
            <NoteListSidebar
              notes={notes}
              selectedNoteId={selectedNote?.id || null}
              onCreateNote={handleCreateNewNote}
              onSelectNote={handleSelectNote}
              onDeleteNote={handleDeleteNote}
            />
        )}
        <main className="flex-1 flex flex-col bg-background overflow-y-auto relative">
          {/* Add Sign Out button if authenticated */}
          {session && (
            <div className="flex justify-end p-2 md:p-3 lg:p-4 sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/20">
              <Button variant="outline" size="sm" onClick={() => signOut()} className="shadow-sm">
                Sign Out
              </Button>
            </div>
          )}

          <div className="flex-1 flex flex-col max-h-[calc(100vh-4rem)] md:max-h-[calc(100vh-5rem)]">
            {selectedNote ? (
              <NoteEditor
                key={selectedNote.id} // Important: re-mounts editor on note change
                note={selectedNote}
                content={currentEditorContent}
                onContentChange={setCurrentEditorContent}
                tags={currentEditorTags}
                onAddTag={addTagToSelectedNote}
                onRemoveTag={removeTagFromSelectedNote}
                onGetAISuggestions={fetchAISuggestions}
                isLoadingAISuggestions={isAISuggesting}
                suggestedAITags={aiSuggestedTags}
                onClearAISuggestions={clearAISuggestions}
                saveStatus={saveStatus} // Pass saveStatus prop
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 md:p-8 text-muted-foreground">
                <Inbox className="h-16 w-16 md:h-24 md:w-24 mb-4 md:mb-6 text-primary/50" data-ai-hint="inbox empty" />
                <h2 className="text-xl md:text-2xl font-semibold mb-2">Welcome to QuickNote!</h2>
                <p className="max-w-md text-sm md:text-base">
                  Select a note from the sidebar to view or edit, or create a new one to get started.
                </p>
                {/* Create new note button when no note is selected */}
                <Button 
                  onClick={handleCreateNewNote}
                  className="mt-4 bg-primary/90 hover:bg-primary transition-colors"
                >
                  Create Your First Note
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
