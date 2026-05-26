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
      case 'warning': return 'border-l-amber-400 dark:border-l-amber-500';
      case 'success': return 'border-l-emerald-400 dark:border-l-emerald-500';
      case 'recommendation': return 'border-l-blue-400 dark:border-l-blue-500';
      case 'info': default: return 'border-l-[var(--muted-foreground)]';
    }
  }

  getIconColorClassForType(type: string): string {
    switch(type) {
      case 'warning': return 'text-amber-600 dark:text-amber-400';
      case 'success': return 'text-emerald-600 dark:text-emerald-400';
      case 'recommendation': return 'text-blue-600 dark:text-blue-400';
      case 'info': default: return 'text-slate-600 dark:text-slate-300';
    }
  }
}
