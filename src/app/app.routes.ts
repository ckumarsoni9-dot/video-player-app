import { Routes } from '@angular/router';
import { VideoPlayerComponent } from './video-player/video-player.component';

export const routes: Routes = [
    { path: '', redirectTo: 'video-player', pathMatch: 'full' }, // redirect empty path
    { path: 'video-player', component: VideoPlayerComponent }
];
