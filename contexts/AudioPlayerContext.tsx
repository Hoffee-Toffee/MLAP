import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { audioPlaybackService, Song } from '../services/AudioPlaybackService';
import { AVPlaybackStatusSuccess } from 'expo-av';
import { useAllQueues } from './AllQueuesContext';

interface AudioPlayerContextType {
  // States for the ACTIVE queue
  currentSong: Song | null;
  isPlaying: boolean; // Intended play state of the active queue
  isActuallyPlayingAudio: boolean; // Is the active queue currently outputting audio
  playbackPositionMillis: number;
  playbackDurationMillis: number;
  activeQueueSongs: Song[]; // Songs in the currently active queue

  // Actions for the ACTIVE queue
  play: () => Promise<void>;
  pause: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  seek: (positionMillis: number) => Promise<void>;

  // This function is for loading a list of songs into a *specific* queue (which might be the active one or another)
  // and then ensuring the audio service is aware of these songs for playback.
  // The AllQueuesContext is responsible for the actual state of queues (name, song list).
  // This function bridges that by telling the audio service to use those songs for a given queueId.
  // It's not about *playing* them immediately from an arbitrary list anymore, but preparing a managed queue.
  loadSongsIntoAudioServiceQueue: (queueId: string, songs: Song[], startIndex?: number) => Promise<void>;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const {
    queues: allQueuesFromContext, // Renamed to avoid confusion
    activeQueueId,
    isLoading: isLoadingQueues,
  } = useAllQueues();

  // State for the active queue's playback details
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false); // Intended play state for active queue
  const [isActuallyPlayingAudio, setIsActuallyPlayingAudio] = useState<boolean>(false);
  const [playbackPositionMillis, setPlaybackPositionMillis] = useState<number>(0);
  const [playbackDurationMillis, setPlaybackDurationMillis] = useState<number>(0);
  const [activeQueueSongs, setActiveQueueSongs] = useState<Song[]>([]);


  const updateUIForActiveQueue = useCallback(() => {
    if (activeQueueId) {
      const state = audioPlaybackService.getQueuePlaybackState(activeQueueId);
      const songDetails = audioPlaybackService.getCurrentSongForQueue(activeQueueId);

      setCurrentSong(songDetails);
      setIsPlaying(state.isPlaying || false);
      setIsActuallyPlayingAudio(state.isActuallyPlayingAudio || false);
      setPlaybackPositionMillis(state.positionMillis || 0);
      setPlaybackDurationMillis(state.durationMillis || 0);
      setActiveQueueSongs(state.songs || []);
    } else {
      setCurrentSong(null);
      setIsPlaying(false);
      setIsActuallyPlayingAudio(false);
      setPlaybackPositionMillis(0);
      setPlaybackDurationMillis(0);
      setActiveQueueSongs([]);
    }
  }, [activeQueueId]);


  // Effect to synchronize AllQueuesContext with AudioPlaybackService
  useEffect(() => {
    if (isLoadingQueues) return;

    // 1. Update/Add queues in the service based on AllQueuesContext
    allQueuesFromContext.forEach(contextQueue => {
      // Consider a more sophisticated check if only songs changed, or if index needs reset
      audioPlaybackService.manageQueue(contextQueue.id, contextQueue.songs);
    });

    // 2. Remove queues from the service that are no longer in AllQueuesContext
    const serviceQueueIds = Array.from((audioPlaybackService as any).queueStates.keys());
    serviceQueueIds.forEach(serviceQueueId => {
      if (!allQueuesFromContext.find(contextQueue => contextQueue.id === serviceQueueId)) {
        audioPlaybackService.removeQueue(serviceQueueId);
      }
    });

    // 3. Set the active audio output queue in the service
    audioPlaybackService.setActiveAudioOutputQueue(activeQueueId);

    // 4. Update UI based on the (potentially new) active queue
    updateUIForActiveQueue();

  }, [allQueuesFromContext, activeQueueId, isLoadingQueues, updateUIForActiveQueue]);


  // Listen to playback status updates from the service
  useEffect(() => {
    const statusListener = (queueId: string, status: AVPlaybackStatusSuccess) => {
      // Always update the service's internal intended state first if needed
      const serviceQueueState = audioPlaybackService.getQueuePlaybackState(queueId);
      if (serviceQueueState.isPlaying !== status.isPlaying && status.didJustFinish) {
         // If a song finished, audioPlaybackService.playNext (called by trackFinishedListener)
         // will handle setting the correct intended 'isPlaying' state for the next song.
      }

      // Only update UI if the status update is for the currently active queue
      if (queueId === activeQueueId) {
        setIsPlaying(status.isPlaying);
        setPlaybackPositionMillis(status.positionMillis);
        setPlaybackDurationMillis(status.durationMillis || 0);
        setCurrentSong(audioPlaybackService.getCurrentSongForQueue(activeQueueId)); // Refresh song details
        setIsActuallyPlayingAudio(status.isPlaying); // if it's the active queue and playing, it's actually playing audio
      }
    };

    const trackFinishedListener = (queueId: string) => {
      // The service automatically calls playNext(queueId).
      // We just need to update the UI if the finished track was in the active queue.
      if (queueId === activeQueueId) {
        // Fetch the new state from the service for the active queue
        updateUIForActiveQueue();
      }
    };

    audioPlaybackService.addPlaybackStatusListener(statusListener);
    audioPlaybackService.addTrackFinishedListener(trackFinishedListener);

    return () => {
      audioPlaybackService.removePlaybackStatusListener(statusListener);
      audioPlaybackService.removeTrackFinishedListener(trackFinishedListener);
      // Consider if audioPlaybackService.cleanup() is needed here or at app exit.
      // For now, let listeners be removed, service persists.
    };
  }, [activeQueueId, updateUIForActiveQueue]);


  // --- Actions for the ACTIVE queue ---
  const play = async () => {
    if (activeQueueId) {
      await audioPlaybackService.play(activeQueueId);
      updateUIForActiveQueue();
    }
  };

  const pause = async () => {
    if (activeQueueId) {
      await audioPlaybackService.pause(activeQueueId);
      updateUIForActiveQueue();
    }
  };

  const playNext = async () => {
    if (activeQueueId) {
      await audioPlaybackService.playNext(activeQueueId);
      // UI update will be triggered by status/trackFinished listeners
    }
  };

  const playPrevious = async () => {
    if (activeQueueId) {
      await audioPlaybackService.playPrevious(activeQueueId);
      // UI update will be triggered by status/trackFinished listeners
    }
  };

  const seek = async (positionMillis: number) => {
    if (activeQueueId) {
      await audioPlaybackService.seek(activeQueueId, positionMillis);
      // Position update will come via status listener
    }
  };

  const loadSongsIntoAudioServiceQueue = async (queueId: string, songsToLoad: Song[], startIndex: number = 0) => {
    // This function ensures the audio service's version of a queue is updated.
    // The AllQueuesContext is the source of truth for queue definitions (name, song list).
    // This is mostly for initial load or if songs are programmatically changed outside user interaction.
    await audioPlaybackService.manageQueue(queueId, songsToLoad, startIndex);
    if (queueId === activeQueueId) {
        updateUIForActiveQueue(); // Refresh UI if the active queue was affected
    }
  };

  return (
    <AudioPlayerContext.Provider value={{
      currentSong,
      isPlaying,
      isActuallyPlayingAudio,
      playbackPositionMillis,
      playbackDurationMillis,
      activeQueueSongs,
      play,
      pause,
      playNext,
      playPrevious,
      seek,
      loadSongsIntoAudioServiceQueue,
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
