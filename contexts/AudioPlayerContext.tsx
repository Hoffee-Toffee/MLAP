import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { audioPlaybackService, Song } from '../services/AudioPlaybackService';
import { AVPlaybackStatusSuccess } from 'expo-av';
import { useAllQueues } from './AllQueuesContext';

interface AudioPlayerContextType {
  // States for the UI-SELECTED ACTIVE queue
  currentSong: Song | null;
  isPlaying: boolean; // Reflects the isPlaying state of the UI-selected active queue
  // isActuallyPlayingAudio is removed, as isPlaying for the active queue now implies it's audible if sound is loaded.
  playbackPositionMillis: number;
  playbackDurationMillis: number;
  activeQueueSongs: Song[]; // Songs in the currently UI-selected active queue
  activeQueueVolume: number; // Volume of the UI-selected active queue

  // Actions for the UI-SELECTED ACTIVE queue
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
  setVolumeForActiveQueue: (volume: number) => Promise<void>; // New: for active queue volume
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const {
    queues: allQueuesFromContext,
    activeQueueId,
    isLoading: isLoadingQueues,
  } = useAllQueues();

  // State for the UI-selected active queue's playback details
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackPositionMillis, setPlaybackPositionMillis] = useState<number>(0);
  const [playbackDurationMillis, setPlaybackDurationMillis] = useState<number>(0);
  const [activeQueueSongs, setActiveQueueSongs] = useState<Song[]>([]);
  const [activeQueueVolume, setActiveQueueVolume] = useState<number>(1.0);


  const updateUIForActiveQueue = useCallback(() => {
    if (activeQueueId) {
      const state = audioPlaybackService.getQueuePlaybackState(activeQueueId);
      const songDetails = audioPlaybackService.getCurrentSongForQueue(activeQueueId);

      setCurrentSong(songDetails);
      setIsPlaying(state.isPlaying || false);
      setPlaybackPositionMillis(state.positionMillis || 0);
      setPlaybackDurationMillis(state.durationMillis || 0);
      setActiveQueueSongs(state.songs || []);
      setActiveQueueVolume(state.volume !== undefined ? state.volume : 1.0);
    } else {
      setCurrentSong(null);
      setIsPlaying(false);
      setPlaybackPositionMillis(0);
      setPlaybackDurationMillis(0);
      setActiveQueueSongs([]);
      setActiveQueueVolume(1.0);
    }
  }, [activeQueueId]);

  // Effect to synchronize AllQueuesContext with AudioPlaybackService
  useEffect(() => {
    if (isLoadingQueues) return;

    allQueuesFromContext.forEach(contextQueue => {
      audioPlaybackService.manageQueue(contextQueue.id, contextQueue.songs);
    });

    const serviceQueueIds = Array.from((audioPlaybackService as any).queueStates.keys());
    serviceQueueIds.forEach(serviceQueueId => {
      if (!allQueuesFromContext.find(contextQueue => contextQueue.id === serviceQueueId)) {
        audioPlaybackService.removeQueue(serviceQueueId);
      }
    });

    // No longer call setActiveAudioOutputQueue as it's removed.
    // The service now makes all "isPlaying" queues audible.
    // We just need to ensure the UI reflects the currently selected activeQueueId.
    updateUIForActiveQueue();

  }, [allQueuesFromContext, activeQueueId, isLoadingQueues, updateUIForActiveQueue]);


  // Listen to playback status updates from the service
  useEffect(() => {
    const statusListener = (queueId: string, status: AVPlaybackStatusSuccess) => {
      // Only update UI if the status update is for the currently UI-selected active queue
      if (queueId === activeQueueId) {
        setIsPlaying(status.isPlaying);
        setPlaybackPositionMillis(status.positionMillis);
        setPlaybackDurationMillis(status.durationMillis || 0);
        setCurrentSong(audioPlaybackService.getCurrentSongForQueue(activeQueueId));
        // Volume is part of getQueuePlaybackState, so updateUIForActiveQueue will catch it if it changed.
      }
    };

    const trackFinishedListener = (queueId: string) => {
      if (queueId === activeQueueId) {
        updateUIForActiveQueue();
      }
    };

    audioPlaybackService.addPlaybackStatusListener(statusListener);
    audioPlaybackService.addTrackFinishedListener(trackFinishedListener);

    return () => {
      audioPlaybackService.removePlaybackStatusListener(statusListener);
      audioPlaybackService.removeTrackFinishedListener(trackFinishedListener);
    };
  }, [activeQueueId, updateUIForActiveQueue]);


  // --- Actions for the UI-SELECTED ACTIVE queue ---
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
      // UI update will be triggered by listeners
    }
  };

  const playPrevious = async () => {
    if (activeQueueId) {
      await audioPlaybackService.playPrevious(activeQueueId);
      // UI update will be triggered by listeners
    }
  };

  const seek = async (positionMillis: number) => {
    if (activeQueueId) {
      await audioPlaybackService.seek(activeQueueId, positionMillis);
      // UI update will be triggered by listeners
    }
  };

  const loadSongsIntoAudioServiceQueue = async (queueId: string, songsToLoad: Song[], startIndex: number = 0) => {
    await audioPlaybackService.manageQueue(queueId, songsToLoad, startIndex);
    if (queueId === activeQueueId) {
        updateUIForActiveQueue();
    }
  };

  const setVolumeForActiveQueue = async (volume: number) => {
    if (activeQueueId) {
      await audioPlaybackService.setQueueVolume(activeQueueId, volume);
      updateUIForActiveQueue(); // Refresh UI to show new volume if displayed
    }
  };

  return (
    <AudioPlayerContext.Provider value={{
      currentSong,
      isPlaying,
      // isActuallyPlayingAudio, // Removed
      playbackPositionMillis,
      playbackDurationMillis,
      activeQueueSongs,
      activeQueueVolume,
      play,
      pause,
      playNext,
      playPrevious,
      seek,
      loadSongsIntoAudioServiceQueue,
      setVolumeForActiveQueue,
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
