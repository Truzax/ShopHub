import { Component, OnInit, OnChanges, OnDestroy, SimpleChanges, Input, ViewChild, ElementRef, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule, AsyncPipe, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, Observable, of, combineLatest, timer } from 'rxjs';
import { debounceTime, switchMap, catchError, distinctUntilChanged, startWith } from 'rxjs/operators';
import Chart from 'chart.js/auto';

import { AuthService } from '../../services/auth';
import { DashboardService } from '../../services/dashboard.service';
import { ProductService } from '../../services/product.service';
import { DashboardData, DashboardFilter, RevenuePoint, CategoryDistribution } from '../../models/dashboard.model';
import { map } from 'rxjs/operators';
import { ProductList } from '../product-list/product-list';

@Component({
  selector: 'app-dashboard-chart',
  standalone: true,
  template: '<canvas #chartCanvas></canvas>',
  styles: [':host { display: block; width: 100%; height: 100%; }']
})
export class DashboardChartComponent implements OnChanges, OnDestroy {
  @Input() type: 'line' | 'pie' | 'bar' = 'line';
  @Input() data: any[] = [];
  @Input() options: any = {};
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  chart: Chart | null = null;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['type'] && this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    if ((changes['data'] || changes['type']) && this.data) {
      this.renderChart();
    }
  }

  renderChart() {
    const chartData = this.getChartData();
    
    if (this.chart) {
      this.chart.data = chartData;
      this.chart.options = {
        responsive: true,
        maintainAspectRatio: false,
        ...this.options
      };
      this.chart.update('none'); // Update without animation to prevent jitter
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: any = {
      type: this.type,
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...this.options
      }
    };

    this.chart = new Chart(ctx, config);
  }

  private getChartData() {
    if (this.type === 'line') {
      return {
        labels: this.data.map(d => d.date),
        datasets: [{
          label: 'Revenue',
          data: this.data.map(d => d.revenue),
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          tension: 0.4
        }]
      };
    } else if (this.type === 'pie') {
      return {
        labels: this.data.map(d => d.name),
        datasets: [{
          data: this.data.map(d => d.value),
          backgroundColor: this.data.map(d => d.color || '#4f46e5'),
          borderWidth: 0
        }]
      };
    } else if (this.type === 'bar') {
      return {
        labels: this.data.map(d => d.hour),
        datasets: [{
          label: 'Orders',
          data: this.data.map(d => d.count),
          backgroundColor: '#4f46e5',
          borderRadius: 8
        }]
      };
    }
    return { labels: [], datasets: [] };
  }

  ngOnDestroy() {
    if (this.chart) this.chart.destroy();
  }
}

@Component({
  selector: 'app-dashboard-component',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardChartComponent, HttpClientModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, RouterModule, AsyncPipe, NgIf, ProductList],
  templateUrl: './dashboard-component.html',
  styleUrls: ['./dashboard-component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private productService = inject(ProductService);
  currentUser$ = this.auth.currentUser$;

  filters: DashboardFilter = {
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().substring(0,10),
    endDate: new Date().toISOString().substring(0,10),
    category: ''
  };

  private filterSubject = new Subject<DashboardFilter>();
  public dashboardData$!: Observable<DashboardData | null>;
  public categories$!: Observable<string[]>;
  public errorMsg = '';
  public selectedCategory = '';
  public selectedSort = '';

  lineChartOptions = {
    interaction: { mode: 'index', intersect: false },
    scales: {
      y: {
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
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
          }).format(Number(context.parsed.y))
        }
      }
    }
  };

  pieChartOptions = {
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
    }
  };

  constructor() {}

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

    this.dashboardData$ = filterChanges$.pipe(
      switchMap((filters) => {
        this.errorMsg = '';
        return this.dashboardService.getAnalytics(filters).pipe(
          catchError(err => {
            console.error('Dashboard error:', err);
            this.errorMsg = 'Failed to load dashboard data. Please try again later.';
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

  setCategory(cat: string): void {
    this.selectedCategory = this.selectedCategory === cat ? '' : cat;
  }

  getTotalRevenue(data: DashboardData): number {
    return data.revenueOverTime.reduce((sum, p) => sum + p.revenue, 0);
  }

  getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'ref-status-pending',
      'processing': 'ref-status-processing',
      'shipped': 'ref-status-shipped',
      'delivered': 'ref-status-delivered',
      'cancelled': 'ref-status-cancelled',
      'completed': 'ref-status-completed'
    };
    return statusMap[status.toLowerCase()] || '';
  }

  trackByOrderId(index: number, item: any): string {
    return item.id;
  }

  trackByName(index: number, item: any): string {
    return item.name;
  }
}
