import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseAuth = `${environment.apiUrl}/auth`;
  private baseUsers = `${environment.apiUrl}/users`;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private initialized = false;

  constructor(private http: HttpClient, private router: Router) {}

  // Initialize the user state from the server if a token exists
  initializeAuth(): Observable<any> {
      if (!this.getAccessToken()) {
          this.initialized = true;
          return of(null);
      }
      return this.getProfile().pipe(
          tap(user => {
              this.currentUserSubject.next(user);
              this.initialized = true;
          }),
          catchError(() => {
              this.logoutLocally();
              this.initialized = true;
              return of(null);
          })
      );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseAuth}/login`, { email, password }, { withCredentials: true }).pipe(
      tap((res) => {
        if (res && res.token) {
            localStorage.removeItem('cart'); // Clear any previous user's cart
            localStorage.setItem('access_token', res.token);
            this.currentUserSubject.next(res.user);
        }
      })
    );
  }

  signup(payload: { name: string; email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseAuth}/signup`, payload, { withCredentials: true }).pipe(
      tap((res) => {
        if (res && res.token) {
            localStorage.removeItem('cart'); // Clear any previous user's cart
            localStorage.setItem('access_token', res.token);
            this.currentUserSubject.next(res.user);
        }
      })
    );
  }

  forgotPassword(email: string) {
    return this.http.post<any>(`${this.baseAuth}/forgot-password`, { email }, { withCredentials: true });
  }

  resetPassword(payload: { email: string; token: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseAuth}/reset-password`, payload, { withCredentials: true }).pipe(
      tap((res) => {
        if (res && res.token) {
            localStorage.setItem('access_token', res.token);
            this.currentUserSubject.next(res.user);
        }
      })
    );
  }

  validateReset(token: string, email: string) {
    const params = new HttpParams().set('token', token).set('email', email);
    return this.http.get<any>(`${this.baseAuth}/validate-reset`, { params, withCredentials: true });
  }

  logout() {
    return this.http.post(`${this.baseAuth}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this.logoutLocally();
      }),
      catchError(() => {
        this.logoutLocally();
        return of(null);
      })
    );
  }

  private logoutLocally() {
      localStorage.removeItem('access_token');
      localStorage.removeItem('cart'); // Ensure cart doesn't leak to a new user
      this.currentUserSubject.next(null);
      this.router.navigate(['/login']);
  }

  refresh(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseAuth}/refresh`, {}, { withCredentials: true }).pipe(
      tap((res) => {
        if (res && res.token) {
            localStorage.setItem('access_token', res.token);
            this.currentUserSubject.next(res.user);
        }
      }),
      catchError((error) => {
          this.logoutLocally();
          throw error;
      })
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  setAccessToken(token: string) {
    localStorage.setItem('access_token', token);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  getUserValue(): User | null {
      return this.currentUserSubject.value;
  }

  getProfile(): Observable<User> {
    const token = this.getAccessToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<User>(`${this.baseUsers}/me`, { headers });
  }
}
