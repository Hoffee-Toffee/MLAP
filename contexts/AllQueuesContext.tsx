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
  const [activeQueueId, setActiveQueueIdInternal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [previousActiveQueueId, setPreviousActiveQueueId] = useState<string | null>(null);


  useEffect(() => {
    const loadState = async () => {
      setIsLoading(true);
      try {
        const storedState = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedState) {
          const { queues: storedQueues, activeQueueId: storedActiveQueueId, previousActiveQueueId: storedPrevActiveQueueId } = JSON.parse(storedState);
          const validQueues = storedQueues || [];
          setQueues(validQueues);

          // Ensure activeQueueId is valid, otherwise pick first or null
          const activeExists = validQueues.some(q => q.id === storedActiveQueueId);
          const newActiveId = activeExists ? storedActiveQueueId : (validQueues.length > 0 ? validQueues[0].id : null);
          setActiveQueueIdInternal(newActiveId);

          // Ensure previousActiveQueueId is valid relative to the new list of queues
          const prevActiveExists = validQueues.some(q => q.id === storedPrevActiveQueueId);
          setPreviousActiveQueueId(prevActiveExists ? storedPrevActiveQueueId : null);

        } else {
          // Initialize with a default "Main Queue" if nothing is stored
          const defaultQueueId = `queue-${Date.now()}`;
          setQueues([{ id: defaultQueueId, name: 'Main Queue', songs: [] }]);
          setActiveQueueIdInternal(defaultQueueId);
          setPreviousActiveQueueId(null);
        }
      } catch (e) {
        console.error("Failed to load queues from storage", e);
        const defaultQueueId = `queue-${Date.now()}-error`;
        setQueues([{ id: defaultQueueId, name: 'Main Queue', songs: [] }]);
        setActiveQueueIdInternal(defaultQueueId);
        setPreviousActiveQueueId(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadState();
  }, []);

  const saveState = async (newQueues: Queue[], newActiveQueueId: string | null, newPreviousActiveQueueId: string | null) => {
    try {
      const stateToStore = JSON.stringify({ queues: newQueues, activeQueueId: newActiveQueueId });
      await AsyncStorage.setItem(STORAGE_KEY, stateToStore);
    } catch (e) {
      console.error("Failed to save queues to storage", e);
    }
  };

  const setActiveQueueId = (id: string | null) => {
    if (id !== activeQueueId) {
      setPreviousActiveQueueId(activeQueueId); // Store current active as previous
      setActiveQueueIdInternal(id);
      saveState(queues, id, activeQueueId); // Save new active and old active as previous
    }
  };

  const addQueue = async (name: string, songs: Song[] = []) => {
    const newQueue: Queue = { id: `queue-${Date.now()}`, name, songs };
    const updatedQueues = [...queues, newQueue];
    setQueues(updatedQueues);
    // Automatically switch to the new queue
    setPreviousActiveQueueId(activeQueueId); // Current active becomes previous
    setActiveQueueIdInternal(newQueue.id);   // New queue becomes active
    await saveState(updatedQueues, newQueue.id, activeQueueId);
  };

  const deleteQueue = async (id: string) => {
    const queueToDeleteIndex = queues.findIndex(q => q.id === id);
    if (queueToDeleteIndex === -1) return;

    const updatedQueues = queues.filter(q => q.id !== id);
    setQueues(updatedQueues);

    let newActiveId = activeQueueId;
    let newPreviousId = previousActiveQueueId;

    if (activeQueueId === id) { // If the deleted queue was active
      if (previousActiveQueueId && updatedQueues.some(q => q.id === previousActiveQueueId)) {
        // Try to switch to the previously active queue if it still exists
        newActiveId = previousActiveQueueId;
        // Attempt to find a new "previous" for the newActiveId, could be null
        const currentActiveIndex = updatedQueues.findIndex(q => q.id === newActiveId);
        newPreviousId = currentActiveIndex > 0 ? updatedQueues[currentActiveIndex -1].id : null;

      } else if (updatedQueues.length > 0) {
        // Otherwise, switch to the first available queue
        newActiveId = updatedQueues[0].id;
        newPreviousId = null; // No real "previous" in this case
      } else {
        // No queues left
        newActiveId = null;
        newPreviousId = null;
      }
      setActiveQueueIdInternal(newActiveId);
      setPreviousActiveQueueId(newPreviousId); // Update previous as well
    } else {
      // If deleted queue was not active, activeId remains, but previous might need update if it was the deleted one
      if (previousActiveQueueId === id) {
        // Find a new suitable previous for the current activeQueueId
        const currentActiveIndex = updatedQueues.findIndex(q => q.id === activeQueueId);
        newPreviousId = currentActiveIndex > 0 ? updatedQueues[currentActiveIndex -1].id : null;
        setPreviousActiveQueueId(newPreviousId);
      }
    }
    await saveState(updatedQueues, newActiveId, newPreviousId);
  };

  const renameQueue = async (id: string, newName: string) => {
    const updatedQueues = queues.map(q => q.id === id ? { ...q, name: newName } : q);
    setQueues(updatedQueues);
    await saveState(updatedQueues, activeQueueId, previousActiveQueueId);
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
    await saveState(updatedQueues, activeQueueId, previousActiveQueueId);
  };

  const getQueueById = (id: string | null): Queue | undefined => {
    if (!id) return undefined;
    return queues.find(q => q.id === id);
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
      isLoading,
      // getQueueById, // Expose if needed by consumers directly
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
  // Add getQueueById to the returned context value for easier access by consumers
  return { ...context, getQueueById: (id: string | null) => id ? context.queues.find(q => q.id === id) : undefined };
};
