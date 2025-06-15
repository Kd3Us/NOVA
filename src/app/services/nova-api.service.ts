import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

export interface ChatRequest {
  message: string;
  user_id?: string;
  session_id?: string;
}

export interface ChatResponse {
  id: string;
  content: string;
  timestamp: string;
  model_used: string;
  processing_time: number;
  session_id: string;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  version: string;
  ai_model_status: string;
}

export interface AIModel {
  model_name: string;
  model_type: string;
  api_key_configured: boolean;
  max_tokens: number;
  temperature: number;
}

export interface ApiError {
  message: string;
  status: number;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NovaApiService {
  private readonly apiUrl = 'http://localhost:8000';
  private readonly timeout_duration = 30000;

  private connectionStatus = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionStatus.asObservable();

  private currentSessionId: string | null = null;

  constructor(private http: HttpClient) {
    this.checkConnection();
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await this.getHealth().toPromise();
      this.connectionStatus.next(response?.status === 'operational');
      return true;
    } catch (error) {
      this.connectionStatus.next(false);
      console.warn('🚨 API NOVA non accessible:', error);
      return false;
    }
  }

  sendMessage(message: string, userId: string = 'agent'): Observable<ChatResponse> {
    const request: ChatRequest = {
      message: message.trim(),
      user_id: userId,
      session_id: this.currentSessionId || undefined
    };

    return this.http.post<ChatResponse>(`${this.apiUrl}/chat`, request)
      .pipe(
        timeout(this.timeout_duration),
        map(response => {
          if (response.session_id) {
            this.currentSessionId = response.session_id;
          }
          return response;
        }),
        catchError(this.handleError.bind(this))
      );
  }

  getHealth(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>(`${this.apiUrl}/health`)
      .pipe(
        timeout(5000), 
        catchError(this.handleError.bind(this))
      );
  }

  getAvailableModels(): Observable<AIModel[]> {
    return this.http.get<AIModel[]>(`${this.apiUrl}/ai/models`)
      .pipe(
        timeout(this.timeout_duration),
        catchError(this.handleError.bind(this))
      );
  }

  getChatHistory(): Observable<any> {
    if (!this.currentSessionId) {
      return throwError(() => new Error('Aucune session active'));
    }

    return this.http.get(`${this.apiUrl}/chat/history/${this.currentSessionId}`)
      .pipe(
        timeout(this.timeout_duration),
        catchError(this.handleError.bind(this))
      );
  }

  clearChatHistory(): Observable<any> {
    if (!this.currentSessionId) {
      return throwError(() => new Error('Aucune session active'));
    }

    return this.http.delete(`${this.apiUrl}/chat/history/${this.currentSessionId}`)
      .pipe(
        timeout(this.timeout_duration),
        map(response => {
          this.currentSessionId = null;
          return response;
        }),
        catchError(this.handleError.bind(this))
      );
  }

  isConnected(): boolean {
    return this.connectionStatus.value;
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  startNewSession(): void {
    this.currentSessionId = null;
  }

  pingApi(): Observable<any> {
    return this.http.get(`${this.apiUrl}/`)
      .pipe(
        timeout(5000),
        catchError(this.handleError.bind(this))
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let apiError: ApiError;

    if (error.error instanceof ErrorEvent) {
      apiError = {
        message: `Erreur de connexion: ${error.error.message}`,
        status: 0,
        timestamp: new Date()
      };
    } else {
      // Erreur côté serveur
      switch (error.status) {
        case 0:
          apiError = {
            message: '🚨 API NOVA inaccessible. Vérifiez que le serveur Python est démarré.',
            status: error.status,
            timestamp: new Date()
          };
          break;
        case 404:
          apiError = {
            message: '🔍 Endpoint non trouvé sur l\'API NOVA.',
            status: error.status,
            timestamp: new Date()
          };
          break;
        case 500:
          apiError = {
            message: '⚠️ Erreur interne de l\'API NOVA. Vérifiez les logs du serveur.',
            status: error.status,
            timestamp: new Date()
          };
          break;
        case 422:
          apiError = {
            message: '📝 Données invalides envoyées à l\'API NOVA.',
            status: error.status,
            timestamp: new Date()
          };
          break;
        default:
          apiError = {
            message: `🚨 Erreur API NOVA: ${error.error?.detail || error.message}`,
            status: error.status,
            timestamp: new Date()
          };
      }
    }

    this.connectionStatus.next(false);

    console.error('🚨 Erreur API NOVA:', apiError);
    return throwError(() => apiError);
  }
}