import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song } from '../services/AudioPlaybackService'; // Assuming Song type is exported

export interface Queue {
  id: string;
  name: string;
  songs: Song[];
}

interface AllQueuesContextType {
  queues: Queue[];
  activeQueueId: string | null;
  setActiveQueueId: (id: string | null) => void;
  addQueue: (name: string, songs?: Song[]) => Promise<void>;
  deleteQueue: (id: string) => Promise<void>;
  renameQueue: (id: string, newName: string) => Promise<void>;
  addSongsToQueue: (queueId: string, songsToAdd: Song[]) => Promise<void>;
  removeSongsFromQueue: (queueId: string, songIdsToRemove: string[]) => Promise<void>;
  reorderSongsInQueue: (queueId: string, newSongsOrder: Song[]) => Promise<void>;
  isLoading: boolean;
}

const AllQueuesContext = createContext<AllQueuesContextType | undefined>(undefined);

const STORAGE_KEY = '@all_queues_storage';

export const AllQueuesProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [activeQueueId, setActiveQueueIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadState = async () => {
      setIsLoading(true);
      try {
        const storedState = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedState) {
          const { queues: storedQueues, activeQueueId: storedActiveQueueId } = JSON.parse(storedState);
          setQueues(storedQueues || []);
          setActiveQueueIdState(storedActiveQueueId || (storedQueues.length > 0 ? storedQueues[0].id : null));
        } else {
          // Initialize with a default "Main Queue" if nothing is stored
          const defaultQueueId = `queue-${Date.now()}`;
          setQueues([{ id: defaultQueueId, name: 'Main Queue', songs: [] }]);
          setActiveQueueIdState(defaultQueueId);
        }
      } catch (e) {
        console.error("Failed to load queues from storage", e);
        // Fallback to a default state in case of error
        const defaultQueueId = `queue-${Date.now()}-error`;
        setQueues([{ id: defaultQueueId, name: 'Main Queue', songs: [] }]);
        setActiveQueueIdState(defaultQueueId);
      } finally {
        setIsLoading(false);
      }
    };
    loadState();
  }, []);

  const saveState = async (newQueues: Queue[], newActiveQueueId: string | null) => {
    try {
      const stateToStore = JSON.stringify({ queues: newQueues, activeQueueId: newActiveQueueId });
      await AsyncStorage.setItem(STORAGE_KEY, stateToStore);
    } catch (e) {
      console.error("Failed to save queues to storage", e);
    }
  };

  const setActiveQueueId = (id: string | null) => {
    setActiveQueueIdState(id);
    saveState(queues, id);
  };

  const addQueue = async (name: string, songs: Song[] = []) => {
    const newQueue: Queue = { id: `queue-${Date.now()}`, name, songs };
    const updatedQueues = [...queues, newQueue];
    setQueues(updatedQueues);
    if (!activeQueueId && updatedQueues.length === 1) { // If it's the first queue, make it active
        setActiveQueueIdState(newQueue.id);
        await saveState(updatedQueues, newQueue.id);
    } else {
        await saveState(updatedQueues, activeQueueId);
    }
  };

  const deleteQueue = async (id: string) => {
    const updatedQueues = queues.filter(q => q.id !== id);
    setQueues(updatedQueues);
    let newActiveQueueId = activeQueueId;
    if (activeQueueId === id) {
      newActiveQueueId = updatedQueues.length > 0 ? updatedQueues[0].id : null;
      setActiveQueueIdState(newActiveQueueId);
    }
    await saveState(updatedQueues, newActiveQueueId);
  };

  const renameQueue = async (id: string, newName: string) => {
    const updatedQueues = queues.map(q => q.id === id ? { ...q, name: newName } : q);
    setQueues(updatedQueues);
    await saveState(updatedQueues, activeQueueId);
  };

  const addSongsToQueue = async (queueId: string, songsToAdd: Song[]) => {
    const updatedQueues = queues.map(q => {
      if (q.id === queueId) {
        // Avoid duplicates by checking song IDs
        const newSongs = songsToAdd.filter(sNew => !q.songs.some(sOld => sOld.id === sNew.id));
        return { ...q, songs: [...q.songs, ...newSongs] };
      }
      return q;
    });
    setQueues(updatedQueues);
    await saveState(updatedQueues, activeQueueId);
  };

  const removeSongsFromQueue = async (queueId: string, songIdsToRemove: string[]) => {
    const updatedQueues = queues.map(q => {
      if (q.id === queueId) {
        return { ...q, songs: q.songs.filter(s => !songIdsToRemove.includes(s.id)) };
      }
      return q;
    });
    setQueues(updatedQueues);
    await saveState(updatedQueues, activeQueueId);
  };

  const reorderSongsInQueue = async (queueId: string, newSongsOrder: Song[]) => {
    const updatedQueues = queues.map(q => {
      if (q.id === queueId) {
        return { ...q, songs: newSongsOrder };
      }
      return q;
    });
    setQueues(updatedQueues);
    await saveState(updatedQueues, activeQueueId);
  };


  return (
    <AllQueuesContext.Provider value={{
      queues,
      activeQueueId,
      setActiveQueueId,
      addQueue,
      deleteQueue,
      renameQueue,
      addSongsToQueue,
      removeSongsFromQueue,
      reorderSongsInQueue,
      isLoading
    }}>
      {children}
    </AllQueuesContext.Provider>
  );
};

export const useAllQueues = () => {
  const context = useContext(AllQueuesContext);
  if (context === undefined) {
    throw new Error('useAllQueues must be used within an AllQueuesProvider');
  }
  return context;
};
