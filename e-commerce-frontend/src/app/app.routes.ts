import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard-component';
import { UserHomeComponent } from './components/user-home/user-home.component';
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
      { path: 'home', component: UserHomeComponent },
      { path: '', redirectTo: 'home', pathMatch: 'full' } // AuthGuard will redirect if not authenticated, else home
    ]
  },
  { path: 'signup', loadComponent: () => import('./components/signup/signup').then(m => m.Signup) },
  { path: 'login', loadComponent: () => import('./components/login/login').then(m => m.Login) },
  { path: '**', redirectTo: '' }
];
