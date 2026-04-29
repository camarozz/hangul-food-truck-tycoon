/**
 * AUDIO ENGINE PLACEHOLDER
 * Map all future sound assets here. The console.logs act as visual 
 * confirmations that the sound triggers are firing in the correct places.
 */

export type SoundEffect =
  | 'UI_HOVER'
  | 'UI_CLICK'
  | 'UI_ERROR'
  | 'CASH_REGISTER'
  | 'GRILL_HISS'
  | 'FRYER_BUBBLE'
  | 'POUR_DRINK'
  | 'TRASH_CRUMPLE'
  | 'CUSTOMER_BELL'
  | 'CUSTOMER_HAPPY'
  | 'CUSTOMER_ANGRY'
  | 'SUCCESS_CHIME'
  | 'ALARM_BEEP'
  | 'TRUCK_START';

export type BackgroundMusic =
  | 'BGM_BOOT'
  | 'BGM_MAIN_MENU'
  | 'BGM_SHIFT_NORMAL'
  | 'BGM_SHIFT_RUSH'
  | 'BGM_ALBA_MINIGAME';

class AudioEngine {
  private isMuted: boolean = false;
  private sfxVolume: number = 0.7;
  private bgmVolume: number = 0.5;
  private currentBgm: BackgroundMusic | null = null;

  // FUTURE: private sounds: Record<string, HTMLAudioElement> = {};

  init() {
    console.log('[AUDIO] Engine Initialized. Waiting for local MP3/WAV assets.');
  }

  setVolumes(sfx: number, bgm: number) {
    this.sfxVolume = Math.max(0, Math.min(100, sfx)) / 100;
    this.bgmVolume = Math.max(0, Math.min(100, bgm)) / 100;
    
    // FUTURE: Loop through loaded sounds and update their `.volume` property
    console.log(`[AUDIO] Volumes updated - SFX: ${sfx}%, BGM: ${bgm}%`);
  }

  playSFX(soundId: SoundEffect) {
    if (this.isMuted) return;
    
    // FUTURE: 
    // const sound = this.sounds[soundId];
    // if (sound) { sound.currentTime = 0; sound.play(); }
    
    console.log(`🔊 [SFX]: ${soundId}`);
  }

  playBGM(trackId: BackgroundMusic) {
    if (this.isMuted) return;
    if (this.currentBgm === trackId) return; // Don't restart if already playing
    
    this.currentBgm = trackId;
    
    // FUTURE: 
    // this.stopBGM();
    // const track = this.sounds[trackId];
    // if (track) { track.loop = true; track.play(); }

    console.log(`🎵 [BGM]: Playing ${trackId}`);
  }

  stopBGM() {
    this.currentBgm = null;
    // FUTURE: Pause current BGM track
    console.log(`🔇 [BGM]: Stopped`);
  }

  toggleMute(mute?: boolean) {
    this.isMuted = mute !== undefined ? mute : !this.isMuted;
    console.log(`[AUDIO] System Muted: ${this.isMuted}`);
    // FUTURE: Pause all playing sounds if true
  }
}

// Export a single, global instance
export const audio = new AudioEngine();
