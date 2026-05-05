import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, AsyncPipe, NgIf, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardChartComponent } from '../dashboard/dashboard-component';
import { DashboardService } from '../../services/dashboard.service';
import { ProductService } from '../../services/product.service';
import { DashboardData, DashboardFilter } from '../../models/dashboard.model';
import { of, Subject, timer, combineLatest, Observable } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, startWith, switchMap, map } from 'rxjs/operators';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatProgressSpinnerModule, 
    DashboardChartComponent,
    AsyncPipe,
    NgIf,
    CurrencyPipe
  ],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private productService = inject(ProductService);
  
  filters: DashboardFilter = {
    startDate: new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().substring(0,10),
    endDate: new Date().toISOString().substring(0,10),
    category: ''
  };

  private filterSubject = new Subject<DashboardFilter>();
  public analyticsData$!: Observable<DashboardData | null>;
  public categories$!: Observable<string[]>;
  public errorMsg = '';

  areaChartOptions = {
    interaction: { mode: 'index', intersect: false },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
          }).format(Number(value))
        }
      }
    },
    plugins: {
      legend: { display: true, position: 'top' as const }
    }
  };

  barChartOptions = {
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  ngOnInit(): void {
    this.categories$ = this.productService.getCategories().pipe(
      map(res => res.data),
      catchError(err => {
        console.error('Error fetching categories:', err);
        return of([]);
      })
    );

    const filterChanges$ = this.filterSubject.pipe(
      debounceTime(500),
      startWith({ ...this.filters }),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    );

    this.analyticsData$ = filterChanges$.pipe(
      switchMap((filters) => {
        this.errorMsg = '';
        return this.dashboardService.getAnalytics(filters).pipe(
          catchError(err => {
            this.errorMsg = 'Failed to load analytics data.';
            return of(null);
          })
        );
      })
    );

    this.applyFilters();
  }

  applyFilters(): void {
    this.filterSubject.next({ ...this.filters });
  }

  getConversionRate(value: number): string {
    return (value * 100).toFixed(1) + '%';
  }
}
