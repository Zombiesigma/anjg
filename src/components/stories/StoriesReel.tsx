
'use client';

import { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { CreateStoryModal } from './CreateStoryModal';
import { StoryViewer } from './StoryViewer';
import type { Story, User as AppUser } from '@/lib/types';

interface StoriesReelProps {
  stories: Story[];
  isLoading: boolean;
  currentUserProfile: AppUser | null;
}

type StoryGroup = {
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  authorRole: string;
  stories: Story[];
};

export function StoriesReel({ stories, isLoading, currentUserProfile }: StoriesReelProps) {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [viewerState, setViewerState] = useState<{ isOpen: boolean; initialAuthorId: string | null }>({
    isOpen: false,
    initialAuthorId: null,
  });

  const storyGroups = useMemo(() => {
    const groups: { [key: string]: StoryGroup } = {};
    stories.forEach(story => {
      if (!groups[story.authorId]) {
        groups[story.authorId] = {
          authorId: story.authorId,
          authorName: story.authorName,
          authorAvatarUrl: story.authorAvatarUrl,
          authorRole: story.authorRole,
          stories: [],
        };
      }
      groups[story.authorId].stories.push(story);
    });
    return Object.values(groups);
  }, [stories]);

  // Semua pengguna yang sudah login dapat membuat cerita
  const canCreateStory = !!currentUserProfile;

  const openViewer = (authorId: string) => {
    setViewerState({ isOpen: true, initialAuthorId: authorId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 pb-4 border-b">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-16 rounded-full" />
        ))}
      </div>
    );
  }
  
  if (stories.length === 0 && !canCreateStory) {
    return null;
  }

  return (
    <>
      {canCreateStory && (
        <CreateStoryModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setCreateModalOpen(false)}
          currentUserProfile={currentUserProfile}
        />
      )}
      {viewerState.isOpen && viewerState.initialAuthorId && (
        <StoryViewer 
            stories={stories}
            initialAuthorId={viewerState.initialAuthorId}
            isOpen={viewerState.isOpen}
            onClose={() => setViewerState({ isOpen: false, initialAuthorId: null })}
        />
      )}

      <div className="flex items-center gap-4 pb-4 border-b overflow-x-auto no-scrollbar">
        {canCreateStory && (
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed hover:border-primary transition-colors"
            >
              <Plus className="h-6 w-6 text-muted-foreground" />
            </button>
            <p className="text-xs font-medium">Buat Cerita</p>
          </div>
        )}
        {storyGroups.map(group => (
          <div key={group.authorId} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <button 
                onClick={() => openViewer(group.authorId)} 
                className={`w-fit h-fit p-0.5 rounded-full ${group.authorRole === 'penulis' || group.authorRole === 'admin' ? 'bg-gradient-to-tr from-blue-500 to-primary' : 'bg-muted border border-border'}`}
            >
              <Avatar className="w-16 h-16 border-2 border-background">
                <AvatarImage src={group.authorAvatarUrl} alt={group.authorName} />
                <AvatarFallback>{group.authorName.charAt(0)}</AvatarFallback>
              </Avatar>
            </button>
            <p className="text-xs w-16 truncate text-center">{group.authorName}</p>
          </div>
        ))}
      </div>
    </>
  );
}
