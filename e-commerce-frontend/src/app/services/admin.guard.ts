import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

import { AuthService } from './auth';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.auth.initializeAuth().pipe(
        take(1),
        map(() => {
            if (!this.auth.isAuthenticated()) {
                return this.router.parseUrl('/login');
            }

            const user = this.auth.getUserValue();
            if (user && user.role === 'admin') {
                return true;
            }

            return this.router.parseUrl('/dashboard');
        })
    );
  }
}
