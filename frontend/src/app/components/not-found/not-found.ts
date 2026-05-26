import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule, MatIconModule],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css',
})
export class NotFound {}
