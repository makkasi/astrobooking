import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminArticleFormComponent } from './admin-article-form.component';

describe('AdminArticleFormComponent', () => {
  let component: AdminArticleFormComponent;
  let fixture: ComponentFixture<AdminArticleFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminArticleFormComponent]
    });
    fixture = TestBed.createComponent(AdminArticleFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
