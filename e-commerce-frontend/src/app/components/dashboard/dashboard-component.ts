import { Component, OnInit, OnChanges, OnDestroy, SimpleChanges, Input, ViewChild, ElementRef, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule, AsyncPipe, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Subject, Observable, of, combineLatest, timer } from 'rxjs';
import { debounceTime, switchMap, catchError, distinctUntilChanged, startWith } from 'rxjs/operators';
import Chart from 'chart.js/auto';

import { AuthService } from '../../services/auth';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardData, DashboardFilter, RevenuePoint } from '../../models/dashboard.model';

@Component({
  selector: 'app-revenue-chart',
  standalone: true,
  template: '<canvas #chartCanvas></canvas>',
  styles: [':host { display: block; width: 100%; height: 100%; }']
})
export class RevenueChartComponent implements OnChanges, OnDestroy {
  @Input() data: RevenuePoint[] = [];
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  chart: Chart | null = null;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && this.data) {
      this.renderChart();
    }
  }

  renderChart() {
    if (this.chart) {
      this.chart.destroy();
    }
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.data.map(d => d.date),
        datasets: [{
          label: 'Revenue',
          data: this.data.map(d => d.revenue),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          y: {
            ticks: {
              callback: value => new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
              }).format(Number(value))
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: context => new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR'
              }).format(Number(context.parsed.y))
            }
          },
          legend: { display: false }
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.chart) this.chart.destroy();
  }
}

@Component({
  selector: 'app-dashboard-component',
  standalone: true,
  imports: [CommonModule, FormsModule, RevenueChartComponent, HttpClientModule, MatCardModule, MatButtonModule, RouterModule, AsyncPipe, NgIf],
  templateUrl: './dashboard-component.html',
  styleUrls: ['./dashboard-component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private dashboardService = inject(DashboardService);
  currentUser$ = this.auth.currentUser$;

  filters: DashboardFilter = {
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().substring(0,10),
    endDate: new Date().toISOString().substring(0,10),
    category: ''
  };

  private filterSubject = new Subject<DashboardFilter>();
  public dashboardData$!: Observable<DashboardData | null>;
  public errorMsg = '';

  constructor() {}

  ngOnInit(): void {
    const filterChanges$ = this.filterSubject.pipe(
      debounceTime(500),
      startWith({ ...this.filters }),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    );

    const autoRefresh$ = timer(0, 5000);

    this.dashboardData$ = combineLatest([filterChanges$, autoRefresh$]).pipe(
      switchMap(([filters]) => {
        this.errorMsg = '';
        return this.dashboardService.getAnalytics(filters).pipe(
          catchError(err => {
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

  trackByName(index: number, item: any): string {
    return item.name;
  }
}
