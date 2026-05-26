import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AiChatComponent } from './components/ai-chat/ai-chat';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AiChatComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('e-commerce-frontend');
}
