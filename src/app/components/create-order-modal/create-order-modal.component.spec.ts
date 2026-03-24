import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateOrderModalComponent } from './create-order-modal.component';

describe('CreateOrderModalComponent', () => {
  let component: CreateOrderModalComponent;
  let fixture: ComponentFixture<CreateOrderModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateOrderModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateOrderModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
