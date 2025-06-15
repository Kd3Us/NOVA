import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  typing?: boolean;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="chat-container">
      <!-- Header -->
      <div class="chat-header">
        <div class="logo">
          <mat-icon>psychology</mat-icon>
          <span>NOVA - Agent IA</span>
        </div>
        <div class="status">CONNECTÉ</div>
      </div>

      <!-- Messages -->
      <div class="messages-container" #messagesContainer>
        <div *ngFor="let message of messages" class="message" [ngClass]="{'user-msg': message.isUser, 'bot-msg': !message.isUser}">
          <div class="message-avatar">
            <mat-icon>{{ message.isUser ? 'person' : 'smart_toy' }}</mat-icon>
          </div>
          <div class="message-content">
            <div class="message-text">
              <span *ngIf="!message.typing">{{ message.content }}</span>
              <span *ngIf="message.typing" class="typing">🤖 En train d'écrire...</span>
            </div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="input-container">
        <form [formGroup]="chatForm" (ngSubmit)="sendMessage()" class="input-form">
          <mat-form-field appearance="outline" class="message-input">
            <mat-label>Tapez votre message à l'Agent NOVA...</mat-label>
            <input matInput formControlName="message" [disabled]="isLoading" (keydown.enter)="sendMessage()">
          </mat-form-field>
          
          <button mat-fab color="primary" type="submit" [disabled]="!chatForm.valid || isLoading" class="send-btn">
            <mat-icon *ngIf="!isLoading">send</mat-icon>
            <mat-spinner *ngIf="isLoading" diameter="24"></mat-spinner>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 85vh;
      max-width: 600px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      overflow: hidden;
    }

    .chat-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 16px;
    }

    .logo mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .status {
      background: #4caf50;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background: #f8f9fa;
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .message {
      display: flex;
      gap: 12px;
      animation: slideIn 0.3s ease-out;
    }

    .user-msg {
      flex-direction: row-reverse;
    }

    .message-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: white;
    }

    .user-msg .message-avatar {
      background: linear-gradient(135deg, #ff6b6b, #ee5a24);
    }

    .bot-msg .message-avatar {
      background: linear-gradient(135deg, #667eea, #764ba2);
    }

    .message-content {
      max-width: 70%;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .message-text {
      padding: 12px 16px;
      border-radius: 18px;
      word-wrap: break-word;
      color: #333;
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      font-size: 14px;
      line-height: 1.4;
    }

    .user-msg .message-text {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
    }

    .bot-msg .message-text {
      background: white;
      color: #333;
      border: 1px solid #e1e5e9;
    }

    .message-time {
      font-size: 11px;
      color: #666;
      padding: 0 8px;
    }

    .user-msg .message-time {
      text-align: right;
    }

    .typing {
      color: #667eea;
      font-style: italic;
    }

    .input-container {
      padding: 20px;
      background: white;
      border-top: 1px solid #e1e5e9;
    }

    .input-form {
      display: flex;
      gap: 12px;
      align-items: flex-end;
    }

    .message-input {
      flex: 1;
    }

    .send-btn {
      background: linear-gradient(135deg, #667eea, #764ba2) !important;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Scrollbar styling */
    .messages-container::-webkit-scrollbar {
      width: 6px;
    }

    .messages-container::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    .messages-container::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }

    .messages-container::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
  `]
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  chatForm = new FormGroup({
    message: new FormControl('', [Validators.required])
  });

  messages: Message[] = [
    {
      id: '1',
      content: 'Bonjour Agent ! Je suis NOVA, votre assistant IA. Prêt pour la mission ?',
      isUser: false,
      timestamp: new Date()
    }
  ];

  isLoading = false;

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      const container = this.messagesContainer?.nativeElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    } catch (err) {
      console.log('Scroll error:', err);
    }
  }

  sendMessage() {
    if (this.chatForm.valid && !this.isLoading) {
      const messageText = this.chatForm.get('message')?.value?.trim();
      
      if (messageText) {
        // Message utilisateur
        const userMessage: Message = {
          id: Date.now().toString(),
          content: messageText,
          isUser: true,
          timestamp: new Date()
        };
        
        this.messages.push(userMessage);
        this.chatForm.reset();
        this.isLoading = true;

        // Message de typing
        const typingMessage: Message = {
          id: Date.now().toString() + '_typing',
          content: '',
          isUser: false,
          timestamp: new Date(),
          typing: true
        };
        
        this.messages.push(typingMessage);

        // Simulation réponse IA
        setTimeout(() => {
          // Supprimer message typing
          this.messages = this.messages.filter(m => !m.typing);
          
          const aiResponse: Message = {
            id: Date.now().toString() + '_ai',
            content: `✅ Message reçu et analysé : "${messageText}". Mission NOVA en cours d'exécution, Agent !`,
            isUser: false,
            timestamp: new Date()
          };
          
          this.messages.push(aiResponse);
          this.isLoading = false;
        }, 1500);
      }
    }
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}