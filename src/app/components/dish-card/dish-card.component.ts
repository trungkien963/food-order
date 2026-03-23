import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dish } from '../../models/dish.model';
import { inject } from '@angular/core';
import { LanguageService as LangSvc } from '../../services/language.service';

@Component({
  selector: 'app-dish-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dish-card.component.html',
  styleUrls: ['./dish-card.component.css']
})
export class DishCardComponent {
  lang = inject(LangSvc);
  @Input({ required: true }) dish!: Dish;
  @Output() order = new EventEmitter<Dish>();
  showFullDescription = false;
  
  @ViewChild('dishModal') dishModal!: ElementRef<HTMLDialogElement>;
  
  get isTruncatable(): boolean {
    return !!(this.dish && this.dish.description && this.dish.description.length > 80);
  }

  get formattedPrice() {
    if (!this.dish || !this.dish.price) return '';
    const numericPrice = Number(this.dish.price.toString().replace(/[^0-9]/g, ''));
    if (!isNaN(numericPrice) && numericPrice > 0) {
      return numericPrice.toLocaleString('vi-VN');
    }
    return this.dish.price;
  }

  openDetail() {
    if (this.dishModal) {
      this.dishModal.nativeElement.showModal();
    }
  }

  closeDetail() {
    if (this.dishModal) {
      this.dishModal.nativeElement.close();
    }
  }

  onDialogClick(event: MouseEvent) {
    if (event.target === this.dishModal.nativeElement) {
      this.closeDetail();
    }
  }
}
