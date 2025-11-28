import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminArticlesComponent } from './admin-articles.component';

describe('AdminArticlesComponent', () => {
  let component: AdminArticlesComponent;
  let fixture: ComponentFixture<AdminArticlesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminArticlesComponent]
    });
    fixture = TestBed.createComponent(AdminArticlesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
