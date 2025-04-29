import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the shape of the global state
interface Song {
  id: string;
  uri: string;
  filename: string;
  artist: string;
  duration: number;
}

interface GlobalStateContextProps {
  currentIndex: number | null;
  setCurrentIndex: (song: number | null) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  duration: number;
  setDuration: (duration: number) => void;
  queue: Song[];
  setQueue: (queue: Song[]) => void;
  currentSong: Song | null;
}

const GlobalStateContext = createContext<GlobalStateContextProps | undefined>(undefined);

export const GlobalStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentIndex, _setCurrentIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [queue, setQueue] = useState<Song[]>([]);
  const currentSong = queue[currentIndex || 0] || null;

  const setCurrentIndex = (index: number | null) => {
    _setCurrentIndex(index);
    setDuration(0);
    setIsPlaying(true);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isPlaying && queue.length > 0 && currentSong !== null) {
      interval = setInterval(() => {
        setDuration((prevDuration) => {
          // Play next song unless this was the last song
          if (prevDuration >= (currentSong?.duration || 0)) {
            const nextIndex = (currentIndex || 0) + 1;
            if (nextIndex < queue.length) {
              setCurrentIndex(nextIndex);
              setDuration(0);
            } else {
              setIsPlaying(false);
              clearInterval(interval as NodeJS.Timeout);
            }
            return 0;
          }
          return prevDuration + 1;
        });
      }, 1000);
    } else if (!isPlaying && interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) { clearInterval(interval); }
    };
  }, [isPlaying, queue, currentIndex, currentSong]);

  return (
    <GlobalStateContext.Provider value={{ currentIndex, setCurrentIndex, isPlaying, setIsPlaying, duration, setDuration, queue, setQueue, currentSong }}>
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = (): GlobalStateContextProps => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
};
