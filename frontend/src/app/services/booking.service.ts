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

  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products`);
  }

  createOrder(order: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders`, order);
  }

  uploadProduct(productData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/products`, productData);
  }

  uploadToCloudinary(file: File, preset: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', preset);
    return this.http.post(`https://api.cloudinary.com/v1_1/dmrgmeugu/upload`, formData);
  }

  deleteProduct(productId: string, password: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/products/${productId}`, {
      params: { password }
    });
  }

  updateProduct(productId: string, productData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/products/${productId}`, productData);
  }
}
