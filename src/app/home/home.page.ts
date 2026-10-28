import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSearchbar,
  IonSelect, IonSelectOption,
  IonList, IonItem, IonLabel, IonAvatar, IonBadge, IonButton, IonIcon,
  IonModal, IonNote, IonSpinner, ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { eyeOutline, closeOutline } from 'ionicons/icons';

import { ApiService } from '../services/api.services';
import { Item } from '../models/item.models';

export interface PageConfig {
  pageTitle: string;
  filtersCardTitle: string;
  searchPlaceholder: string;
  albumSelectLabel: string;
  allAlbumsLabel: string;
  searchFields: (keyof Item)[];
  stockField: keyof Item;
  titleField: keyof Item;
  descriptionField: keyof Item;
  stockLabel: string;
  stockUnitLabel: string;
  stockThreshold: number;
  criticalLabel: string;
  stableLabel: string;
  modalTitle: string;
  confirmActionLabel: string;
  visibleOrdersLabel: string;
  criticalStockLabel: string;
  visibleOrdersHint: string;
  sortLabel: string;
  sortNoneLabel: string;
  sortStockAscLabel: string;
  clearFiltersLabel: string;
  emptyListMessage: string;
  loadErrorMessage: string;
  retryLabel: string;
  confirmMessage: string;
  closeMessage: string;
  idPrefix: string;
}

export type SortOrder = 'none' | 'stockAsc';

export interface Filters {
  query: string;
  album: number | 'all';
  sort: SortOrder;
}

export interface OrderMetrics {
  visibleCount: number;
  criticalCount: number;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrl: 'home.page.scss',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSearchbar,
    IonSelect, IonSelectOption,
    IonList, IonItem, IonLabel, IonAvatar, IonBadge, IonButton, IonIcon,
    IonModal, IonNote, IonSpinner
  ]
})
export class HomePage implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly toastController = inject(ToastController);

  readonly config: PageConfig = {
    pageTitle: 'Catálogo de Fotos',
    filtersCardTitle: 'Filtros y Búsqueda',
    searchPlaceholder: 'Buscar por título...',
    albumSelectLabel: 'Álbum',
    allAlbumsLabel: 'Todos los álbumes',
    searchFields: ['title'],
    stockField: 'stock',
    titleField: 'title',
    descriptionField: 'url',
    stockLabel: 'Stock',
    stockUnitLabel: 'uds',
    stockThreshold: 5,
    criticalLabel: 'Crítico',
    stableLabel: 'Disponible',
    modalTitle: 'Detalle de la Foto',
    confirmActionLabel: 'Aceptar',
    visibleOrdersLabel: 'Fotos visibles',
    criticalStockLabel: 'Stock crítico',
    visibleOrdersHint: 'según filtros activos',
    sortLabel: 'Ordenar por',
    sortNoneLabel: 'Sin ordenar',
    sortStockAscLabel: 'Stock: Menor a Mayor',
    clearFiltersLabel: 'Limpiar filtros',
    emptyListMessage: 'No se encontraron resultados.',
    loadErrorMessage: 'Error al conectar con la API.',
    retryLabel: 'Reintentar',
    confirmMessage: 'Acción realizada exitosamente.',
    closeMessage: 'Detalle cerrado.',
    idPrefix: '#',
  };

  private readonly defaultFilters: Filters = {
    query: '',
    album: 'all',
    sort: 'none',
  };

  readonly items = signal<Item[]>([]);
  readonly selectedItem = signal<Item | null>(null);

  filters: Filters = { ...this.defaultFilters };

  readonly isLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly isModalOpen = signal(false);

  private dismissMessage = this.config.closeMessage;

  constructor() {
    addIcons({ eyeOutline, closeOutline });
  }

  ngOnInit(): void {
    this.loadData();
  }

  get albums(): number[] {
    const albumSet = new Set(this.items().map(item => item.albumId));
    return Array.from(albumSet).sort((a, b) => a - b);
  }

  get filteredItems(): Item[] {
    const term = this.filters.query.trim().toLowerCase();

    const result = this.items().filter(item => {
      const matchesText = !term || this.config.searchFields.some(field =>
        String(item[field] ?? '').toLowerCase().includes(term)
      );
      const matchesAlbum = this.filters.album === 'all' || item.albumId === Number(this.filters.album);

      return matchesText && matchesAlbum;
    });

    const sorted = [...result];
    if (this.filters.sort === 'stockAsc') {
      sorted.sort((a, b) => this.stockOf(a) - this.stockOf(b));
    }

    return sorted;
  }

  get metrics(): OrderMetrics {
    const visible = this.filteredItems;
    return {
      visibleCount: visible.length,
      criticalCount: visible.reduce((acc, item) => acc + (this.isCriticalStock(item) ? 1 : 0), 0),
    };
  }

  resetFilters(): void {
    this.filters = { ...this.defaultFilters };
  }

  loadData(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.apiService.getItems().subscribe({
      next: (data: Item[]) => {
        this.items.set(data);
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        console.error('Error cargando datos:', err);
        this.loadError.set(this.config.loadErrorMessage);
        this.isLoading.set(false);
      }
    });
  }

  stockOf(item: Item): number {
    return Number(item[this.config.stockField]);
  }

  isCriticalStock(item: Item): boolean {
    return this.stockOf(item) < this.config.stockThreshold;
  }

  openModal(item: Item): void {
    this.selectedItem.set(item);
    this.dismissMessage = this.config.closeMessage;
    this.isModalOpen.set(true);
  }

  closeModal(confirmed = false): void {
    this.dismissMessage = confirmed ? this.config.confirmMessage : this.config.closeMessage;
    this.isModalOpen.set(false);
  }

  onModalDismiss(): void {
    this.isModalOpen.set(false);
    this.selectedItem.set(null);
    void this.notify(this.dismissMessage);
    this.dismissMessage = this.config.closeMessage;
  }

  private async notify(message: string, color: string = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
      color
    });
    await toast.present();
  }
}