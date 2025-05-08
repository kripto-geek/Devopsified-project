"use client";

import type { Note } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { TagBadge } from "./tag-badge";
import { Sparkles, Loader2, Check, XCircle } from "lucide-react"; // Removed Save, Info; Added Check, XCircle
import { useState, useEffect } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";

interface NoteEditorProps {
  note: Note;
  content: string;
  onContentChange: (content: string) => void;
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  // onSaveNote prop is removed as saving is now automatic
  onGetAISuggestions: () => Promise<void>;
  isLoadingAISuggestions: boolean;
  suggestedAITags: string[];
  onClearAISuggestions: () => void;
  saveStatus: 'idle' | 'syncing' | 'saved' | 'error'; // Add saveStatus prop
}

export default function NoteEditor({
  note,
  content,
  onContentChange,
  tags,
  onAddTag,
  onRemoveTag,
  // onSaveNote prop removed
  onGetAISuggestions,
  isLoadingAISuggestions,
  suggestedAITags,
  onClearAISuggestions,
  saveStatus, // Destructure saveStatus
}: NoteEditorProps) {
  const [currentTagInput, setCurrentTagInput] = useState("");

  const handleAddTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentTagInput.trim()) {
      e.preventDefault();
      onAddTag(currentTagInput.trim());
      setCurrentTagInput("");
    }
  };
  
  const handleAddTagFromInput = () => {
    if (currentTagInput.trim()) {
      onAddTag(currentTagInput.trim());
      setCurrentTagInput("");
    }
  };

  useEffect(() => {
    // Clear suggestions when the note itself changes (via key prop)
    // This is a fallback, main clearing is in useNotes
    return () => {
      onClearAISuggestions();
    };
  }, [note.id, onClearAISuggestions]);


  return (
    <div className="flex-1 flex flex-col p-2 md:p-4 space-y-4 h-full">
      <Card className="flex-1 flex flex-col overflow-hidden shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Edit Note</CardTitle>
          <CardDescription>
            Last updated: {new Date(note.updatedAt).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col pt-0 space-y-4 overflow-y-auto">
          <ScrollArea className="flex-1 min-h-[200px] md:min-h-[300px]">
            <Textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="Start typing your note here..."
              className="flex-1 resize-none text-base w-full h-full min-h-[200px] md:min-h-[300px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              aria-label="Note content editor"
            />
          </ScrollArea>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-sm font-medium mb-2 text-foreground">Tags</h3>
            <ScrollArea className="max-h-[100px] pr-4">
              <div className="flex flex-wrap gap-2 mb-2 min-h-[2.5rem]">
                {tags.map((tag) => (
                  <TagBadge key={tag} tag={tag} onRemove={onRemoveTag} variant="secondary" />
                ))}
              </div>
            </ScrollArea>
            <div className="flex gap-2 items-center">
              <Input
                type="text"
                value={currentTagInput}
                onChange={(e) => setCurrentTagInput(e.target.value)}
                onKeyPress={handleAddTagKeyPress}
                placeholder="Add a tag and press Enter"
                className="flex-grow"
                aria-label="Add new tag"
              />
              <Button onClick={handleAddTagFromInput} variant="outline" size="sm">Add Tag</Button>
            </div>
          </div>

          <Separator />

          <div className="bg-accent/20 rounded-md p-3 border border-border/30">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-foreground flex items-center">
                  <Sparkles className="mr-2 h-4 w-4 text-primary" />
                  AI Tag Suggestions
                </h3>
                <Button 
                  onClick={onGetAISuggestions} 
                  disabled={isLoadingAISuggestions} 
                  variant="outline" 
                  size="sm"
                  className="bg-background hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                {isLoadingAISuggestions ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                )}
                Get Suggestions
                </Button>
            </div>
            <ScrollArea className="max-h-[100px]">
              {suggestedAITags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                  {suggestedAITags.map((tag) => (
                      <TagBadge
                      key={`ai-${tag}`}
                      tag={tag}
                      onClick={() => {
                          onAddTag(tag);
                          onClearAISuggestions(); // Optionally clear after adding one
                      }}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10 bg-background"
                      />
                  ))}
                  </div>
              ) : isLoadingAISuggestions ? (
                   <div className="text-sm text-muted-foreground py-2">Loading suggestions...</div>
              ) : (
                  <div className="text-sm text-muted-foreground py-2">No suggestions yet. Click "Get Suggestions" or add more content to your note.</div>
              )}
            </ScrollArea>
          </div>
        </CardContent>
        <CardFooter className="justify-between border-t pt-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onGetAISuggestions}
              disabled={isLoadingAISuggestions}
              className="text-xs h-8"
            >
              <Sparkles className="mr-1 h-3 w-3" />
              AI Suggestions
            </Button>
            {/* Display Save Status */}
            <div className="text-xs bg-muted/30 py-1 px-3 rounded-full flex items-center gap-1 transition-all duration-300">
            {saveStatus === 'syncing' && <> <Loader2 className="h-3 w-3 animate-spin" /> Saving... </>}
            {saveStatus === 'saved' && <> <Check className="h-3 w-3 text-green-500" /> Saved </>}
            {saveStatus === 'error' && <> <XCircle className="h-3 w-3 text-destructive" /> Error saving </>}
            {saveStatus === 'idle' && <> Ready </>}
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
