import { Component, EventEmitter, Output, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../services/language.service';
import { DataService } from '../../services/data.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-create-order-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-order-modal.component.html',
  styleUrls: ['./create-order-modal.component.css']
})
export class CreateOrderModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  
  lang = inject(LanguageService);
  fb = inject(FormBuilder);
  dataService = inject(DataService);

  orderForm!: FormGroup;
  dishTypes: string[] = [];
  
  memberEmails: string[] = [];
  emailInput: string = '';
  emailError: string = '';

  ngOnInit() {
    this.orderForm = this.fb.group({
      groupName: ['', Validators.required],
      leaderEmail: ['', [Validators.required, Validators.email]],
      dishName: ['', Validators.required],
      description: [''],
      dateAvailable: ['', Validators.required],
      foodType: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]]
    });

    this.dataService.getDishTypes().subscribe(types => {
      this.dishTypes = types;
    });
  }

  onEmailInput(event: any) {
    this.emailInput = event.target.value;
  }

  addEmail(event: Event) {
    event.preventDefault();
    const email = this.emailInput.trim().toLowerCase();
    
    if (!email) return;

    if (!email.match(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/)) {
      this.emailError = 'Email không hợp lệ.';
      return;
    }

    if (this.memberEmails.includes(email)) {
      this.emailError = 'Email đã tồn tại trong nhóm.';
      return;
    }

    // Since validation from Excel might need to be synchronous here, 
    // let's use the provided validEmails list
    const validEmails = this.dataService.getValidEmails();
    // allow all if validEmails is empty (e.g. mock data fallback)
    if (validEmails.length > 0 && !validEmails.includes(email)) {
      this.emailError = 'Email không tồn tại trong danh sách Mantu.';
      return;
    }

    this.memberEmails.push(email);
    this.emailInput = '';
    this.emailError = '';
    // reset input field
    const inputElement = document.getElementById('memberEmailInput') as HTMLInputElement;
    if (inputElement) inputElement.value = '';
  }

  removeEmail(index: number) {
    this.memberEmails.splice(index, 1);
  }

  isSubmitting = false;
  submitSuccess = false;
  submitError = '';

  onSubmit() {
    if (this.orderForm.invalid || this.memberEmails.length === 0) {
      if (this.memberEmails.length === 0) {
        this.emailError = 'Vui lòng thêm ít nhất 1 email thành viên.';
      }
      this.orderForm.markAllAsTouched();
      return;
    }

    const val = this.orderForm.value;
    
    // Formatting data for Google Sheet
    const rowData = {
      action: 'create_order', // Custom action key for Apps Script
      teamName: val.groupName,
      leaderEmail: val.leaderEmail,
      dishName: val.dishName,
      description: val.description,
      dateAvailable: val.dateAvailable,
      foodType: val.foodType,
      price: val.price,
      memberEmails: this.memberEmails.join(', ')
    };

    this.isSubmitting = true;
    this.submitError = '';
    this.submitSuccess = false;
    
    // Call the data service to push data directly to Google Apps Script Web App
    this.dataService.createOrderToSheet(JSON.stringify(rowData)).subscribe({
       next: (response) => {
         this.isSubmitting = false;
         const resText = (response || '').toString();
         if (resText.includes('Error')) {
           console.error('Lỗi từ Google Apps Script:', resText);
           this.submitError = 'Lỗi từ hệ thống: ' + resText + '\nĐã tự động tải file Excel dự phòng về máy của bạn.';
           this.downloadExcelLocal(val);
         } else {
           this.submitSuccess = true;
         }
       },
       error: (err) => {
         console.error('Lỗi kết nối:', err);
         this.isSubmitting = false;
         this.submitError = 'Lỗi kết nối. Không thể lưu lên Google Sheet. Trình duyệt đã tải tự động file Excel phụ trợ về máy của bạn.';
         this.downloadExcelLocal(val);
       }
    });
  }

  private downloadExcelLocal(val: any) {
    const row = {
      'Tên nhóm / Team Name': val.groupName,
      'Leader Email': val.leaderEmail,
      'Email thành viên / Member Emails': this.memberEmails.join(', '),
      'Tên món / Dish Name': val.dishName,
      'Loại thức ăn / Category': val.foodType,
      'Ngày giao hàng / Delivery Date': val.dateAvailable,
      'Giá / Price': val.price,
      'Mô tả / Description': val.description
    };
    
    // Ensure header works perfectly by converting to array of arrays
    const headers = Object.keys(row);
    const values = Object.values(row);
    const ws = XLSX.utils.aoa_to_sheet([headers, values]);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "NewOrder");
    XLSX.writeFile(wb, `Order_${val.groupName.replace(/\s+/g, '_')}_${Date.now()}.xlsx`);
  }

  onClose() {
    if (!this.isSubmitting) {
      this.close.emit();
    }
  }
}
