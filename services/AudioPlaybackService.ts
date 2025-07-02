import { Audio } from 'expo-av';
import { AVPlaybackStatusSuccess, AVPlaybackStatus } from 'expo-av';

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
  isPlaying: boolean; // User's intent for this queue to play
  // isActuallyPlayingAudio is removed as it's now simply tied to isPlaying and sound object status
  positionMillis: number;
  durationMillis: number;
  volume: number; // Individual volume for this queue (defaults to 1.0)
}

type PlaybackStatusListener = (queueId: string, status: AVPlaybackStatusSuccess) => void;
type TrackFinishedListener = (queueId: string) => void;

class AudioPlaybackService {
  private queueStates: Map<string, QueuePlaybackState> = new Map();

  private playbackStatusListeners: PlaybackStatusListener[] = [];
  private trackFinishedListeners: TrackFinishedListener[] = [];

  constructor() {
    this.configureAudioSession();
  }

  private async configureAudioSession() {
    try {
      // This mode allows multiple sounds to play but respects system interruptions.
      // The OS will handle mixing.
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false, // Set to false if we want our multiple streams not to duck each other or be ducked as easily
        playThroughEarpieceAndroid: false,
        // interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS, // Might be useful
        // interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX, // Default, or Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS
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
    this.playNext(queueId); // Auto-play next song on completion
  }

  public async manageQueue(queueId: string, songs: Song[], initialIndex: number = 0) {
    let state = this.queueStates.get(queueId);
    if (!state) {
      state = {
        sound: null,
        songs: [],
        currentIndex: -1,
        isPlaying: false,
        positionMillis: 0,
        durationMillis: 0,
        volume: 1.0, // Default to full volume
      };
      this.queueStates.set(queueId, state);
    }

    const oldPlayingState = state.isPlaying;
    const oldCurrentIndex = state.currentIndex;

    state.songs = songs;
    state.currentIndex = songs.length > 0 ? Math.max(0, Math.min(initialIndex, songs.length - 1)) : -1;

    // If the queue was playing, or if the current song changes for a playing queue, reload.
    // Or if it's a new queue that's supposed to play based on some external logic (not handled here).
    // For now, if it has a valid song and was playing, or if index changed and was playing, try to reload/resume.
    if (state.currentIndex >= 0 && oldPlayingState) {
        // If the song at currentIndex changed or it's a new list, force reload.
        // For simplicity, always reload if it was playing and songs/index might have changed.
        await this.loadSong(queueId, state.songs[state.currentIndex], oldPlayingState);
    } else if (state.currentIndex >= 0 && !oldPlayingState && state.sound && state.songs[state.currentIndex]?.uri !== (await state.sound.getStatusAsync() as AVPlaybackStatusSuccess)?.uri) {
        // Was paused, but current song changed, ensure it's loaded (paused).
        await this.loadSong(queueId, state.songs[state.currentIndex], false);
    } else if (state.currentIndex === -1 && state.sound) { // Queue became empty
        await state.sound.unloadAsync();
        state.sound = null;
        state.isPlaying = false;
    }
  }

  public async removeQueue(queueId: string) {
    const state = this.queueStates.get(queueId);
    if (state) {
      if (state.sound) {
        await state.sound.unloadAsync();
      }
      this.queueStates.delete(queueId);
    }
  }

  // No longer an `setActiveAudioOutputQueue` that mutes/unmutes.
  // Each queue plays at its own volume if `isPlaying` is true.

  private async loadSong(queueId: string, song: Song, shouldInitiallyPlay: boolean) {
    const state = this.queueStates.get(queueId);
    if (!state) return;

    // Preserve intended play state from before loading this specific song,
    // but `shouldInitiallyPlay` can override if it's a fresh play command.
    state.isPlaying = shouldInitiallyPlay;

    try {
      if (state.sound) {
        await state.sound.unloadAsync();
        state.sound.setOnPlaybackStatusUpdate(null);
        state.sound = null;
      }

      // All playing queues are audible at their own volume.
      // state.volume is the persistent volume for this queue (default 1.0)
      // isActuallyPlayingAudio is now just state.isPlaying

      const { sound, status } = await Audio.Sound.createAsync(
        { uri: song.uri },
        {
          shouldPlay: state.isPlaying,
          volume: state.volume,
        },
        (playbackStatus) => this.onPlaybackStatusUpdate(queueId, playbackStatus)
      );
      state.sound = sound;

      if ((status as AVPlaybackStatusSuccess).isLoaded) {
        state.durationMillis = (status as AVPlaybackStatusSuccess).durationMillis || 0;
        state.positionMillis = (status as AVPlaybackStatusSuccess).positionMillis || 0;
        if (state.songs[state.currentIndex] && !(state.songs[state.currentIndex].durationMillis)) {
            state.songs[state.currentIndex].durationMillis = state.durationMillis;
        }
        this.notifyPlaybackStatus(queueId, status as AVPlaybackStatusSuccess);
      } else {
        // If not loaded, ensure isPlaying is false
        state.isPlaying = false;
      }
    } catch (e) {
      console.error(`Failed to load song ${song.title} for queue ${queueId}`, e);
      state.isPlaying = false;
    }
  }

  private onPlaybackStatusUpdate(queueId: string, status: AVPlaybackStatus) {
    const state = this.queueStates.get(queueId);
    if (!state || !status.isLoaded) {
      if (status.isLoaded === false && status.error) {
        console.error(`Playback Error for queue ${queueId}: ${status.error}`);
        if(state) state.isPlaying = false; // Reflect error by stopping intended play
      }
      // Notify even if not loaded, so UI can update (e.g. show loading/error)
      if(status.isLoaded) this.notifyPlaybackStatus(queueId, status);
      return;
    }

    state.positionMillis = status.positionMillis;
    state.durationMillis = status.durationMillis || state.durationMillis;

    // Update isPlaying based on the actual sound status ONLY if it's different AND
    // it wasn't a user-initiated pause. E.g. if it stops due to buffering/error.
    // However, for simplicity, we mainly let user actions (play/pause) define state.isPlaying.
    // The most important part is didJustFinish.
    // state.isPlaying = status.isPlaying; // This could override user intent if not careful.

    this.notifyPlaybackStatus(queueId, status);

    if (status.didJustFinish && !status.isLooping) {
      // state.isPlaying = false; // Song finished, so it's not "playing" this track anymore. Next track will set it.
      this.notifyTrackFinished(queueId); // This will call playNext, which handles isPlaying for the new track.
    }
  }

  public async play(queueId: string) {
    const state = this.queueStates.get(queueId);
    if (!state) return;

    state.isPlaying = true;

    if (!state.sound || state.songs[state.currentIndex]?.uri !== (await state.sound.getStatusAsync().catch(() => null) as AVPlaybackStatusSuccess)?.uri) {
      if (state.currentIndex !== -1 && state.songs[state.currentIndex]) {
        await this.loadSong(queueId, state.songs[state.currentIndex], true);
      } else {
        state.isPlaying = false; // No valid song to play
        return;
      }
    } else {
      try {
        await state.sound.setVolumeAsync(state.volume); // Ensure correct volume
        await state.sound.playAsync();
      } catch (e) {
        console.error('Failed to play sound for queue', queueId, e);
        state.isPlaying = false; // If play fails
      }
    }
  }

  public async pause(queueId: string) {
    const state = this.queueStates.get(queueId);
    if (!state || !state.sound) return;

    state.isPlaying = false;
    try {
      await state.sound.pauseAsync();
    } catch (e) {
      console.error('Failed to pause sound for queue', queueId, e);
    }
  }

  public async playNext(queueId: string) {
    const state = this.queueStates.get(queueId);
    if (!state || state.songs.length === 0) return;

    const wasPlaying = state.isPlaying;
    state.currentIndex = (state.currentIndex + 1) % state.songs.length; // Simple loop

    // if (!wasPlaying && state.currentIndex === 0 && !LOOP_QUEUE_OPTION) { state.isPlaying = false } // Example: stop if not looping and was not playing

    await this.loadSong(queueId, state.songs[state.currentIndex], wasPlaying);
  }

  public async playPrevious(queueId: string) {
    const state = this.queueStates.get(queueId);
    if (!state || state.songs.length === 0) return;

    const wasPlaying = state.isPlaying;
    state.currentIndex = (state.currentIndex - 1 + state.songs.length) % state.songs.length; // Simple loop back

    await this.loadSong(queueId, state.songs[state.currentIndex], wasPlaying);
  }

  public async seek(queueId: string, positionMillis: number) {
    const state = this.queueStates.get(queueId);
    if (!state || !state.sound) return;
    try {
      await state.sound.setPositionAsync(positionMillis);
      state.positionMillis = positionMillis;
    } catch (e) {
      console.error('Failed to seek for queue', queueId, e);
    }
  }

  // Optional: Method to set volume for a specific queue
  public async setQueueVolume(queueId: string, volume: number) {
    const state = this.queueStates.get(queueId);
    if (!state) return;
    state.volume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
    if (state.sound) {
      try {
        await state.sound.setVolumeAsync(state.volume);
      } catch (e) {
        console.error(`Failed to set volume for queue ${queueId}`, e);
      }
    }
  }

  public getQueuePlaybackState(queueId: string): Partial<QueuePlaybackState> {
    const state = this.queueStates.get(queueId);
    if (!state) return { currentIndex: -1, isPlaying: false, songs: [], volume: 1.0 };
    return {
      songs: state.songs,
      currentIndex: state.currentIndex,
      isPlaying: state.isPlaying,
      positionMillis: state.positionMillis,
      durationMillis: state.durationMillis,
      volume: state.volume,
      // sound: state.sound, // Avoid exposing sound object directly if possible
    };
  }

  public getCurrentSongForQueue(queueId: string): Song | null {
    const state = this.queueStates.get(queueId);
    if (state && state.currentIndex >= 0 && state.currentIndex < state.songs.length) {
      return state.songs[state.currentIndex];
    }
    return null;
  }

  public async cleanup() {
    for (const queueId of this.queueStates.keys()) {
      await this.removeQueue(queueId);
    }
    this.playbackStatusListeners = [];
    this.trackFinishedListeners = [];
  }
}

const audioPlaybackService = new AudioPlaybackService();
export { audioPlaybackService };
