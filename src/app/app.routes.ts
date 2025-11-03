import { Routes } from '@angular/router';
import { VideoPlayerComponent } from './video-player/video-player.component';
import { Player2Component } from './player2/player2.component';

export const routes: Routes = [
    { path: '', redirectTo: 'video-player2', pathMatch: 'full' }, 
    { path: 'video-player', component: VideoPlayerComponent },
    { path: 'video-player2', component: Player2Component }
];
