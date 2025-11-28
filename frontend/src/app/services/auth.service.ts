import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, tap, catchError, map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl; // e.g. /api
  private readonly TOKEN_KEY = 'admin_password';

  constructor(private http: HttpClient, private router: Router) { }

  login(password: string): Observable<boolean> {
    return this.http.post<{ status: string }>(`${this.apiUrl}/admin/verify`, { password }).pipe(
      tap(() => {
        localStorage.setItem(this.TOKEN_KEY, password);
      }),
      map(() => true),
      catchError(() => of(false))
    );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/admin/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  getPassword(): string {
    return localStorage.getItem(this.TOKEN_KEY) || '';
  }
}
