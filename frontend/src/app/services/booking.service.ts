import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Booking {
  date: string;
  hour: number;
  name: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface AvailabilityResponse {
  available_hours: number[];
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) { }

  checkAvailability(date: string): Observable<AvailabilityResponse> {
    return this.http.get<AvailabilityResponse>(`${this.apiUrl}/availability?date=${date}`);
  }

  createBooking(booking: Booking): Observable<any> {
    return this.http.post(`${this.apiUrl}/book`, booking);
  }
}
