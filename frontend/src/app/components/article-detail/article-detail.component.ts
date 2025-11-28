import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BookingService } from '../../services/booking.service';

@Component({
  selector: 'app-article-detail',
  templateUrl: './article-detail.component.html',
  styleUrls: ['./article-detail.component.scss']
})
export class ArticleDetailComponent implements OnInit {
  article: any;
  loading = true;
  error = '';

  constructor(private route: ActivatedRoute, private bookingService: BookingService) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.bookingService.getArticle(id).subscribe({
        next: (article) => {
          this.article = article;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.error = 'Article not found';
          this.loading = false;
        }
      });
    }
  }
}
