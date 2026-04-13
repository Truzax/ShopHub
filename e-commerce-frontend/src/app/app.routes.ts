import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard-component';
import { UserDashboard } from './components/user-dashboard/user-dashboard';
import { LayoutComponent } from './components/layout/layout';
import { AuthGuard } from './services/auth.guard';
import { AdminGuard } from './services/admin.guard';

export const routes: Routes = [
  { 
    path: '', 
    component: LayoutComponent, 
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent, canActivate: [AdminGuard] },
      { path: 'home', component: UserDashboard },
      { path: '', redirectTo: 'home', pathMatch: 'full' } // AuthGuard will redirect if not authenticated, else home
    ]
  },
  { path: 'signup', loadComponent: () => import('./components/signup/signup').then(m => m.Signup) },
  { path: 'login', loadComponent: () => import('./components/login/login').then(m => m.Login) },
  { path: 'forgot-password', loadComponent: () => import('./components/forgot-password/forgot-password').then(m => m.ForgotPassword) },
  { path: 'reset-password', loadComponent: () => import('./components/reset-password/reset-password').then(m => m.ResetPassword) },
  { path: 'reset-confirmation', loadComponent: () => import('./components/reset-confirmation/reset-confirmation').then(m => m.ResetConfirmation) },
  { path: '**', redirectTo: '' }
];
