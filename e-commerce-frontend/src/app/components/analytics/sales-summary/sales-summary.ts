import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AiService } from '../../../services/ai.service';
import { AiSalesSummary } from '../../../models/ai.model';
import { DashboardData } from '../../../models/dashboard.model';

@Component({
  selector: 'app-sales-summary',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, MatCardModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './sales-summary.html',
  styleUrls: ['./sales-summary.css']
})
export class SalesSummaryComponent implements OnInit {
  /** Real dashboard data passed from the parent AnalyticsComponent */
  @Input() dashboardData: DashboardData | null = null;

  summary: AiSalesSummary | null = null;
  loading: boolean = true;
  error: string | null = null;

  /** Sum of all revenue data points — the authoritative number from the DB */
  get totalRevenue(): number {
    if (!this.dashboardData?.revenueOverTime?.length) return 0;
    return this.dashboardData.revenueOverTime.reduce((sum, p) => sum + p.revenue, 0);
  }

  constructor(private aiService: AiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary(): void {
    this.loading = true;
    this.error = null;
    
    // Matches the parent AnalyticsComponent default filter: last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    this.aiService.getSalesSummary(startStr, endStr).subscribe({
      next: (res) => {
        if (res.success) {
          this.summary = res.summary;
        } else {
          this.error = 'Failed to load summary';
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error fetching AI Sales Summary. Make sure API key is configured.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
