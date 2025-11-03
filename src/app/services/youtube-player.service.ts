import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

declare var YT: any;

@Injectable({
  providedIn: 'root'
})
export class YoutubePlayerService {
  private player: any;
  private isPlayerReady = false;
  private currentTimeSubject = new BehaviorSubject<number>(0);
  private durationSubject = new BehaviorSubject<number>(0);
  private qualityLevelsSubject = new BehaviorSubject<string[]>([]);
  private selectedQualitySubject = new BehaviorSubject<string>('auto');
  private playbackRatesSubject = new BehaviorSubject<number[]>([]);
  private selectedPlaybackRateSubject = new BehaviorSubject<number>(1);
  private playerStateSubject = new BehaviorSubject<any>(0);

  private isPlayReadySubject = new BehaviorSubject<Boolean>(false);

  // Observable streams
  public currentTime$ = this.currentTimeSubject.asObservable();
  public duration$ = this.durationSubject.asObservable();
  public qualityLevels$ = this.qualityLevelsSubject.asObservable();
  public selectedQuality$ = this.selectedQualitySubject.asObservable();
  public playbackRates$ = this.playbackRatesSubject.asObservable();
  public selectedPlaybackRate$ = this.selectedPlaybackRateSubject.asObservable();
  public playerState$ = this.playerStateSubject.asObservable();
  public isPlayReady$ = this.isPlayReadySubject.asObservable();
  constructor() { }

  initPlayer(elementId: string, videoId: string): void {

    // this.player = null;
    if (typeof YT === 'undefined' || !YT.Player) {
      console.error('YouTube API is not ready yet');
      return;
    }
    this.player = new YT.Player(elementId, {
      // height: '360',
      // width: '640',
      videoId: videoId,
      playerVars: {
        'playsinline': 1,
        'autoplay': 1,
        'controls': 0,
        'disablekb': 0,
        'enablejsapi': 1,
        'rel': 0,
        'showinfo': 0,
        'iv_load_policy': 3,
        'modestbranding': 1,
        'widgetid': 1,

      },
      events: {
        'onReady': this.onPlayerReady.bind(this),
        'onStateChange': this.onPlayerStateChange.bind(this),
        'onPlaybackQualityChange': this.onPlaybackQualityChange.bind(this),

      }
    });

  }
  onPlaybackQualityChange(event) {

    var newQuality = event.target.getPlaybackQuality();
    this.selectedQualitySubject.next(newQuality);

  }
  onPlayerReady(event: any) {
    
    if (event) {
      
      this.isPlayerReady = true;
      this.isPlayReadySubject.next(true);
      this.durationSubject.next(this.player.getDuration() - 1);
      this.updateCurrentTime();
      this.updateQualityLevels();
      this.updatePlaybackRates();
      this.setPlaybackRate(1);
    }

  }

  onPlayerStateChange(event: any): void {
    
    if (event.data === YT.PlayerState.ENDED) {
      // Video has actually ended
      // Perform necessary actions after the video ends
    } else if (event.data === YT.PlayerState.PLAYING) {
      // Update current time
      this.updateCurrentTime();
    } else if (event.data === YT.PlayerState.BUFFERING) {
      // Handle buffering state if needed
    } else if (event.data === YT.PlayerState.PAUSED) {
      // Handle paused state if needed
      
    } else if (event.data === YT.PlayerState.CUED) {
      // Handle cued state if needed
    }
  }

  playVideo(): void {
    if (this.player) {
      this.player.playVideo();
      this.durationSubject.next(this.player.getDuration() - 1);
    }
  }

  pauseVideo(): void {
    if (this.player) {
      this.player.pauseVideo();
    }
  }
  playNextVideo(VideoId: any): void {
    this.player.loadVideoById(VideoId);
  }

  setVolume(volume: number): void {
    if (this.player) {
      this.player.setVolume(volume);
    }
  }

  mute(): void {
    if (this.player) {
      this.player.mute();
    }

  }

  unMute(): void {
    if (this.player) {
      this.player.unMute();
    }
  }

  updateCurrentTime() {

    if(this.player){
      setInterval(() => {

        if (this.isPlayerReady && this.player.getPlayerState() === YT.PlayerState.PLAYING) {
          this.playerStateSubject.next(1);

          const currentTime = this.player.getCurrentTime();
          const duration = this.player.getDuration() - 1; 
          if (currentTime >= duration) {
            
            this.stopVideo(); 
            // this.playerStateSubject.next(0);
            
          } else {
            this.currentTimeSubject.next(currentTime);
          }
        }
      }, 1000); 
    }


  }

  seekTo(seconds: number): void {
    if (this.player && this.isPlayerReady) {
      this.player.seekTo(seconds, true);
    }
  }
  stopVideo(): void {
    if (this.player) {
      this.player.pauseVideo();
      this.player.seekTo(0); // Optional: Reset to the beginning of the video
      this.currentTimeSubject.next(0);
      this.durationSubject.next(0);
      this.playerStateSubject.next(YT.PlayerState.ENDED);
    }
  }
  updateQualityLevels() {
    if (this.player && this.isPlayerReady) {
      const availableQualities = this.player.getAvailableQualityLevels();
      this.qualityLevelsSubject.next(availableQualities);
      // this.selectedQualitySubject.next(this.player.getPlaybackQuality());

    }
  }

  setPlaybackQuality(quality: string) {

    if (this.player && this.isPlayerReady) {
      this.player.setPlaybackQuality(quality);
      // this.selectedQualitySubject.next(this.player.getPlaybackQuality());
    }
  }
  updatePlaybackRates() {
    if (this.player && this.isPlayerReady) {
      const availablePlaybackRates = this.player.getAvailablePlaybackRates();
      this.playbackRatesSubject.next(availablePlaybackRates);
    }
  }

  setPlaybackRate(rate: number) {
    if (this.player && this.isPlayerReady) {
      this.player.setPlaybackRate(rate);
      this.selectedPlaybackRateSubject.next(rate);
    }
  }

  isVideoPlaying(): boolean {
    if (this.player && this.isPlayerReady) {
      return this.player.getPlayerState() === YT.PlayerState.PLAYING;
    }
    return false;
  }
  forward(seconds: number = 10): void {
    if (this.player && this.isPlayerReady) {
      const newTime = this.player.getCurrentTime() + seconds;
      this.seekTo(newTime);
    }
  }

  backward(seconds: number = 10): void {
    if (this.player && this.isPlayerReady) {
      const newTime = this.player.getCurrentTime() - seconds;
      this.seekTo(newTime);
    }
  }

  // Cleanup method to destroy the player instance
  destroyPlayer(): void {
    if (this.player) {
      this.player.destroy();
      this.player = null;
      this.isPlayerReady = false;
    }
  }


}
