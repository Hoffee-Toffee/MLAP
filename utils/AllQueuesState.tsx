import React, { createContext, useContext, useState } from 'react';

// Define the shape of a queue and the global state
interface Song {
  id: string;
  uri: string;
  filename: string;
  artist: string;
  duration: number;
}

interface Queue {
  id: string;
  name: string;
  songs: Song[];
}

interface AllQueuesStateContextProps {
  queues: Queue[];
  activeQueueId: string | null;
  setActiveQueue: (queueId: string | null) => void;
  addQueue: (queue: Queue) => void;
  deleteQueue: (queueId: string) => void;
  editQueue: (queueId: string, updatedQueue: Partial<Queue>) => void;
}

const AllQueuesStateContext = createContext<AllQueuesStateContextProps | undefined>(undefined);

export const AllQueuesStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [activeQueueId, setActiveQueueId] = useState<string | null>(null);

  const setActiveQueue = (queueId: string | null) => {
    setActiveQueueId(queueId);
  };

  const addQueue = (queue: Queue) => {
    setQueues((prevQueues) => [...prevQueues, queue]);
  };

  const deleteQueue = (queueId: string) => {
    setQueues((prevQueues) => prevQueues.filter((queue) => queue.id !== queueId));
    if (activeQueueId === queueId) {
      setActiveQueueId(null);
    }
  };

  const editQueue = (queueId: string, updatedQueue: Partial<Queue>) => {
    setQueues((prevQueues) =>
      prevQueues.map((queue) =>
        queue.id === queueId ? { ...queue, ...updatedQueue } : queue
      )
    );
  };

  return (
    <AllQueuesStateContext.Provider
      value={{ queues, activeQueueId, setActiveQueue, addQueue, deleteQueue, editQueue }}
    >
      {children}
    </AllQueuesStateContext.Provider>
  );
};

export const useAllQueuesState = (): AllQueuesStateContextProps => {
  const context = useContext(AllQueuesStateContext);
  if (!context) {
    throw new Error('useAllQueuesState must be used within an AllQueuesStateProvider');
  }
  return context;
};
