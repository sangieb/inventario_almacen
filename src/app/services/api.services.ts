import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Item } from '../models/item.models';

export interface IPhoto {
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
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://jsonplaceholder.typicode.com/photos';

  getItems(): Observable<Item[]> {
    return this.http.get<IPhoto[]>(this.apiUrl).pipe(
      map(photos => {
        // Tomamos 100 fotos para no sobrecargar la lista
        return photos.slice(0, 100).map(photo => ({
          id: photo.id,
          albumId: photo.albumId,
          title: photo.title,
          url: photo.url,
          thumbnailUrl: photo.thumbnailUrl,
          price: Number((photo.id * 1.5 + 5).toFixed(2)),
          stock: (photo.id * 7) % 12
        }));
      })
    );
  }

  createItem(data: Partial<IPhoto>): Observable<IPhoto> {
    return this.http.post<IPhoto>(this.apiUrl, data);
  }
}