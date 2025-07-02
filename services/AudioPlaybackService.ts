import { Audio } from 'expo-av';
import { AVPlaybackStatusSuccess, AVPlaybackStatus } from 'expo-av';

// Song interface remains the same
export interface Song {
  id: string;
  uri: string;
  title: string;
  artist?: string;
  albumArtUri?: string;
  durationMillis?: number;
}

interface QueuePlaybackState {
  sound: Audio.Sound | null;
  songs: Song[];
  currentIndex: number;
  isPlaying: boolean;
  isActuallyPlayingAudio: boolean; // New: to track if this queue is the one outputting sound
  positionMillis: number;
  durationMillis: number;
}

type PlaybackStatusListener = (queueId: string, status: AVPlaybackStatusSuccess) => void;
type TrackFinishedListener = (queueId: string) => void;

class AudioPlaybackService {
  private queueStates: Map<string, QueuePlaybackState> = new Map();
  private activeAudioOutputQueueId: string | null = null; // Queue whose audio is currently live

  // Listeners now need to be aware of which queue they are for
  private playbackStatusListeners: PlaybackStatusListener[] = [];
  private trackFinishedListeners: TrackFinishedListener[] = [];

  constructor() {
    this.configureAudioSession();
  }

  private async configureAudioSession() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true, // Important if other apps play audio
        playThroughEarpieceAndroid: false,
      });
    } catch (e) {
      console.error('Failed to set audio mode', e);
    }
  }

  public addPlaybackStatusListener(listener: PlaybackStatusListener) {
    this.playbackStatusListeners.push(listener);
  }

  public removePlaybackStatusListener(listener: PlaybackStatusListener) {
    this.playbackStatusListeners = this.playbackStatusListeners.filter(l => l !== listener);
  }

  public addTrackFinishedListener(listener: TrackFinishedListener) {
    this.trackFinishedListeners.push(listener);
  }

  public removeTrackFinishedListener(listener: TrackFinishedListener) {
    this.trackFinishedListeners = this.trackFinishedListeners.filter(l => l !== listener);
  }

  private notifyPlaybackStatus(queueId: string, status: AVPlaybackStatusSuccess) {
    this.playbackStatusListeners.forEach(listener => listener(queueId, status));
  }

  private notifyTrackFinished(queueId: string) {
    this.trackFinishedListeners.forEach(listener => listener(queueId));
    this.playNext(queueId); // Auto-play next song on completion by default
  }

  public async manageQueue(queueId: string, songs: Song[], initialIndex: number = 0) {
    if (!this.queueStates.has(queueId)) {
      this.queueStates.set(queueId, {
        sound: null,
        songs: [],
        currentIndex: -1,
        isPlaying: false,
        isActuallyPlayingAudio: false,
        positionMillis: 0,
        durationMillis: 0,
      });
    }
    const state = this.queueStates.get(queueId)!;
    state.songs = songs;
    state.currentIndex = songs.length > 0 ? Math.max(0, Math.min(initialIndex, songs.length - 1)) : -1;

    // If this queue is supposed to be the active audio output, and it has songs, load it.
    // Or if it was already playing something, it might need to reload if the song list changed significantly.
    // For now, let's assume if it's the active audio output, it should try to load/play its current song.
    if (state.currentIndex >=0 && (state.isPlaying || this.activeAudioOutputQueueId === queueId)) {
        await this.loadSong(queueId, state.songs[state.currentIndex], state.isPlaying);
    } else if (state.sound) { // If queue becomes empty or no current index, unload
        await state.sound.unloadAsync();
        state.sound = null;
    }
  }

  public async removeQueue(queueId: string) {
    const state = this.queueStates.get(queueId);
    if (state) {
      if (state.sound) {
        await state.sound.unloadAsync();
      }
      this.queueStates.delete(queueId);
      if (this.activeAudioOutputQueueId === queueId) {
        this.activeAudioOutputQueueId = null; // No queue is actively outputting audio
      }
    }
  }

  // Sets which queue's audio is actually heard.
  // Pauses other queues that were set to isPlaying=true but shouldn't output sound.
  // Resumes the new active queue if it was set to isPlaying=true.
  public async setActiveAudioOutputQueue(queueId: string | null) {
    const oldActiveQueueId = this.activeAudioOutputQueueId;
    this.activeAudioOutputQueueId = queueId;

    for (const [id, state] of this.queueStates.entries()) {
      if (id === queueId) { // This is the new active audio output queue
        state.isActuallyPlayingAudio = true;
        if (state.isPlaying && state.sound) { // If it's supposed to be playing, ensure it plays
          try {
            const status = await state.sound.getStatusAsync() as AVPlaybackStatusSuccess;
            if(status.isLoaded && !status.isPlaying) await state.sound.playAsync();
          } catch (e) { console.error(`Error playing sound for new active queue ${id}`, e); }
        } else if (state.isPlaying && !state.sound && state.currentIndex !== -1) { // Supposed to be playing but no sound loaded
            await this.loadSong(id, state.songs[state.currentIndex], true);
        }
      } else { // This is not the active audio output queue
        state.isActuallyPlayingAudio = false;
        if (state.isPlaying && state.sound) { // If it was playing, pause it (but keep its isPlaying state as true)
            try {
                const status = await state.sound.getStatusAsync() as AVPlaybackStatusSuccess;
                if(status.isLoaded && status.isPlaying) await state.sound.pauseAsync();
            } catch (e) { console.error(`Error pausing sound for non-active queue ${id}`, e); }
        }
      }
    }
  }


  private async loadSong(queueId: string, song: Song, shouldPlay: boolean) {
    const state = this.queueStates.get(queueId);
    if (!state) return;

    try {
      if (state.sound) {
        await state.sound.unloadAsync();
        state.sound.setOnPlaybackStatusUpdate(null);
        state.sound = null;
      }

      const { sound, status } = await Audio.Sound.createAsync(
        { uri: song.uri },
        // Initial shouldPlay is true if this queue is the active audio output AND it's meant to be playing.
        { shouldPlay: shouldPlay && state.isActuallyPlayingAudio },
        (playbackStatus) => this.onPlaybackStatusUpdate(queueId, playbackStatus)
      );
      state.sound = sound;
      // state.isPlaying is the *intended* play state, not necessarily if audio is outputting.
      // state.isPlaying = shouldPlay; // This is set by play/pause commands mostly.

      if ((status as AVPlaybackStatusSuccess).isLoaded) {
        state.durationMillis = (status as AVPlaybackStatusSuccess).durationMillis || 0;
        state.positionMillis = (status as AVPlaybackStatusSuccess).positionMillis || 0;
        // Update the song object in the queue if duration wasn't known
        if (state.songs[state.currentIndex] && !(state.songs[state.currentIndex].durationMillis)) {
            state.songs[state.currentIndex].durationMillis = state.durationMillis;
        }
        this.notifyPlaybackStatus(queueId, status as AVPlaybackStatusSuccess);
      }
    } catch (e) {
      console.error(`Failed to load song ${song.title} for queue ${queueId}`, e);
      state.isPlaying = false; // If load fails, it's not playing.
    }
  }

  private onPlaybackStatusUpdate(queueId: string, status: AVPlaybackStatus) {
    const state = this.queueStates.get(queueId);
    if (!state || !status.isLoaded) {
      if (status.isLoaded === false && status.error) { // Check for isLoaded explicitly false
        console.error(`Playback Error for queue ${queueId}: ${status.error}`);
        if(state) state.isPlaying = false;
      }
      return;
    }

    state.positionMillis = status.positionMillis;
    state.durationMillis = status.durationMillis || state.durationMillis; // Keep old if new is null

    // This reflects the actual state of the Sound object.
    // state.isPlaying should be set by play/pause commands.
    // However, if the sound object's isPlaying changes (e.g. due to buffering, or external interruption handled by OS)
    // we might want to reflect that. For now, we let user commands define state.isPlaying.
    // What's important is if it *actually* finished.

    this.notifyPlaybackStatus(queueId, status);

    if (status.didJustFinish && !status.isLooping) {
      state.isPlaying = false; // Mark as not playing since it finished
      this.notifyTrackFinished(queueId);
    }
  }

  public async play(queueId: string) {
    const state = this.queueStates.get(queueId);
    if (!state) return;

    state.isPlaying = true; // Set intended state

    if (!state.sound && state.currentIndex !== -1) { // Sound not loaded, but there's a song to play
        await this.loadSong(queueId, state.songs[state.currentIndex], true);
    } else if (state.sound) {
        if (this.activeAudioOutputQueueId === queueId) { // Only play audio if it's the active output queue
            state.isActuallyPlayingAudio = true;
            try {
                await state.sound.playAsync();
            } catch (e) { console.error('Failed to play sound for queue', queueId, e); }
        } else {
            // It's set to play, but not active output. Its sound object remains paused.
            // It will start playing if setActiveAudioOutputQueue is called for it.
            state.isActuallyPlayingAudio = false;
        }
    }
     // Ensure other queues are paused if this one is meant to be the active one
    if (this.activeAudioOutputQueueId === queueId) {
        await this.setActiveAudioOutputQueue(queueId);
    }
  }

  public async pause(queueId: string) {
    const state = this.queueStates.get(queueId);
    if (!state || !state.sound) return;

    state.isPlaying = false; // Set intended state
    state.isActuallyPlayingAudio = false; // Explicitly not playing audio if paused by user
    try {
      await state.sound.pauseAsync();
    } catch (e) {
      console.error('Failed to pause sound for queue', queueId, e);
    }
  }

  public async playNext(queueId: string) {
    const state = this.queueStates.get(queueId);
    if (!state || state.songs.length === 0) return;

    if (state.currentIndex < state.songs.length - 1) {
      state.currentIndex++;
    } else {
      state.currentIndex = 0; // Loop to the beginning, or implement end-of-queue behavior
      // For now, simple loop. If you don't want looping, set currentIndex to -1 or stop.
      // state.isPlaying = false; // Stop if not looping.
    }
    // Load the new song. If the queue was playing, it should continue playing the new song.
    await this.loadSong(queueId, state.songs[state.currentIndex], state.isPlaying);
  }

  public async playPrevious(queueId: string) {
    const state = this.queueStates.get(queueId);
    if (!state || state.songs.length === 0) return;

    if (state.currentIndex > 0) {
      state.currentIndex--;
    } else {
      state.currentIndex = state.songs.length - 1; // Loop to the end
    }
    await this.loadSong(queueId, state.songs[state.currentIndex], state.isPlaying);
  }

  public async seek(queueId: string, positionMillis: number) {
    const state = this.queueStates.get(queueId);
    if (!state || !state.sound) return;
    try {
      await state.sound.setPositionAsync(positionMillis);
      state.positionMillis = positionMillis; // Optimistically update
    } catch (e) {
      console.error('Failed to seek for queue', queueId, e);
    }
  }

  public getQueuePlaybackState(queueId: string): Partial<QueuePlaybackState> {
    const state = this.queueStates.get(queueId);
    if (!state) return { currentIndex: -1, isPlaying: false, songs: [] };
    return {
      songs: state.songs,
      currentIndex: state.currentIndex,
      isPlaying: state.isPlaying, // Intended play state
      isActuallyPlayingAudio: state.isActuallyPlayingAudio, // If audio is outputting
      positionMillis: state.positionMillis,
      durationMillis: state.durationMillis,
      sound: state.sound, // Exposing sound might be risky, but useful for context to get detailed status
    };
  }

  public getCurrentSongForQueue(queueId: string): Song | null {
    const state = this.queueStates.get(queueId);
    if (state && state.currentIndex >= 0 && state.currentIndex < state.songs.length) {
      return state.songs[state.currentIndex];
    }
    return null;
  }

  // Cleanup all resources
  public async cleanup() {
    for (const queueId of this.queueStates.keys()) {
      await this.removeQueue(queueId);
    }
    this.playbackStatusListeners = [];
    this.trackFinishedListeners = [];
  }
}

// Singleton instance
const audioPlaybackService = new AudioPlaybackService();
export { audioPlaybackService };
