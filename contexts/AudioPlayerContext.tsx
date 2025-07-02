import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { audioPlaybackService, Song } from '../services/AudioPlaybackService';
import { AVPlaybackStatusSuccess } from 'expo-av';

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
  const [queue, setQueue] = useState<Song[]>([]);

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
    await audioPlaybackService.loadAndPlayQueue(newQueue, startIndex);
    setQueue(newQueue); // Update context's queue
    setCurrentSong(audioPlaybackService.getCurrentSong()); // Update context's current song
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
      queue,
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
