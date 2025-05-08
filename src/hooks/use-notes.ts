"use client";

import type { Note } from "@/types";
import { useState, useEffect, useCallback, useRef } from "react"; // Import useRef
import { useToast } from "@/hooks/use-toast";
import { suggestTags } from "@/ai/flows/suggest-tags";
import { useSession } from 'next-auth/react'; // Import useSession

export function useNotes() {
  const { data: session, status } = useSession(); // Get session data
  // Assert session.user has id after checking session exists
  const userId = session?.user ? (session.user as { id: string }).id : undefined;

  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [currentEditorContent, setCurrentEditorContent] = useState<string>("");
  const [currentEditorTags, setCurrentEditorTags] = useState<string[]>([]);

  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const [aiSuggestedTags, setAISuggestedTags] = useState<string[]>([]);

  // Fetch notes from the API when session is authenticated
  useEffect(() => {
    if (status === 'authenticated' && userId) {
      const fetchNotes = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch('/api/notes');
          if (!response.ok) {
            throw new Error(`Failed to fetch notes: ${response.statusText}`);
          }
          const data: Note[] = await response.json();
          setNotes(data);
        } catch (err) {
          console.error("Error fetching notes:", err);
          setError('Failed to load notes.');
          toast({
            title: "Error",
            description: "Could not load your notes.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchNotes();
    } else if (status !== 'loading') {
       // If not authenticated and not loading, clear notes
       setNotes([]);
       setSelectedNoteId(null);
       setIsLoading(false);
    }
  }, [status, userId, toast]); // Depend on status and userId

  const selectedNote = notes.find((note) => note.id === selectedNoteId);

  useEffect(() => {
    if (selectedNote) {
      setCurrentEditorContent(selectedNote.content);
      setCurrentEditorTags([...selectedNote.tags]);
      clearAISuggestions(); // Clear suggestions when note changes
    } else {
      setCurrentEditorContent("");
      setCurrentEditorTags([]);
      clearAISuggestions();
    }
    setSaveStatus('idle'); // Reset status when note changes
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); // Clear pending saves
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current); // Clear pending idle transition
  }, [selectedNoteId, selectedNote]);

  const handleSelectNote = useCallback((noteId: string | null) => {
    setSelectedNoteId(noteId);
  }, []);

  const handleCreateNewNote = useCallback(async () => {
    console.log('[handleCreateNewNote] Called. userId:', userId); // Add logging
     if (!userId) return; // Require user ID to create note

    // Create a temporary note for immediate UI feedback
    const tempId = `temp-${Date.now()}`;
     const newNote: Note = {
       id: tempId,
       userId: userId, // Include userId (though server will add it too)
       content: "",
       tags: [],
       createdAt: new Date().toISOString(),
       updatedAt: new Date().toISOString(),
     };

     setNotes((prevNotes) => [newNote, ...prevNotes]);
     setSelectedNoteId(newNote.id);
     // Don't save to DB immediately, wait for user interaction via handleSaveSelectedNote
     toast({
       title: "New Note Created",
       description: "Start typing and save your note.",
     });

   }, [userId, toast]);

   const handleSaveSelectedNote = useCallback(async () => {
     if (!selectedNoteId || !userId || saveStatus === 'syncing') return; // Prevent concurrent saves

     // Clear any pending save timeout as we are saving now
     if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
     if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);

     setSaveStatus('syncing');
     setError(null); // Clear previous errors on new save attempt

    const isNewNote = selectedNoteId.startsWith('temp-');
    const originalNotes = [...notes]; // Store original state for potential rollback

    // === Handle Saving a NEW Note (POST) ===
    if (isNewNote) {
      // Optimistically update the temporary note's content/tags before saving
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === selectedNoteId
            ? {
                ...note,
                content: currentEditorContent,
                tags: [...currentEditorTags],
                updatedAt: new Date().toISOString(), // Update timestamp
              }
            : note
        )
      );

      try {
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: currentEditorContent, tags: currentEditorTags }),
        });

        if (!response.ok) {
          setNotes(originalNotes); // Rollback optimistic update
          throw new Error(`Failed to create note: ${response.statusText}`);
        }

        const createdNote: Note = await response.json();

        // Replace the temporary note with the real one from the server
        setNotes(prevNotes => prevNotes.map(note => note.id === selectedNoteId ? createdNote : note));
        // Update the selected ID to the real one
        setSelectedNoteId(createdNote.id);

        toast({
          title: "Note Saved",
          description: "Your changes have been saved.",
         });
         setSaveStatus('saved');
         // Status will reset on next action or note change

       } catch (err) {
         console.error("Error creating note:", err);
         setError('Failed to save new note.');
         setNotes(originalNotes); // Rollback optimistic update
        setSelectedNoteId(selectedNoteId); // Keep temp ID selected on failure
        setSaveStatus('error'); // Set error status
        toast({
          title: "Error",
          description: "Could not save the new note.",
          variant: "destructive",
        });
      }
      return; // Stop execution after handling new note save
    }

    // === Handle Updating an EXISTING Note (PUT) ===
    const noteToUpdate = notes.find(note => note.id === selectedNoteId);
    if (!noteToUpdate) return;

    // Optimistic Update for Existing Note
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === selectedNoteId
           ? {
               ...note,
               content: currentEditorContent,
               tags: [...currentEditorTags],
               updatedAt: new Date().toISOString(), // Optimistic update timestamp
             }
           : note
       )
     );

    try {
        const response = await fetch(`/api/notes/${selectedNoteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: currentEditorContent, tags: currentEditorTags }),
        });

        if (!response.ok) {
            // If save fails, revert optimistic update
            setNotes(originalNotes);
            // Restore editor content/tags if needed (might be slightly out of sync if user typed more)
            // For simplicity, we're just reverting the list state here.
            // You could store original editor content/tags for a more precise rollback.
            setCurrentEditorContent(noteToUpdate.content);
            setCurrentEditorTags([...noteToUpdate.tags]);
            throw new Error(`Failed to save note: ${response.statusText}`);
        }

        // Server might return the updated note, you could use it if needed
        const savedNote: Note = await response.json();
        // Update the specific note with server data for consistency (optional but good practice)
         setNotes((prevNotes) =>
           prevNotes.map((note) =>
             note.id === savedNote.id ? savedNote : note
           )
         );


        toast({
           title: "Note Saved",
           description: "Your new note has been saved.",
         });
         setSaveStatus('saved');
         // Status will reset on next action or note change

     } catch (err) {
         console.error("Error saving note:", err);
         setError('Failed to save note.');
         toast({
          title: "Error",
          description: "Could not save note.",
          variant: "destructive",
        });
        // Revert optimistic update on error
        setNotes(originalNotes);
        setCurrentEditorContent(noteToUpdate.content);
        setCurrentEditorTags([...noteToUpdate.tags]);
        setSaveStatus('error'); // Set error status
    }

  }, [selectedNoteId, currentEditorContent, currentEditorTags, userId, toast, notes, saveStatus]); // Added saveStatus dependency

  const handleDeleteNote = useCallback(async (noteId: string) => {
     // If deleting a temporary unsaved note, just remove it locally
      if (noteId.startsWith('temp-')) {
          setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
          if (selectedNoteId === noteId) {
              setSelectedNoteId(null);
          }
          return;
      }

      if (!userId) return; // Require user ID for deleting saved notes

      const originalNotes = [...notes]; // Store for potential rollback

      // Optimistically remove the note
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
      if (selectedNoteId === noteId) {
        setSelectedNoteId(null);
      }

      try {
        const response = await fetch(`/api/notes/${noteId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
             // If delete fails, refetch notes to revert optimistic update
             const fetchResponse = await fetch('/api/notes');
             const latestNotes: Note[] = await fetchResponse.json();
             setNotes(latestNotes);
            throw new Error(`Failed to delete note: ${response.statusText}`);
        }

        toast({
           title: "Note Deleted",
           description: "The note has been successfully deleted.",
         });

      } catch (err) {
          console.error("Error deleting note:", err);
          setError('Failed to delete note.');
           toast({
             title: "Error",
             description: "Could not delete note.",
             variant: "destructive",
           });
           // Revert optimistic delete on error
           setNotes(originalNotes);
           // If the deleted note was selected, re-select it after rollback
           if (selectedNoteId === null && originalNotes.some(n => n.id === noteId)) {
               setSelectedNoteId(noteId);
           }
      }

    },
    [selectedNoteId, userId, toast, notes] // Added notes to dependency array
  );

  const addTagToSelectedNote = useCallback((tag: string) => {
    if (!tag.trim()) return;
    setCurrentEditorTags(prevTags => {
      const newTags = [...new Set([...prevTags, tag.trim()])];
      return newTags;
    });
  }, []);

  const removeTagFromSelectedNote = useCallback((tagToRemove: string) => {
    setCurrentEditorTags(prevTags => prevTags.filter(tag => tag !== tagToRemove));
  }, []);

  const fetchAISuggestions = useCallback(async () => {
    if (!selectedNoteId || !currentEditorContent.trim()) {
      toast({
        title: "Cannot Suggest Tags",
        description: "Note content is empty. Write something to get suggestions.",
        variant: "destructive",
      });
      return;
    }
    setIsAISuggesting(true);
    setAISuggestedTags([]);
    try {
      const result = await suggestTags({ noteContent: currentEditorContent });
      setAISuggestedTags(result.tags);
      if (result.tags.length === 0) {
        toast({
          title: "AI Suggestions",
          description: "No specific tags suggested. Try adding more content.",
        });
      }
    } catch (error) {
      console.error("Error fetching AI tag suggestions:", error);
      toast({
        title: "AI Suggestion Error",
        description: "Could not fetch tag suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAISuggesting(false);
    }
  }, [selectedNoteId, currentEditorContent, toast]);

  const clearAISuggestions = useCallback(() => {
    setAISuggestedTags([]);
  }, []);

  // Effect for debounced auto-save
  useEffect(() => {
    if (saveStatus === 'syncing' || !selectedNoteId) {
      // Don't trigger save if already saving or no note is selected
      return;
    }

    // Clear previous timeouts
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);

    // If content or tags are actually different from the saved note, schedule a save
    const selectedNoteData = notes.find(n => n.id === selectedNoteId);
    if (selectedNoteData && (selectedNoteData.content !== currentEditorContent || JSON.stringify(selectedNoteData.tags) !== JSON.stringify(currentEditorTags))) {

       // Reset status to idle when changes are detected before scheduling save
       if (saveStatus !== 'idle') {
           setSaveStatus('idle');
       }

        saveTimeoutRef.current = setTimeout(() => {
            // Only save if not a new unsaved note with no content
            if (selectedNoteId.startsWith('temp-') && !currentEditorContent.trim()) {
                console.log("Skipping auto-save for empty new note.");
                return;
            }
            handleSaveSelectedNote();
        }, 1500); // Auto-save after 1.5 seconds of inactivity
    }


    return () => {
      // Clear timeout on cleanup
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, [currentEditorContent, currentEditorTags, selectedNoteId, handleSaveSelectedNote, saveStatus, notes]);


  return {
    notes,
    selectedNote,
    isLoading,
    error,
    currentEditorContent,
    setCurrentEditorContent,
    currentEditorTags,
    // Exposed setters for direct manipulation if needed, or specific handlers
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
    saveStatus // Expose save status
  };
}
