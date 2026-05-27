import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  const authReq = req.clone({
    withCredentials: true
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Prevent recursive refresh loops if auth endpoint itself fails
      if (error.status === 401 && !req.url.includes('/api/auth/')) {
        return authService.refresh().pipe(
          switchMap(() => {
            const retryReq = req.clone({
              withCredentials: true
            });
            return next(retryReq);
          }),
          catchError((err) => {
            authService.logout().subscribe();
            return throwError(() => err);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
