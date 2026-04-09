import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseAuth = 'http://localhost:3000/api/auth';
  private baseUsers = 'http://localhost:3000/api/users';

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.baseAuth}/login`, { email, password }, { withCredentials: true }).pipe(
      tap((res) => {
        if (res && res.token) localStorage.setItem('access_token', res.token);
      })
    );
  }

  signup(payload: { name: string; email: string; password: string }) {
    return this.http.post<any>(`${this.baseAuth}/signup`, payload, { withCredentials: true }).pipe(
      tap((res) => {
        if (res && res.token) localStorage.setItem('access_token', res.token);
      })
    );
  }

  logout() {
    return this.http.post(`${this.baseAuth}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => {
        localStorage.removeItem('access_token');
        this.router.navigate(['/login']);
      })
    );
  }

  refresh() {
    return this.http.post<any>(`${this.baseAuth}/refresh`, {}, { withCredentials: true }).pipe(
      tap((res) => {
        if (res && res.token) localStorage.setItem('access_token', res.token);
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

  getUser(): any {
    const token = this.getAccessToken();
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      // Handles base64 decoding correctly for unicode if needed, standard btoa works for basic ASCII
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  getProfile() {
    const token = this.getAccessToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<any>(`${this.baseUsers}/me`, { headers });
  }
}
