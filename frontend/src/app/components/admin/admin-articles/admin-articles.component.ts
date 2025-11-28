import { Component, OnInit } from '@angular/core';
import { BookingService } from '../../../services/booking.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-articles',
  templateUrl: './admin-articles.component.html',
  styleUrls: ['./admin-articles.component.scss']
})
export class AdminArticlesComponent implements OnInit {
  articles: any[] = [];

  constructor(private bookingService: BookingService, private authService: AuthService) { }

  ngOnInit(): void {
    this.loadArticles();
  }

  loadArticles() {
    this.bookingService.getArticles().subscribe(articles => {
      this.articles = articles;
    });
  }

  deleteArticle(id: string) {
    if (confirm('Are you sure you want to delete this article?')) {
      const password = this.authService.getPassword();
      this.bookingService.deleteArticle(id, password).subscribe({
        next: () => {
          this.loadArticles();
          alert('Article deleted.');
        },
        error: (err) => {
          console.error(err);
          alert('Failed to delete. Session might be invalid.');
          if (err.status === 401) this.authService.logout();
        }
      });
    }
  }
}
