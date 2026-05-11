import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AiService } from '../../../services/ai.service';
import { AiSalesSummary } from '../../../models/ai.model';

@Component({
  selector: 'app-sales-summary',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './sales-summary.html',
  styleUrls: ['./sales-summary.css']
})
export class SalesSummaryComponent implements OnInit {
  summary: AiSalesSummary | null = null;
  loading: boolean = true;
  error: string | null = null;

  constructor(private aiService: AiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary(): void {
    this.loading = true;
    this.error = null;
    
    // Defaulting to last 30 days for demo purposes
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
