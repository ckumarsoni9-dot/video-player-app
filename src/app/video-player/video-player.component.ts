import { ActivatedRoute } from '@angular/router';
import { Component, ElementRef, HostListener, Inject, Input, OnChanges, OnDestroy, OnInit, signal, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import $ from 'jquery';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { YoutubePlayerService } from '../services/youtube-player.service';
import { CryptoService } from '../services/crypto.service';
import { HttpService } from '../services/http.service';
import { CommonService } from '../services/common.service';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [MatMenuModule, MatButtonModule, MatTooltipModule],
  templateUrl: './video-player.component.html',
  styleUrl: './video-player.component.scss',
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('fadeInOut', [
      state('void', style({ opacity: 0 })),
      transition('void <=> *', [
        animate(300)
      ])
    ]),
    trigger('fadeInOutZoom', [
      state('void', style({ opacity: 0, transform: 'scale(0.5)' })),
      transition('void => *', [
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition('* => void', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'scale(0.5)' }))
      ])
    ]),
    trigger('fastForwardFadeInOutZoom', [
      state('void', style({ opacity: 0, transform: 'scale(0.5)' })),
      transition('void => *', [
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition('* => void', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.5)' }))
      ])
    ]),

  ],
})
export class VideoPlayerComponent implements OnInit, OnDestroy, OnChanges {
  constructor(
    @Inject(DOCUMENT) private document: any,
    private youtubePlayerService: YoutubePlayerService,
    private _http: HttpService, private _crypto: CryptoService,
    private _common: CommonService, private route: ActivatedRoute
  ) {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  // ngOnInit(): void {
  //   this.activatedRoute.params.subscribe(params => {
  //     console.log(params);
  //     if(params['vidId']) {
  //       console.log(params['videoId']);
  //     }
  //   })
  // }

  ngOnInit(): void {
    let vidId = this.route.snapshot.queryParamMap.get('vidId');
    this.route.queryParamMap.subscribe(params => {
      vidId = params.get('vidId');
         if (window['YT'] && window['YT'].Player) {
            this.youtubePlayerService.initPlayer('player', vidId);

          }
    });
    
    console.log('Video ID:', vidId);
    document.getElementById('custome-player').DOCUMENT_NODE
    this.resetHideControlsTimeout();
    this.elem = document.documentElement;
    this.youtubePlayerService.currentTime$.subscribe(time => {
      this.currentTime = time;
    });
    // Subscribe to duration updates
    this.youtubePlayerService.duration$.subscribe(duration => {
      this.duration = duration;
    });
    this.youtubePlayerService.qualityLevels$.subscribe(qualities => {
      setTimeout(() => {
        if (qualities.length > 0) {
          this.availableQualities = qualities;
        }
      }, 1000);
    });

    this.youtubePlayerService.selectedQuality$.subscribe(quality => {
      this.selectedQuality = quality;
    });
    this.youtubePlayerService.playbackRates$.subscribe(rates => {
      this.availablePlaybackRates = rates;


    });
    this.youtubePlayerService.selectedPlaybackRate$.subscribe(rate => this.selectedPlaybackRate = rate);
     this.isPlayVideo = true;
        this._common.isVideoPlayed.set(true);
        return;
    this.youtubePlayerService.playerState$.subscribe(res => {

      if (res == 0) {
        this.isPlayVideo = false;
        let watchHistory = {
          videoId: this.vidData.videoId,
          videoLengthTime: this.formatTime(this.duration),
          watchTime: this.formatTime(this.currentTime)
        }
        this._http.post("https://sahosoft.co.in/api/sahosoft/Stream_OnlineVideoClass_UserVideoWatchHistory/Update_UserVideoWatchHistory", watchHistory).subscribe();


      } else {
        this.isPlayVideo = true;
        this._common.isVideoPlayed.set(true);

      }

    });
  }
  public volume = 50;
  public currentTime = 0;
  public duration = 0;
  selectedQuality: string = '';
  qualityDropdownVisible: boolean = false;
  availableQualities: string[] = [];
  selectedPlaybackRate: number = 1;
  availablePlaybackRates: number[] = [];
  value: 10;
  showControls: boolean = false;
  hideControlsTimeout: any;
  showPlayPauseButton: boolean = false;
  @Input() vidData: any | undefined;
  @Input() scrollDown: boolean = false;

  video: any;
  videoUrls: any = '';


  ngOnChanges(changes: SimpleChanges): void {
    clearTimeout(this.hideControlsTimeout);
    this.youtubePlayerService.destroyPlayer();

    // 
    let userDetails = JSON.parse(this._crypto.getStorage("SYSUSER_DT"));
    this._common.checkForForceLogout();
    this._common.isForceLogut$.subscribe(res => {
      if (res) {
        const apiCalls = [];

        if (res.isForceLogout) {
          apiCalls.push(this._http.post("https://sahosoft.co.in/api/sahosoft/Stream_OnlineVideoClass_DesktopApp/UpdateLogoutStatus", {
            id: res.id,
            userId: userDetails.userId
          }));
        }

        if (res.isIndividualForceLogout) {
          apiCalls.push(this._http.post("https://sahosoft.co.in/api/sahosoft/Stream_OnlineVideoClass_DesktopApp/UpdateIndividualLogoutStatus", {
            id: res.id,
            userId: userDetails.userId
          }));
        }

        // if (apiCalls.length > 0) {
        //   forkJoin(apiCalls).subscribe(results => {
        //     const allSuccessful = results.every(result => result.isSuccess);
        //     if (allSuccessful) {
        //       this._auth.logout();
        //     }
        //   });
        // }
      }
    });
    // 

    if (changes['vidData'].currentValue && this.vidData) {
      this.video = this.vidData;

      this._http.get("https://sahosoft.co.in/api/sahosoft/Stream_videoPlayInfo/youtubePlayIfram/" + this.video.token + '/' + this.video.videoId).subscribe(res => {
        if (res) {
          this.currentTime = 0;
          this.duration = 0;
          this.videoUrls = res.youtubeUrl;


          this.showControls = true; // Show controls initially
          if (window['YT'] && window['YT'].Player) {
            this.youtubePlayerService.initPlayer('player', this.videoUrls);

          }


        }
      })
    }
  }

  @HostListener('document:keydown.space', ['$event'])
  handleSpacebarEvent(event: KeyboardEvent) {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      return;
    }
    event.preventDefault();
    this.playToggleVideo();
  }

  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') {
      this.forward();
      this.showControls = true;
      this.resetHideControlsTimeout();
    } else if (event.key === 'ArrowLeft') {
      this.backward();
      this.showControls = true;
      this.resetHideControlsTimeout();
    }
  }
  @ViewChild('playerContainer') playerContainer: ElementRef;
  loadYouTubeAPI(): Promise<void> {
    return new Promise((resolve) => {
      const existingScript = document.getElementById('youtube-api-script');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/player_api';
        tag.id = 'youtube-api-script';
        tag.onload = () => resolve();
        document.body.appendChild(tag);
      } else {
        resolve();
      }
    });
  }
  play_Status: any;
  formatTime(seconds: number): string {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }

  @HostListener('document:fullscreenchange', ['$event'])
  async handleFullscreenChange(event: Event) {
    this.isFullScreen = !this.isFullScreen;
    // await appWindow.setFullscreen(this.isFullScreen);

  }
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    this.showControls = true;
    this.resetHideControlsTimeout();
  }

  // Function to reset the hide controls timeout
  resetHideControlsTimeout(): void {
    clearTimeout(this.hideControlsTimeout);
    this.hideControlsTimeout = setTimeout(() => {
      this.showControls = false;
    }, 10000); // 10000 milliseconds = 10 seconds
  }

  title = 'angular-stream';
  elem: any;
  @ViewChild('tooltip') tooltip: MatTooltip;
  ngAfterViewInit(): void {

    this.youtubePlayerService.isPlayReady$.subscribe(res => {
      if (res) {

        if (this.tooltip) {
          this.tooltip.show();
        }

      }

    })

  }
  isPlayVideo: boolean = true;
  playToggleVideo(): void {

    this.isPlayVideo = !this.isPlayVideo;
    this.isPlayVideo ? this.youtubePlayerService.playVideo() : this.youtubePlayerService.pauseVideo();

    this.showPlayPauseButton = true;
    setTimeout(() => {
      this.showPlayPauseButton = false;
    }, 200);

  }

  isMuted: boolean = false;
  togglemute() {
    this.isMuted = !this.isMuted;
    this.isMuted ? this.youtubePlayerService.mute() : this.youtubePlayerService.unMute();
  }


  setVolume(event: any): void {
    const inputElement = event.target as HTMLInputElement;
    const volume = +inputElement.value;
    this.youtubePlayerService.setVolume(volume);

    // Update the background style
    inputElement.style.background = `linear-gradient(to right, rgb(255, 255, 255) ${volume}%, rgb(155, 155, 155) ${volume}%)`;
  }
  isFullScreen: boolean = false;

  async openFullscreen() {

    const playerElement = this.playerContainer.nativeElement;
    if (!this.isFullScreen) {
      if (playerElement.requestFullscreen) {
        playerElement.requestFullscreen();
      } else if (playerElement.mozRequestFullScreen) {
        /* Firefox */
        playerElement.mozRequestFullScreen();
      } else if (playerElement.webkitRequestFullscreen) {
        /* Chrome, Safari and Opera */
        playerElement.webkitRequestFullscreen();
      } else if (playerElement.msRequestFullscreen) {
        /* IE/Edge */
        playerElement.msRequestFullscreen();
      }
      // await appWindow.setFullscreen(!this.isFullScreen);
      // $('#player').css('width', '100vw');
    } else {
      if (this.document.exitFullscreen) {
        this.document.exitFullscreen();
      } else if (this.document.mozCancelFullScreen) {
        /* Firefox */
        this.document.mozCancelFullScreen();
      } else if (this.document.webkitExitFullscreen) {
        /* Chrome, Safari and Opera */
        this.document.webkitExitFullscreen();
      } else if (this.document.msExitFullscreen) {
        /* IE/Edge */
        this.document.msExitFullscreen();
      }
      // $('#player').css('width', '1051px');
      // await appWindow.setFullscreen(!this.isFullScreen);
    }

  }

  seek(event: MouseEvent): void {
    const timeline = this.document.querySelector('.timeline') as HTMLElement;
    const rect = timeline.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const percentage = offsetX / rect.width;
    const newTime = percentage * this.duration;

    this.youtubePlayerService.seekTo(newTime);
  }


  changeQuality(quality: string) {
    // this.youtubePlayerService.initPlayer('player', 'wWarOEPuimw');
    this.youtubePlayerService.setPlaybackQuality(quality);
  }

  togglePlaybackRateDropdown() {
    this.youtubePlayerService.updateQualityLevels();
    this.youtubePlayerService.updatePlaybackRates();
  }

  changePlaybackRate(rate: number) {
    this.youtubePlayerService.setPlaybackRate(rate);
  }
  isForWard: boolean = false;
  isBackward: boolean = false;
  forward() {
    this.isBackward = false;
    this.isForWard = true;
    this.youtubePlayerService.forward(10);
    $('.fast-forward').addClass('animate__heartBeat');
    setTimeout(() => {
      $('.fast-forward').removeClass('animate__heartBeat');
      this.isForWard = false;
    }, 2000);

  }

  backward() {
    this.isForWard = false;
    this.isBackward = true;
    this.youtubePlayerService.backward(10);
    $('.fast-rewind').addClass('animate__heartBeat');
    setTimeout(() => {
      $('.fast-rewind').removeClass('animate__heartBeat');
      this.isBackward = false;
    }, 2000);

  }

  async toggleFullscreen() {
    // const isFullscreen = await appWindow.isFullscreen();
    // await appWindow.setFullscreen(!isFullscreen);
  }

  ngOnDestroy(): void {
    // Clean up timers or subscriptions if needed

    let watchHistory = {
      videoId: this.vidData.videoId,
      videoLengthTime: this.formatTime(this.duration),
      watchTime: this.formatTime(this.currentTime)
    }

    this._http.post("https://sahosoft.co.in/api/sahosoft/Stream_OnlineVideoClass_UserVideoWatchHistory/Update_UserVideoWatchHistory", watchHistory).subscribe(res => {
      clearTimeout(this.hideControlsTimeout);
      this.youtubePlayerService.destroyPlayer();
    });

  }

}
