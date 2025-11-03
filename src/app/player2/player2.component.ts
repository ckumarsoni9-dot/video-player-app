import { Component, NgZone } from '@angular/core';
declare var YT: any;
@Component({
  selector: 'app-player2',
  standalone: true,
  imports: [],
  templateUrl: './player2.component.html',
  styleUrl: './player2.component.scss'
})
export class Player2Component {
  player: any;
  zoomLevel = 1;
  duration = 0;
  currentTime = 0;
  volume = 50;

  constructor(private zone: NgZone) { }

  ngOnInit() {
    // Load YouTube IFrame API if not already loaded
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }

    // Wait for API ready
    (window as any).onYouTubeIframeAPIReady = () => {
      this.initPlayer();
    };

    // Fallback: if already ready
    if ((window as any).YT && (window as any).YT.Player) {
      this.initPlayer();
    }
  }
  initPlayer() {
    this.player = new YT.Player('player', {
      videoId: 'VhRhGrOt-48', // Replace with your videoId
      playerVars: {
        autoplay: 0,
        controls: 0,
        rel: 0,
        fs: 0,
        modestbranding: 1,
        iv_load_policy: 3,
        disablekb: 1,
        playsinline: 1,
        showinfo: 0
      },
      events: {
        onReady: (event: any) => this.onPlayerReady(event),
        onStateChange: (event: any) => this.onStateChange(event)
      }
    });
  }

  onPlayerReady(event: any) {
    this.duration = this.player.getDuration();
    this.setVolume();
    setInterval(() => this.updateProgress(), 1000);
  }

  onStateChange(event: any) {
    const isPlaying = event.data === YT.PlayerState.PLAYING;
    const topOverlay = document.querySelector('.hide-top') as HTMLElement;
    const bottomOverlay = document.querySelector('.hide-bottom-right') as HTMLElement;

    if (topOverlay && bottomOverlay) {
      topOverlay.style.display = isPlaying ? 'none' : 'block';
      bottomOverlay.style.display = isPlaying ? 'none' : 'block';
    }
  }

  playVideo() {
    if (!this.player) return;
    this.player.playVideo();
  }

  pauseVideo() {
    if (!this.player) return;
    this.player.pauseVideo();
  }

  seekTo(event: any) {
    if (!this.player) return;
    const time = event.target.value;
    this.player.seekTo(time, true);
  }

  updateProgress() {
    if (!this.player) return;
    this.zone.run(() => {
      this.currentTime = this.player.getCurrentTime();
    });
  }
  setVolume(event?: any) {
    if (!this.player) return;
    if (event) {
      this.volume = event.target.value;
    }
    this.player.setVolume(this.volume);
  }

  zoomIn() {
    this.zoomLevel += 0.1;
    const iframe = document.getElementById('player') as HTMLElement;
    iframe.style.transform = `scale(${this.zoomLevel})`;
  }

  zoomOut() {
    this.zoomLevel = Math.max(0.5, this.zoomLevel - 0.1);
    const iframe = document.getElementById('player') as HTMLElement;
    iframe.style.transform = `scale(${this.zoomLevel})`;
  }

  toggleFullscreen() {
    const elem = document.querySelector('.player-wrapper') as HTMLElement;
    if (!document.fullscreenElement) {
      elem.requestFullscreen?.().catch(err => console.error(err));
    } else {
      document.exitFullscreen?.();
    }
  }
}
