import { Audio } from 'expo-av';
import { AVPlaybackStatusSuccess } from 'expo-av';

interface Song {
  id: string;
  uri: string; // Local URI or remote URL
  title: string;
  artist?: string;
  albumArtUri?: string; // Optional: for album art
  durationMillis?: number; // Optional: duration in milliseconds
}

class AudioPlaybackService {
  private sound: Audio.Sound | null = null;
  private currentQueue: Song[] = [];
  private currentIndex: number = -1;
  private isPlaying: boolean = false;
  private playbackStatusListener: ((status: AVPlaybackStatusSuccess) => void) | null = null;
  private trackFinishedListener: (() => void) | null = null;


  constructor() {
    this.configureAudioSession();
  }

  private async configureAudioSession() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        // interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX, // Deprecated
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        // interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX, // Deprecated
        playThroughEarpieceAndroid: false,
      });
    } catch (e) {
      console.error('Failed to set audio mode', e);
    }
  }

  public setPlaybackStatusListener(listener: (status: AVPlaybackStatusSuccess) => void) {
    this.playbackStatusListener = listener;
  }

  public setTrackFinishedListener(listener: () => void) {
    this.trackFinishedListener = listener;
  }


  public async loadAndPlayQueue(queue: Song[], startIndex: number = 0) {
    this.currentQueue = queue;
    this.currentIndex = startIndex;
    if (this.currentQueue.length > 0 && this.currentIndex < this.currentQueue.length) {
      await this.loadAndPlaySong(this.currentQueue[this.currentIndex]);
    }
  }

  public async loadAndPlaySong(song: Song) {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound.setOnPlaybackStatusUpdate(null); // Clear previous listener
        this.sound = null;
      }

      const { sound, status } = await Audio.Sound.createAsync(
        { uri: song.uri },
        { shouldPlay: true },
        this.onPlaybackStatusUpdate.bind(this)
      );
      this.sound = sound;
      this.isPlaying = true;
      // The status provided by createAsync can be an AVPlaybackStatusSuccess
      if ((status as AVPlaybackStatusSuccess).isLoaded) {
         this.currentQueue[this.currentIndex].durationMillis = (status as AVPlaybackStatusSuccess).durationMillis;
        if (this.playbackStatusListener) {
          this.playbackStatusListener(status as AVPlaybackStatusSuccess);
        }
      }
    } catch (e) {
      console.error(`Failed to load and play song: ${song.title}`, e);
      this.isPlaying = false;
    }
  }

  private onPlaybackStatusUpdate(status: AVPlaybackStatusSuccess | any) { // any for type safety if status is not loaded
    if (!status.isLoaded) {
      if (status.error) {
        console.error(`Playback Error: ${status.error}`);
        this.isPlaying = false;
        // Optionally, try to play next song or stop
      }
      return;
    }

    // Update current song's duration if not already set (useful for streams or first load)
    if (this.currentQueue[this.currentIndex] && !this.currentQueue[this.currentIndex].durationMillis && status.durationMillis) {
        this.currentQueue[this.currentIndex].durationMillis = status.durationMillis;
    }


    this.isPlaying = status.isPlaying;
    if (this.playbackStatusListener) {
      this.playbackStatusListener(status);
    }

    if (status.didJustFinish && !status.isLooping) {
      if (this.trackFinishedListener) {
        this.trackFinishedListener(); // Notify UI or context that track finished
      } else {
        this.playNext(); // Default behavior if no specific listener
      }
    }
  }

  public async play() {
    if (this.sound && !this.isPlaying) {
      try {
        await this.sound.playAsync();
        this.isPlaying = true;
      } catch (e) {
        console.error('Failed to play sound', e);
      }
    }
  }

  public async pause() {
    if (this.sound && this.isPlaying) {
      try {
        await this.sound.pauseAsync();
        this.isPlaying = false;
      } catch (e) {
        console.error('Failed to pause sound', e);
      }
    }
  }

  public async playNext() {
    if (this.currentIndex < this.currentQueue.length - 1) {
      this.currentIndex++;
      await this.loadAndPlaySong(this.currentQueue[this.currentIndex]);
    } else {
      // Reached end of queue
      console.log("End of queue");
      this.isPlaying = false;
      // Optionally, stop playback or loop
      if (this.sound) {
        await this.sound.stopAsync(); // Or unloadAsync
      }
    }
  }

  public async playPrevious() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      await this.loadAndPlaySong(this.currentQueue[this.currentIndex]);
    } else if (this.currentQueue.length > 0) {
      // Optional: restart current song or do nothing
      await this.loadAndPlaySong(this.currentQueue[0]);
    }
  }

  public async seek(positionMillis: number) {
    if (this.sound) {
      try {
        await this.sound.setPositionAsync(positionMillis);
      } catch (e) {
        console.error('Failed to seek', e);
      }
    }
  }

  public getCurrentSong(): Song | null {
    return this.currentQueue[this.currentIndex] || null;
  }

  public getPlaybackStatus() {
    return {
      isPlaying: this.isPlaying,
      currentIndex: this.currentIndex,
      currentSong: this.getCurrentSong(),
      // duration and position would come from the playbackStatusListener
    };
  }

  public async cleanup() {
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
    }
    this.currentQueue = [];
    this.currentIndex = -1;
    this.isPlaying = false;
    this.playbackStatusListener = null;
    this.trackFinishedListener = null;
  }
}

const audioPlaybackService = new AudioPlaybackService();
export { audioPlaybackService, Song };
