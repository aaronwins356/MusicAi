/**
 * Audio Player Module
 * 
 * Runtime player graph using AudioContext for live playback.
 * Handles play/pause/stop, mute/solo, and provides analyser data
 * for visualization.
 * 
 * Architecture:
 * Sources → Track Gains (mute/solo) → Analyser → Master Gain → Destination
 */

export interface TrackControl {
  id: string;
  gainNode: GainNode;
  analyserNode: AnalyserNode;
  sourceNode: AudioBufferSourceNode | null;
  muted: boolean;
  soloed: boolean;
}

export interface PlayerState {
  playing: boolean;
  startTime: number;
  pauseTime: number;
  currentTime: number;
}

/**
 * Audio Player for runtime playback with per-track controls
 */
export class AudioPlayer {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private tracks: Map<string, TrackControl> = new Map();
  private state: PlayerState = {
    playing: false,
    startTime: 0,
    pauseTime: 0,
    currentTime: 0,
  };
  
  /**
   * Initialize the audio context and master gain
   */
  async initialize(): Promise<void> {
    if (this.context) return;
    
    this.context = new AudioContext();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 1.0;
    this.masterGain.connect(this.context.destination);
  }
  
  /**
   * Add a track with its own gain and analyser
   */
  addTrack(trackId: string): TrackControl {
    if (!this.context || !this.masterGain) {
      throw new Error('Player not initialized');
    }
    
    // Check if track already exists
    const existing = this.tracks.get(trackId);
    if (existing) {
      return existing;
    }
    
    // Create gain node for volume control
    const gainNode = this.context.createGain();
    gainNode.gain.value = 1.0;
    
    // Create analyser for visualization
    const analyserNode = this.context.createAnalyser();
    analyserNode.fftSize = 2048;
    analyserNode.smoothingTimeConstant = 0.8;
    
    // Connect: gain → analyser → master
    gainNode.connect(analyserNode);
    analyserNode.connect(this.masterGain);
    
    const track: TrackControl = {
      id: trackId,
      gainNode,
      analyserNode,
      sourceNode: null,
      muted: false,
      soloed: false,
    };
    
    this.tracks.set(trackId, track);
    return track;
  }
  
  /**
   * Connect an audio source to a track
   */
  connectSource(trackId: string, source: AudioBufferSourceNode): void {
    const track = this.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track ${trackId} not found`);
    }
    
    // Disconnect old source if exists
    if (track.sourceNode) {
      try {
        track.sourceNode.disconnect();
      } catch (e) {
        // Source might already be stopped
      }
    }
    
    track.sourceNode = source;
    source.connect(track.gainNode);
  }
  
  /**
   * Play audio from a specific time
   */
  async play(startOffset: number = 0): Promise<void> {
    if (!this.context || !this.masterGain) {
      throw new Error('Player not initialized');
    }
    
    // Resume context if suspended
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    
    this.state.playing = true;
    this.state.startTime = this.context.currentTime - startOffset;
    this.state.currentTime = startOffset;
  }
  
  /**
   * Pause playback
   */
  pause(): void {
    if (!this.context) return;
    
    this.state.playing = false;
    this.state.pauseTime = this.getCurrentTime();
  }
  
  /**
   * Stop playback and reset position
   */
  stop(): void {
    if (!this.context) return;
    
    // Stop all source nodes
    this.tracks.forEach(track => {
      if (track.sourceNode) {
        try {
          track.sourceNode.stop();
        } catch (e) {
          // Already stopped
        }
      }
    });
    
    this.state.playing = false;
    this.state.startTime = 0;
    this.state.pauseTime = 0;
    this.state.currentTime = 0;
  }
  
  /**
   * Get current playback time
   */
  getCurrentTime(): number {
    if (!this.context) return 0;
    
    if (this.state.playing) {
      return this.context.currentTime - this.state.startTime;
    }
    
    return this.state.pauseTime;
  }
  
  /**
   * Seek to a specific time
   */
  seek(time: number): void {
    const wasPlaying = this.state.playing;
    
    if (wasPlaying) {
      this.stop();
    }
    
    this.state.currentTime = time;
    this.state.pauseTime = time;
    
    if (wasPlaying) {
      this.play(time);
    }
  }
  
  /**
   * Set master volume (0-1)
   */
  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }
  
  /**
   * Set track volume (0-1)
   */
  setTrackVolume(trackId: string, volume: number): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }
  
  /**
   * Mute/unmute a track
   */
  setTrackMuted(trackId: string, muted: boolean): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.muted = muted;
      track.gainNode.gain.value = muted ? 0 : 1;
    }
  }
  
  /**
   * Solo a track (mute all others)
   */
  setTrackSolo(trackId: string, soloed: boolean): void {
    const track = this.tracks.get(trackId);
    if (!track) return;
    
    track.soloed = soloed;
    
    // Update all track states
    const anySoloed = Array.from(this.tracks.values()).some(t => t.soloed);
    
    this.tracks.forEach(t => {
      if (anySoloed) {
        // If any track is soloed, mute non-soloed tracks
        t.gainNode.gain.value = t.soloed ? 1 : 0;
      } else {
        // If no tracks soloed, respect individual mute states
        t.gainNode.gain.value = t.muted ? 0 : 1;
      }
    });
  }
  
  /**
   * Get analyser data for visualization (time domain)
   */
  getTrackWaveform(trackId: string): Uint8Array | null {
    const track = this.tracks.get(trackId);
    if (!track) return null;
    
    const bufferLength = track.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    track.analyserNode.getByteTimeDomainData(dataArray);
    
    return dataArray;
  }
  
  /**
   * Get analyser data for visualization (frequency domain)
   */
  getTrackFrequencyData(trackId: string): Uint8Array | null {
    const track = this.tracks.get(trackId);
    if (!track) return null;
    
    const bufferLength = track.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    track.analyserNode.getByteFrequencyData(dataArray);
    
    return dataArray;
  }
  
  /**
   * Get RMS level for a track (0-1)
   */
  getTrackLevel(trackId: string): number {
    const waveform = this.getTrackWaveform(trackId);
    if (!waveform) return 0;
    
    let sum = 0;
    for (let i = 0; i < waveform.length; i++) {
      const normalized = (waveform[i] - 128) / 128;
      sum += normalized * normalized;
    }
    
    const rms = Math.sqrt(sum / waveform.length);
    return rms;
  }
  
  /**
   * Get all track IDs
   */
  getTrackIds(): string[] {
    return Array.from(this.tracks.keys());
  }
  
  /**
   * Remove a track
   */
  removeTrack(trackId: string): void {
    const track = this.tracks.get(trackId);
    if (track) {
      if (track.sourceNode) {
        try {
          track.sourceNode.stop();
          track.sourceNode.disconnect();
        } catch (e) {
          // Already stopped
        }
      }
      track.gainNode.disconnect();
      track.analyserNode.disconnect();
      this.tracks.delete(trackId);
    }
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    
    this.tracks.forEach(track => {
      track.gainNode.disconnect();
      track.analyserNode.disconnect();
    });
    
    this.tracks.clear();
    
    if (this.masterGain) {
      this.masterGain.disconnect();
    }
    
    if (this.context) {
      this.context.close();
    }
    
    this.context = null;
    this.masterGain = null;
  }
  
  /**
   * Get player state
   */
  getState(): PlayerState {
    return { ...this.state };
  }
}
