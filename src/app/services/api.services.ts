import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Item } from '../models/item.model'; 


interface IPhoto {
   albumId: number;
   id: number;
   title: string;
   url: string;
   thumbnailUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient); 

  private apiUrl = 'https://jsonplaceholder.typicode.com/photos';


 
  getItems(): Observable<Item[]> {
 
    return this.http.get<RawPost[]>(this.apiUrl).pipe(
      map(posts => {
        return photos.map(post => ({
          ...photos,
          
          
        }));
      })
    );
  }


  createItem(data: any): Observable<any> {
  return this.http.post<any>(this.apiUrl, data);
  }
}
