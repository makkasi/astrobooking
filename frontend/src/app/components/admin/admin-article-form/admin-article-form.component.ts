import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../../services/booking.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-article-form',
  templateUrl: './admin-article-form.component.html',
  styleUrls: ['./admin-article-form.component.scss']
})
export class AdminArticleFormComponent implements OnInit {
  article: any = {
    title: '',
    content: '',
    image_url: ''
  };
  imageFile: File | null = null;

  isEditing = false;
  articleId: string | null = null;
  loading = false;
  error = '';

  quillConfig = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link']
    ]
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.articleId = this.route.snapshot.paramMap.get('id');
    if (this.articleId) {
      this.isEditing = true;
      this.loadArticle(this.articleId);
    }
  }

  loadArticle(id: string) {
    this.bookingService.getArticle(id).subscribe({
      next: (article) => {
        this.article = article;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Article not found';
      }
    });
  }

  onFileSelected(event: any) {
    this.imageFile = event.target.files[0];
  }

  onSubmit() {
    if (!this.article.title || !this.article.content) {
      this.error = 'Title and Content are required.';
      return;
    }

    this.loading = true;
    this.error = '';
    const password = this.authService.getPassword();

    if (this.isEditing && this.articleId) {
      // Update
      const update = () => {
        const updateData = {
          title: this.article.title,
          content: this.article.content,
          image_url: this.article.image_url,
          password: password
        };
        this.bookingService.updateArticle(this.articleId!, updateData).subscribe({
          next: () => {
            this.loading = false;
            this.router.navigate(['/admin/articles']);
          },
          error: (err) => {
            console.error(err);
            this.error = 'Failed to update article.';
            this.loading = false;
            if (err.status === 401) this.authService.logout();
          }
        });
      };

      if (this.imageFile) {
        this.bookingService.uploadToCloudinary(this.imageFile, 'preset_name').subscribe({
          next: (res) => {
            this.article.image_url = res.secure_url;
            update();
          },
          error: () => {
            this.error = 'Failed to upload image';
            this.loading = false;
          }
        });
      } else {
        update();
      }

    } else {
      // Create
      if (!this.imageFile) {
        this.error = 'Cover image is required.';
        this.loading = false;
        return;
      }

      this.bookingService.uploadToCloudinary(this.imageFile, 'preset_name').subscribe({
        next: (res) => {
          const articleData = {
            title: this.article.title,
            content: this.article.content,
            image_url: res.secure_url,
            password: password
          };
          this.bookingService.createArticle(articleData).subscribe({
            next: () => {
              this.loading = false;
              this.router.navigate(['/admin/articles']);
            },
            error: (err) => {
              console.error(err);
              this.error = 'Failed to create article.';
              this.loading = false;
              if (err.status === 401) this.authService.logout();
            }
          });
        },
        error: () => {
          this.error = 'Failed to upload image';
          this.loading = false;
        }
      });
    }
  }
}
