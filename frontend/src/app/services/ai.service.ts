import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  AiSalesSummary, 
  AiPerformanceInsight, 
  AiProductDescription, 
  AiChatResponse 
} from '../models/ai.model';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private apiUrl = `${environment.apiUrl}/ai`;

  constructor(private http: HttpClient) {}

  getSalesSummary(startDate?: string, endDate?: string, category?: string): Observable<{ success: boolean; summary: AiSalesSummary }> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (category) params = params.set('category', category);

    return this.http.get<{ success: boolean; summary: AiSalesSummary }>(`${this.apiUrl}/sales-summary`, { params });
  }

  getPerformanceInsights(): Observable<{ success: boolean; insights: AiPerformanceInsight[] }> {
    return this.http.get<{ success: boolean; insights: AiPerformanceInsight[] }>(`${this.apiUrl}/insights`);
  }

  generateProductDescription(data: { name: string; category: string; features?: string; tone?: string; keywords?: string }): Observable<{ success: boolean; generatedData: AiProductDescription }> {
    return this.http.post<{ success: boolean; generatedData: AiProductDescription }>(`${this.apiUrl}/generate-description`, data);
  }

  sendChatMessage(message: string): Observable<{ success: boolean; response: string }> {
    return this.http.post<{ success: boolean; response: string }>(`${this.apiUrl}/chat`, { message });
  }
}
