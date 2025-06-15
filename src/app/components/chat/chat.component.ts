// src/app/components/chat/chat.component.ts
import { Component, ElementRef, ViewChild, AfterViewChecked, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { NovaApiService, ChatResponse, ApiError } from '../../services/nova-api.service';

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  typing?: boolean;
  error?: boolean;
  processingTime?: number;
  modelUsed?: string;
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
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="chat-container">
      <!-- Header -->
      <div class="chat-header">
        <div class="logo">
          <mat-icon>psychology</mat-icon>
          <span>NOVA - Agent IA</span>
        </div>
        <div class="status" [ngClass]="{'connected': isConnected, 'disconnected': !isConnected}">
          <mat-icon>{{ isConnected ? 'wifi' : 'wifi_off' }}</mat-icon>
          {{ isConnected ? 'CONNECTÉ' : 'DÉCONNECTÉ' }}
        </div>
      </div>

      <!-- Messages -->
      <div class="messages-container" #messagesContainer>
        <div *ngFor="let message of messages" class="message" [ngClass]="{'user-msg': message.isUser, 'bot-msg': !message.isUser, 'error-msg': message.error}">
          <div class="message-avatar">
            <mat-icon>{{ message.isUser ? 'person' : (message.error ? 'error' : 'smart_toy') }}</mat-icon>
          </div>
          <div class="message-content">
            <div class="message-text">
              <span *ngIf="!message.typing">{{ message.content }}</span>
              <div *ngIf="message.typing" class="typing-indicator">
                <span>🤖 Agent Hamadi traite votre demande</span>
                <div class="typing-animation">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
            <div class="message-meta">
              <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              <span *ngIf="message.processingTime && !message.isUser" class="processing-time">
                ⚡ {{ message.processingTime }}s
              </span>
              <span *ngIf="message.modelUsed && !message.isUser" class="model-used">
                🧠 {{ message.modelUsed }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="input-container">
        <form [formGroup]="chatForm" (ngSubmit)="sendMessage()" class="input-form">
          <mat-form-field appearance="outline" class="message-input">
            <mat-label>{{ isConnected ? 'Tapez votre message à l\'Agent NOVA...' : 'API déconnectée - Vérifiez le serveur Python' }}</mat-label>
            <input 
              matInput 
              formControlName="message" 
              [disabled]="isLoading || !isConnected"
              (keydown.enter)="sendMessage()"
              placeholder="Comment puis-je vous aider aujourd'hui ?"
            >
            <mat-icon matSuffix>{{ isConnected ? 'chat' : 'warning' }}</mat-icon>
          </mat-form-field>
          
          <button 
            mat-fab 
            color="primary" 
            type="submit" 
            [disabled]="!chatForm.valid || isLoading || !isConnected"
            class="send-btn"
            [title]="isConnected ? 'Envoyer le message' : 'API déconnectée'"
          >
            <mat-icon *ngIf="!isLoading">send</mat-icon>
            <mat-spinner *ngIf="isLoading" diameter="24"></mat-spinner>
          </button>
        </form>

        <!-- Actions supplémentaires -->
        <div class="chat-actions">
          <button mat-button (click)="checkApiConnection()" [disabled]="isLoading">
            <mat-icon>refresh</mat-icon>
            Vérifier API
          </button>
          <button mat-button (click)="clearHistory()" [disabled]="isLoading" color="warn">
            <mat-icon>clear_all</mat-icon>
            Effacer historique
          </button>
        </div>
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
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .status.connected {
      background: #4caf50;
    }

    .status.disconnected {
      background: #f44336;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
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

    .error-msg .message-avatar {
      background: linear-gradient(135deg, #f44336, #d32f2f);
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

    .error-msg .message-text {
      background: #ffebee;
      color: #c62828;
      border: 1px solid #ef9a9a;
    }

    .typing-indicator {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .typing-animation {
      display: flex;
      gap: 4px;
    }

    .typing-animation span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #667eea;
      animation: typing 1.4s infinite ease-in-out;
    }

    .typing-animation span:nth-child(1) { animation-delay: -0.32s; }
    .typing-animation span:nth-child(2) { animation-delay: -0.16s; }

    @keyframes typing {
      0%, 80%, 100% {
        transform: scale(0);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }

    .message-meta {
      display: flex;
      gap: 8px;
      font-size: 10px;
      color: #666;
      padding: 0 8px;
    }

    .user-msg .message-meta {
      justify-content: flex-end;
    }

    .processing-time, .model-used {
      background: rgba(102, 126, 234, 0.1);
      padding: 2px 6px;
      border-radius: 8px;
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
      margin-bottom: 10px;
    }

    .message-input {
      flex: 1;
    }

    .send-btn {
      background: linear-gradient(135deg, #667eea, #764ba2) !important;
    }

    .chat-actions {
      display: flex;
      gap: 8px;
      justify-content: center;
    }

    .chat-actions button {
      font-size: 12px;
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
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  chatForm = new FormGroup({
    message: new FormControl('', [Validators.required, Validators.minLength(1)])
  });

  messages: Message[] = [];
  isLoading = false;
  isConnected = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private novaApi: NovaApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // S'abonner au statut de connexion
    const connectionSub = this.novaApi.connectionStatus$.subscribe(
      status => {
        this.isConnected = status;
        if (status) {
          this.addWelcomeMessage();
        } else {
          this.showErrorMessage('🚨 Connexion à l\'API NOVA perdue');
        }
      }
    );
    this.subscriptions.push(connectionSub);

    // Vérifier la connexion initiale
    this.checkApiConnection();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

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

  async checkApiConnection() {
    this.isLoading = true;
    const isConnected = await this.novaApi.checkConnection();
    this.isLoading = false;
    
    if (isConnected) {
      this.showSuccessMessage('✅ Connexion à l\'API NOVA établie');
    } else {
      this.showErrorMessage('❌ Impossible de se connecter à l\'API NOVA');
    }
  }

  sendMessage() {
    if (this.chatForm.valid && !this.isLoading && this.isConnected) {
      const messageText = this.chatForm.get('message')?.value?.trim();
      
      if (messageText) {
        // Ajouter le message utilisateur
        const userMessage: Message = {
          id: Date.now().toString(),
          content: messageText,
          isUser: true,
          timestamp: new Date()
        };
        
        this.messages.push(userMessage);
        this.chatForm.reset();
        this.isLoading = true;

        // Ajouter l'indicateur de frappe
        const typingMessage: Message = {
          id: Date.now().toString() + '_typing',
          content: '',
          isUser: false,
          timestamp: new Date(),
          typing: true
        };
        
        this.messages.push(typingMessage);

        // Envoyer à l'API
        const apiSub = this.novaApi.sendMessage(messageText).subscribe({
          next: (response: ChatResponse) => {
            // Supprimer l'indicateur de frappe
            this.messages = this.messages.filter(m => !m.typing);
            
            // Ajouter la réponse de l'IA
            const aiResponse: Message = {
              id: response.id,
              content: response.content,
              isUser: false,
              timestamp: new Date(response.timestamp),
              processingTime: response.processing_time,
              modelUsed: response.model_used
            };
            
            this.messages.push(aiResponse);
            this.isLoading = false;
          },
          error: (error: ApiError) => {
            // Supprimer l'indicateur de frappe
            this.messages = this.messages.filter(m => !m.typing);
            
            // Ajouter un message d'erreur
            const errorMessage: Message = {
              id: Date.now().toString() + '_error',
              content: error.message,
              isUser: false,
              timestamp: new Date(),
              error: true
            };
            
            this.messages.push(errorMessage);
            this.isLoading = false;
            this.showErrorMessage('Erreur de communication avec l\'Agent Hamadi');
          }
        });
        
        this.subscriptions.push(apiSub);
      }
    }
  }

  clearHistory() {
    if (this.isConnected) {
      const clearSub = this.novaApi.clearChatHistory().subscribe({
        next: () => {
          this.messages = [];
          this.addWelcomeMessage();
          this.showSuccessMessage('Historique effacé');
        },
        error: (error: ApiError) => {
          this.showErrorMessage('Erreur lors de l\'effacement: ' + error.message);
        }
      });
      this.subscriptions.push(clearSub);
    } else {
      // Effacement local si pas de connexion
      this.messages = [];
      this.showSuccessMessage('Historique local effacé');
    }
  }

  private addWelcomeMessage() {
    if (this.messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        content: '🚀 Bonjour Agent ! Je suis l\'Agent Hamadi, votre assistant IA NOVA. Connexion établie et prêt pour la mission !',
        isUser: false,
        timestamp: new Date()
      };
      this.messages.push(welcomeMessage);
    }
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  private showSuccessMessage(message: string) {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string) {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}