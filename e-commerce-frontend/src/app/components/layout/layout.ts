import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CartService } from '../../services/cart.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { AsyncPipe, NgIf } from '@angular/common';
import { map } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-layout',
  imports: [RouterOutlet, RouterModule, MatToolbarModule, MatMenuModule, MatIconModule, MatDividerModule, MatBadgeModule, AsyncPipe, NgIf],
  template: `
    <mat-toolbar color="primary" class="flex justify-between items-center shadow-md relative z-50 px-4 h-16">
      <button
        type="button"
        (click)="redirectHome()"
        class="text-lg font-bold cursor-pointer bg-transparent border-0 p-0 text-inherit hover:bg-transparent focus:outline-none">
        E-Commerce Analytics
      </button>
      <div class="flex items-center gap-2">
        <button *ngIf="user?.role !== 'admin'" mat-icon-button routerLink="/cart" matTooltip="Shopping Cart" class="cursor-pointer">
          <mat-icon [matBadge]="(cartItemCount$ | async)" matBadgeColor="warn" matBadgeSize="small">
            shopping_cart
          </mat-icon>
        </button>
        <button mat-icon-button [matMenuTriggerFor]="menu" class="cursor-pointer">
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
  cartService = inject(CartService);
  router = inject(Router);
  user: any;

  cartItemCount$ = this.cartService.cart$.pipe(
    map(cart => cart.items.length)
  );

  constructor() {
    this.auth.initializeAuth().subscribe();
    this.auth.currentUser$.subscribe(u => {
      this.user = u;
    });
  }

  logout() {
    this.auth.logout().subscribe();
  }

  redirectHome() {
    if (this.auth.getUserValue()) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
