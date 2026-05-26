import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-reset-confirmation',
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './reset-confirmation.html',
})
export class ResetConfirmation {}
