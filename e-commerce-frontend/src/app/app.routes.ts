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
      { path: 'dashboard', component: DashboardComponent },
      { path: 'products', loadComponent: () => import('./components/product-list/product-list').then(m => m.ProductList) },
      { path: 'products/new', loadComponent: () => import('./components/product-form/product-form').then(m => m.ProductForm), canActivate: [AdminGuard] },
      { path: 'products/edit/:id', loadComponent: () => import('./components/product-form/product-form').then(m => m.ProductForm), canActivate: [AdminGuard] },
      { path: 'orders', loadComponent: () => import('./components/order-list/order-list').then(m => m.OrderList) },
      { path: 'cart', loadComponent: () => import('./components/cart/cart').then(m => m.CartComponent) },
      { path: 'checkout', loadComponent: () => import('./components/checkout/checkout').then(m => m.CheckoutComponent) },
      { path: 'not-found', loadComponent: () => import('./components/not-found/not-found').then(m => m.NotFound) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: 'signup', loadComponent: () => import('./components/signup/signup').then(m => m.Signup) },
  { path: 'login', loadComponent: () => import('./components/login/login').then(m => m.Login) },
  { path: 'forgot-password', loadComponent: () => import('./components/forgot-password/forgot-password').then(m => m.ForgotPassword) },
  { path: 'reset-password', loadComponent: () => import('./components/reset-password/reset-password').then(m => m.ResetPassword) },
  { path: 'reset-confirmation', loadComponent: () => import('./components/reset-confirmation/reset-confirmation').then(m => m.ResetConfirmation) },
  { path: '**', redirectTo: '' }
];
