import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AiService } from '../../../services/ai.service';
import { AiPerformanceInsight } from '../../../models/ai.model';

@Component({
  selector: 'app-performance-insights',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './performance-insights.html',
  styleUrls: ['./performance-insights.css']
})
export class PerformanceInsightsComponent implements OnInit {
  insights: AiPerformanceInsight[] = [];
  loading: boolean = true;
  error: string | null = null;

  constructor(private aiService: AiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadInsights();
  }

  loadInsights(): void {
    this.loading = true;
    this.error = null;

    this.aiService.getPerformanceInsights().subscribe({
      next: (res) => {
        if (res.success && res.insights) {
          this.insights = res.insights;
        } else {
          this.error = 'Failed to load insights';
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error fetching AI Performance Insights.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getIconForType(type: string): string {
    switch(type) {
      case 'warning': return 'warning_amber';
      case 'success': return 'check_circle_outline';
      case 'recommendation': return 'lightbulb_outline';
      case 'info': default: return 'info_outline';
    }
  }

  getColorClassForType(type: string): string {
    switch(type) {
      case 'warning': return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'success': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'recommendation': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'info': default: return 'bg-slate-50 border-slate-200 text-slate-800';
    }
  }

  getIconColorClassForType(type: string): string {
    switch(type) {
      case 'warning': return 'text-amber-600';
      case 'success': return 'text-emerald-600';
      case 'recommendation': return 'text-blue-600';
      case 'info': default: return 'text-slate-600';
    }
  }
}
