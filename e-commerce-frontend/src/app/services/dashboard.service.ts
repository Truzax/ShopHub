import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { DashboardData, DashboardFilter } from '../models/dashboard.model';
import { environment } from '../../environments/environment';

interface DashboardApiResponse {
  success: boolean;
  data: DashboardData;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getAnalytics(filters: DashboardFilter): Observable<DashboardData> {
    let params = new HttpParams()
      .set('startDate', filters.startDate)
      .set('endDate', filters.endDate);

    if (filters.category) {
      params = params.set('category', filters.category);
    }

    return this.http.get<DashboardApiResponse>(this.apiUrl, { params }).pipe(
      map(response => response.data),
      shareReplay(1)
    );
  }
}