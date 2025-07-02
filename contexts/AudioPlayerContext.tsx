import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { audioPlaybackService, Song } from '../services/AudioPlaybackService';
import { AVPlaybackStatusSuccess } from 'expo-av';
import { useAllQueues } from './AllQueuesContext'; // Import useAllQueues

interface AudioPlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  playbackPositionMillis: number;
  playbackDurationMillis: number;
  loadAndPlayQueue: (queue: Song[], startIndex?: number) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  seek: (positionMillis: number) => Promise<void>;
  queue: Song[];
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(audioPlaybackService.getCurrentSong());
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackPositionMillis, setPlaybackPositionMillis] = useState<number>(0);
  const [playbackDurationMillis, setPlaybackDurationMillis] = useState<number>(0);
  // const [queue, setQueue] = useState<Song[]>([]); // This will now come from useAllQueues
  const { queues: allQueues, activeQueueId, isLoading: isLoadingQueues } = useAllQueues();

  // Effect to load active queue into player when it changes or on initial load
  useEffect(() => {
    if (!isLoadingQueues && activeQueueId) {
      const activeQueue = allQueues.find(q => q.id === activeQueueId);
      if (activeQueue) {
        // Load the active queue's songs into the audio service.
        // Decide if it should auto-play or just load. For now, let's just load.
        // If you want to preserve the current song if it's in the new queue, add more logic here.
        audioPlaybackService.loadAndPlayQueue(activeQueue.songs, 0);
        // If you don't want to auto-play on queue switch, you might need a different method in service,
        // e.g., loadQueueWithoutPlaying, or pass shouldPlay: false to loadAndPlayQueue.
        // For simplicity, current loadAndPlayQueue starts playing.
        setCurrentSong(audioPlaybackService.getCurrentSong());
      } else if (allQueues.length > 0 && !activeQueue) {
        // Active queue ID might be stale, default to first queue if available
        // This case should ideally be handled by AllQueuesContext setting a valid activeQueueId
      } else {
        // No active queue or no queues, clear playback
        audioPlaybackService.cleanup();
        setCurrentSong(null);
      }
    } else if (!isLoadingQueues && !activeQueueId) {
        // No active queue selected, clear playback
        audioPlaybackService.cleanup();
        setCurrentSong(null);
    }
  }, [activeQueueId, allQueues, isLoadingQueues]);


  useEffect(() => {
    audioPlaybackService.setPlaybackStatusListener((status) => {
      setIsPlaying(status.isPlaying);
      setPlaybackPositionMillis(status.positionMillis);
      setPlaybackDurationMillis(status.durationMillis || 0);
      // Update current song details if they change (e.g., duration becomes available)
      const songFromService = audioPlaybackService.getCurrentSong();
      if (songFromService && (!currentSong || songFromService.id !== currentSong.id || songFromService.durationMillis !== currentSong.durationMillis)) {
        setCurrentSong({...songFromService});
      }
    });

    audioPlaybackService.setTrackFinishedListener(() => {
      // This will trigger playNext in the service, which then updates status
      // and the new song will be set via playbackStatusListener
      console.log("Track finished, service will handle next.");
    });

    // Cleanup on unmount
    return () => {
      audioPlaybackService.cleanup();
    };
  }, []);

  const loadAndPlayQueue = async (newQueue: Song[], startIndex: number = 0) => {
    // This function might now be more about playing a specific list of songs
    // rather than setting the "active queue" for the whole app,
    // as active queue management is in AllQueuesContext.
    // However, it's still useful for playing an arbitrary list (e.g., from search results, or all songs).
    await audioPlaybackService.loadAndPlayQueue(newQueue, startIndex);
    // setQueue(newQueue); // No longer managing queue state directly here
    setCurrentSong(audioPlaybackService.getCurrentSong());
  };

  const play = async () => {
    await audioPlaybackService.play();
  };

  const pause = async () => {
    await audioPlaybackService.pause();
  };

  const playNext = async () => {
    await audioPlaybackService.playNext();
    setCurrentSong(audioPlaybackService.getCurrentSong());
  };

  const playPrevious = async () => {
    await audioPlaybackService.playPrevious();
    setCurrentSong(audioPlaybackService.getCurrentSong());
  };

  const seek = async (positionMillis: number) => {
    await audioPlaybackService.seek(positionMillis);
  };

  return (
    <AudioPlayerContext.Provider value={{
      currentSong,
      isPlaying,
      playbackPositionMillis,
      playbackDurationMillis,
      loadAndPlayQueue,
      play,
      pause,
      playNext,
      playPrevious,
      seek,
      // The queue exposed by this context should ideally be the songs from the *active* queue in AllQueuesContext
      // or the one currently loaded into the player by audioPlaybackService.
      queue: allQueues.find(q => q.id === activeQueueId)?.songs || [],
    }}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};
