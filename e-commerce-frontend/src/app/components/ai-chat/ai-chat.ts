import { Component, OnInit, ElementRef, ViewChild, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AiService } from '../../services/ai.service';
import { AuthService, User } from '../../services/auth';
import { marked } from 'marked';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  isHtml?: boolean;
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './ai-chat.html',
  styleUrls: ['./ai-chat.css']
})
export class AiChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  
  isOpen = false;
  messages: ChatMessage[] = [];
  newMessage = '';
  isLoading = false;
  
  isAuthenticated = false;
  isAdmin = false;
  greeting = '';
  suggestions: string[] = [];

  constructor(private aiService: AiService, private authService: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Subscribe to auth state to determine visibility and role
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.isAuthenticated = !!user;
      
      if (user) {
        this.isAdmin = user.role === 'admin';
        this.setupRoleContext();
      } else {
        this.isOpen = false; // Force close if logged out
      }
    });
  }

  setupRoleContext() {
    this.messages = []; // Clear history on role switch/login

    if (this.isAdmin) {
      this.greeting = 'Hello! I am your AI Business Assistant. I can help you analyze sales, check stock, and manage operations.';
      this.suggestions = ['Show this week\'s sales summary', 'Which products are low on stock?', 'What are the top 5 best sellers?'];
    } else {
      this.greeting = 'Hi there! I am your AI Shopping Assistant. How can I help you find the perfect product today?';
      this.suggestions = ['Recommend a laptop under ₹60,000', 'What is popular right now?', 'Show gaming accessories'];
    }

    this.messages.push({ role: 'model', content: this.greeting });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  scrollToBottom(): void {
    try {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }

  async sendMessage() {
    if (!this.newMessage.trim()) return;

    const userMsg = this.newMessage;
    this.messages.push({ role: 'user', content: userMsg });
    this.newMessage = '';
    this.isLoading = true;

    this.aiService.sendChatMessage(userMsg).subscribe({
      next: async (res) => {
        if (res.success && res.response) {
          // Parse markdown to HTML
          const htmlContent = await marked.parse(res.response);
          this.messages.push({ role: 'model', content: htmlContent, isHtml: true });
        } else {
          this.messages.push({ role: 'model', content: "I'm sorry, I encountered an issue." });
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.messages.push({ role: 'model', content: "Error connecting to AI Assistant." });
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
  
  // Suggestion chips
  useSuggestion(suggestion: string) {
    this.newMessage = suggestion;
    this.sendMessage();
  }
}
