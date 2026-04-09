import { Component, effect, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { AsyncPipe } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-layout',
  imports: [RouterOutlet, MatToolbarModule, MatMenuModule, MatIconModule, MatButtonModule, MatDividerModule],
  template: `
    <mat-toolbar color="primary" class="flex justify-between items-center shadow-md relative z-50 px-4 h-16">
      <span class="text-lg font-bold">E-Commerce Analytics</span>
      <div class="flex items-center">
        <button mat-icon-button [matMenuTriggerFor]="menu">
          <mat-icon>account_circle</mat-icon>
        </button>
        <mat-menu #menu="matMenu">
          <div class="px-4 py-3 font-bold text-gray-700">
            {{ user?.name || user?.email || 'User' }}
            <div class="text-xs text-gray-500 font-normal uppercase mt-1">{{ user?.role || '' }}</div>
          </div>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Sign out</span>
          </button>
        </mat-menu>
      </div>
    </mat-toolbar>
    <main class="max-w-7xl mx-auto p-6">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    mat-toolbar {
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      z-index: 50;
      position: relative;
    }
  `]
})
export class LayoutComponent {
  // layout
  auth = inject(AuthService);
  router = inject(Router);
  user: any;

  constructor() {
    this.user = this.auth.getUser();
  }

  logout() {
    this.auth.logout().subscribe();
  }
}
