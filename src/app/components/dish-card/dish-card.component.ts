import { Component, Input, Output, EventEmitter } from '@angular/core';
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
  
  // Threshold to determine if detail button is needed
  // Using a rough character count
  get isTruncatable(): boolean {
    return this.dish && this.dish.description.length > 80;
  }
}
