import { Component, inject, signal } from '@angular/core';
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
  imports: [RouterOutlet, RouterModule, MatToolbarModule, MatMenuModule, MatIconModule, MatDividerModule, MatBadgeModule, NgIf],
  template: `
    <!-- Admin Sidebar -->
    <aside *ngIf="isAdmin" class="admin-sidebar" [class.open]="sidebarOpen()">
      <div class="admin-sidebar-header">
        <div class="admin-sidebar-logo">
          <mat-icon class="text-white text-xl w-5 h-5">dashboard</mat-icon>
        </div>
        <span class="font-semibold text-[var(--sidebar-foreground)]">Admin Panel</span>
      </div>

      <nav>
        <a routerLink="/dashboard" routerLinkActive="active" class="admin-nav-item" [routerLinkActiveOptions]="{exact: true}">
          <mat-icon class="text-xl w-5 h-5">dashboard</mat-icon>
          <span>Dashboard</span>
        </a>
        <a routerLink="/analytics" routerLinkActive="active" class="admin-nav-item">
          <mat-icon class="text-xl w-5 h-5">trending_up</mat-icon>
          <span>Analytics</span>
        </a>
        <a routerLink="/products" routerLinkActive="active" class="admin-nav-item">
          <mat-icon class="text-xl w-5 h-5">inventory_2</mat-icon>
          <span>Products</span>
        </a>
        <a routerLink="/admin/orders" routerLinkActive="active" class="admin-nav-item">
          <mat-icon class="text-xl w-5 h-5">shopping_bag</mat-icon>
          <span>Orders</span>
        </a>
      </nav>

      <div class="admin-sidebar-footer">
        <button class="admin-nav-item" (click)="logout()">
          <mat-icon class="text-xl w-5 h-5">logout</mat-icon>
          <span>Sign out</span>
        </button>
      </div>
    </aside>

    <!-- Mobile sidebar overlay -->
    <div *ngIf="isAdmin && sidebarOpen()" class="fixed inset-0 bg-black/50 z-30 lg:hidden" (click)="sidebarOpen.set(false)"></div>

    <!-- Main wrapper -->
    <div [class.admin-main]="isAdmin" [class.sidebar-collapsed]="isAdmin && !sidebarOpen()">
      <!-- Header -->
      <header class="sticky top-0 z-50 border-b shadow-sm bg-[var(--card)] border-[var(--border)]">
        <div class="flex items-center justify-between h-16 px-4" [class.max-w-7xl]="!isAdmin" [class.mx-auto]="!isAdmin">
          <!-- Left: Logo / Menu -->
          <div class="flex items-center gap-3">
            <button *ngIf="isAdmin" class="ref-btn ref-btn-ghost ref-btn-icon" (click)="sidebarOpen.set(!sidebarOpen())" aria-label="Toggle admin sidebar">
              <mat-icon>menu</mat-icon>
            </button>
            <button type="button" (click)="redirectHome()" class="flex items-center gap-2 cursor-pointer bg-transparent border-0 p-0">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--primary)]">
                <mat-icon class="text-white text-xl w-5 h-5">
                  {{ isAdmin ? 'dashboard' : 'shopping_cart' }}
                </mat-icon>
              </div>
              <span class="font-semibold text-[var(--foreground)]">{{'ShopHub'}}</span>
            </button>
          </div>

          <!-- Right: Actions -->
          <div class="flex items-center gap-2">
            <!-- Dark mode toggle -->
            <button class="theme-toggle" (click)="toggleTheme()" [attr.aria-label]="darkMode() ? 'Switch to light mode' : 'Switch to dark mode'">
              <mat-icon class="text-xl w-5 h-5">
                {{ darkMode() ? 'light_mode' : 'dark_mode' }}
              </mat-icon>
            </button>

            <!-- Cart (customer only) -->
            <button *ngIf="!isAdmin" class="theme-toggle" routerLink="/cart">
              <mat-icon [matBadge]="cartItemCount()" matBadgeColor="warn" matBadgeSize="small"
                class="text-xl w-5 h-5">
                shopping_cart
              </mat-icon>
            </button>

            <!-- User menu -->
            <button class="theme-toggle" [matMenuTriggerFor]="menu">
              <mat-icon class="text-xl w-5 h-5">person</mat-icon>
            </button>
            <mat-menu #menu="matMenu">
              <div class="px-4 py-3 text-[var(--foreground)]">
                <div class="font-semibold">{{ user?.name || user?.email || 'User' }}</div>
                <div class="text-xs mt-1 text-[var(--muted-foreground)] uppercase">{{ user?.role || '' }}</div>
              </div>
              <mat-divider></mat-divider>
              
              <!-- Customer Only Links -->
              <ng-container *ngIf="!isAdmin">
                <button mat-menu-item routerLink="/orders">
                  <mat-icon>local_shipping</mat-icon>
                  <span>My Orders</span>
                </button>
                <button mat-menu-item routerLink="/profile">
                  <mat-icon>person</mat-icon>
                  <span>My Profile</span>
                </button>
                <mat-divider></mat-divider>
              </ng-container>

              <button mat-menu-item (click)="logout()">
                <mat-icon>logout</mat-icon>
                <span>Sign out</span>
              </button>
            </mat-menu>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main [class.max-w-7xl]="!isAdmin" [class.mx-auto]="!isAdmin" [class.p-6]="!isAdmin">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class LayoutComponent {
  auth = inject(AuthService);
  cartService = inject(CartService);
  router = inject(Router);
  user: any;
  isAdmin = false;
  sidebarOpen = signal(false);
  darkMode = signal(false);

  cartItemCount = this.cartService.totalItems;

  constructor() {
    this.auth.initializeAuth().subscribe();
    this.auth.currentUser$.subscribe(u => {
      this.user = u;
      this.isAdmin = u?.role === 'admin';
    });

    if (typeof window !== 'undefined') {
      this.sidebarOpen.set(window.matchMedia('(min-width: 1025px)').matches);
    }

    // Initialize dark mode from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.darkMode.set(true);
      document.documentElement.classList.add('dark');
    }
  }

  toggleTheme() {
    this.darkMode.set(!this.darkMode());
    if (this.darkMode()) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
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
