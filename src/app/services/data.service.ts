import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError, shareReplay } from 'rxjs';
import { Dish } from '../models/dish.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private http = inject(HttpClient);
  // Using Google Sheets gviz CSV endpoint to bypass CORS issues
  private sheetUrl = 'https://docs.google.com/spreadsheets/d/13o5Aa1qbwIf_c5VLyDKKP2laNgJZg6yFLNijumuDgjM/gviz/tq?tqx=out:csv&sheet=Sheet1';
  private masterDataUrl = 'https://docs.google.com/spreadsheets/d/13o5Aa1qbwIf_c5VLyDKKP2laNgJZg6yFLNijumuDgjM/gviz/tq?tqx=out:csv&sheet=Master_Data';

  private cachedDishes$!: Observable<Dish[]>;
  private cachedDishTypes$!: Observable<string[]>;
  private validEmails: Set<string> = new Set();

  private mockDishes: Dish[] = [
    {
      id: '1',
      teamName: 'Team Alpha',
      dishName: 'Cơm Tấm Sườn Bì Chả',
      price: '45,000 VND',
      dateAvailable: '2023-10-25',
      description: 'A classic Vietnamese dish featuring broken rice topped with grilled pork chop, shredded pork skin, and steamed egg meatloaf. Served with a side of sweet and sour fish sauce and fresh vegetables. Every purchase helps our charity event!',
      type: 'Cơm tấm',
      imageUrl: 'assets/images/cat_com_tam_1774219573802.png'
    },
    {
      id: '2',
      teamName: 'Team Beta',
      dishName: 'Gỏi Cuốn Tôm Thịt',
      price: '30,000 VND',
      dateAvailable: '2023-10-25',
      description: 'Fresh and healthy Vietnamese spring rolls packed with pork, shrimp, herbs, and rice vermicelli wrapped in rice paper. Comes with a delicious peanut dipping sauce.',
      type: 'Đồ cuốn',
      imageUrl: 'assets/images/cat_do_cuon_1774219587566.png'
    },
    {
      id: '3',
      teamName: 'Team Gamma',
      dishName: 'Trà Sữa Trân Châu Koko',
      price: '25,000 VND',
      dateAvailable: '2023-10-25',
      description: 'Sweet and creamy traditional milk tea with perfectly chewy tapioca pearls. A classic refreshing drink to satisfy your sweet tooth while supporting a good cause.',
      type: 'Trà sữa',
      imageUrl: 'assets/images/cat_tra_sua_1774219599922.png'
    },
    {
      id: '4',
      teamName: 'Team Delta',
      dishName: 'Bánh Tráng Trộn Xoài Xanh',
      price: '20,000 VND',
      dateAvailable: '2023-10-25',
      description: 'A popular Vietnamese street snack made with shredded rice paper, slightly tart green mango, dried beef, quail eggs, and fragrant herbs securely mixed with savory dressing.',
      type: 'Bánh tráng trộn',
      imageUrl: 'assets/images/cat_banh_trang_tron_1774219636631.png'
    },
    {
      id: '5',
      teamName: 'Team Epsilon',
      dishName: 'Combo Đồ Rán Thập Cẩm',
      price: '40,000 VND',
      dateAvailable: '2023-10-25',
      description: 'A crispy and savory mixed platter of various fried snacks including spring rolls, fish balls, and calamari rings. Perfect for sharing with friends!',
      type: 'Đồ rán',
      imageUrl: 'assets/images/cat_do_ran_1774219649545.png'
    },
    {
      id: '6',
      teamName: 'Team Zeta',
      dishName: 'Nước Mía Trân Châu',
      price: '15,000 VND',
      dateAvailable: '2023-10-25',
      description: 'Refreshing cold-pressed sugarcane juice served with chewy tapioca pearls and a hint of kumquat. The perfect thirst quencher for a hot day.',
      type: 'Nước giải khát',
      imageUrl: 'assets/images/cat_nuoc_giai_khat_1774219665120.png'
    }
  ];

  getDishes(): Observable<Dish[]> {
    if (!this.cachedDishes$) {
      this.cachedDishes$ = this.http.get(this.sheetUrl, { responseType: 'text' }).pipe(
        map(csv => this.parseCsv(csv)),
        catchError(err => {
          console.error('Error fetching CSV:', err);
          return of(this.mockDishes);
        }),
        shareReplay(1)
      );
    }
    return this.cachedDishes$;
  }

  validateEmail(email: string): Observable<boolean> {
    // If we have cached valid emails, use them
    return this.getDishes().pipe(
      map(dishes => {
        // If we fell back to mock dishes and have no valid emails, allow all
        if (this.validEmails.size === 0 && dishes === this.mockDishes) {
          return true;
        }
        return this.validEmails.has(email.trim().toLowerCase());
      })
    );
  }

  getValidEmails(): string[] {
    return Array.from(this.validEmails);
  }

  // NOTE: Replace this with your actual deployed Google Apps Script Web App URL
  private scriptUrl = 'https://script.google.com/macros/s/AKfycbwSzcMlwH0SsGuZM6PPtx-wU2x2aaUSRnkt7a1sA-1BlZRI81dhRZgq75trticvQYX1mQ/exec';

  getDishTypes(): Observable<string[]> {
    if (!this.cachedDishTypes$) {
      this.cachedDishTypes$ = this.http.get(this.masterDataUrl, { responseType: 'text' }).pipe(
        map(csv => {
          const lines = csv.split('\n');
          if (lines.length <= 1) return [];
          
          const headers = this.parseLine(lines[0]).map(h => h.trim().toLowerCase());
          const catIdx = headers.findIndex(h => h.includes('category') || h.includes('loại'));
          const emailIdx = headers.findIndex(h => h.includes('email'));
          
          const types = new Set<string>();
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const row = this.parseLine(line);
            
            if (catIdx >= 0 && row[catIdx] && row[catIdx].trim()) {
              types.add(row[catIdx].trim());
            }
            if (emailIdx >= 0 && row[emailIdx] && row[emailIdx].trim()) {
              this.validEmails.add(row[emailIdx].trim().toLowerCase());
            }
          }
          
          return Array.from(types).filter(t => t.length > 0);
        }),
        catchError(err => {
          console.error('Error fetching Master Data CSS:', err);
          return of(['Cơm tấm', 'Đồ cuốn', 'Trà sữa', 'Bánh tráng trộn', 'Đồ rán', 'Nước giải khát', 'Khác']);
        }),
        shareReplay(1)
      );
    }
    return this.cachedDishTypes$;
  }

  createOrderToSheet(orderData: any): Observable<any> {
    // Sending data as JSON POST. Google Apps Script's doPost(e) will receive this in e.postData.contents
    return this.http.post(this.scriptUrl, orderData, {
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' // Using text/plain prevents CORS preflight OPTIONS request
      },
      responseType: 'text' // expects text output from Apps Script to avoid JSON parse errors on CORS
    });
  }

  private parseCsv(csv: string): Dish[] {
    const lines = csv.split('\n');
    if (lines.length <= 1) return this.mockDishes; // empty sheet fallback
    
    // Header parsing
    const headers = this.parseLine(lines[0]).map(h => h.trim().toLowerCase());
    
    const teamIdx = headers.findIndex(h => h.includes('team') || h.includes('nhóm'));
    const dishIdx = headers.findIndex(h => h.includes('dish') || h.includes('món'));
    const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('giá'));
    const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('mô tả'));
    const emailIdx = headers.findIndex(h => h.includes('email'));
    const typeIdx = headers.findIndex(h => h.includes('type') || h.includes('loại'));
    const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('ngày'));
    
    const dishes: Dish[] = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const row = this.parseLine(line);
        if (row.length === 0) continue;
        
        // Save to valid emails set
        if (emailIdx >= 0 && row[emailIdx] && row[emailIdx].trim()) {
           this.validEmails.add(row[emailIdx].trim().toLowerCase());
        }
        
        // Construct Dish if there is a dish name
        if (dishIdx >= 0 && row[dishIdx] && row[dishIdx].trim()) {
           const typeStr = (typeIdx >= 0 && row[typeIdx]) ? row[typeIdx].trim() : 'Khác';
           dishes.push({
             id: i.toString(),
             teamName: teamIdx >= 0 ? row[teamIdx].trim() : '-',
             dishName: row[dishIdx].trim(),
             price: priceIdx >= 0 ? row[priceIdx].trim() : '-',
             description: descIdx >= 0 ? row[descIdx].trim() : '',
             dateAvailable: dateIdx >= 0 ? row[dateIdx].trim() : 'Theo sự kiện',
             type: typeStr,
             imageUrl: this.getImageForType(typeStr)
           });
        }
    }
    
    return dishes.length > 0 ? dishes : this.mockDishes;
  }
  
  private parseLine(text: string) {
    let ret = [''], i = 0, p = '', s = true;
    for (let l in [...text]) {
      l = text[i++];
      if ('"' === l) { s = !s; if ('"' === p) { ret[ret.length - 1] += '"'; l = '-'; } }
      else if (',' === l && s) l = ret[++ret.length - 1] = '';
      else ret[ret.length - 1] += l;
      p = l;
    }
    return ret;
  }

  private getImageForType(type: string): string {
    const t = type.toLowerCase();
    if (t.includes('cơm')) return 'assets/images/cat_com_tam_1774219573802.png';
    if (t.includes('cuốn')) return 'assets/images/cat_do_cuon_1774219587566.png';
    if (t.includes('trà sữa')) return 'assets/images/cat_tra_sua_1774219599922.png';
    if (t.includes('trộn')) return 'assets/images/cat_banh_trang_tron_1774219636631.png';
    if (t.includes('rán')) return 'assets/images/cat_do_ran_1774219649545.png';
    if (t.includes('giải khát') || t.includes('nước')) return 'assets/images/cat_nuoc_giai_khat_1774219665120.png';
    return 'assets/images/cat_com_tam_1774219573802.png'; // fallback
  }
}
