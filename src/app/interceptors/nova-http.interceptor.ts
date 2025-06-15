import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';

@Injectable()
export class NovaHttpInterceptor implements HttpInterceptor {
  private activeRequests = 0;

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.activeRequests++;

    const novaRequest = req.clone({
      setHeaders: {
        'Content-Type': 'application/json',
        'X-NOVA-Client': 'Angular-Interface',
        'X-NOVA-Version': '1.0.0',
        'X-Request-Timestamp': new Date().toISOString()
      }
    });

    const startTime = Date.now();

    return next.handle(novaRequest).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          const duration = Date.now() - startTime;
          console.log(`✅ API NOVA - ${req.method} ${req.url} - ${duration}ms`);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        const duration = Date.now() - startTime;
        console.error(`❌ API NOVA - ${req.method} ${req.url} - ${duration}ms - Error:`, error);
        return throwError(() => error);
      }),
      finalize(() => {
        this.activeRequests--;
      })
    );
  }

  getActiveRequestsCount(): number {
    return this.activeRequests;
  }
}