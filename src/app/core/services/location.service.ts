import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface State {
  id: number;
  sigla: string;
  nome: string;
}

export interface City {
  nome: string;
  codigo_ibge: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private baseUrl = 'https://brasilapi.com.br/api/ibge';

  constructor(private http: HttpClient) {}

  getStates(): Observable<State[]> {
    return this.http.get<State[]>(`${this.baseUrl}/uf/v1`);
  }

  getCities(stateSigla: string): Observable<City[]> {
    return this.http.get<City[]>(`${this.baseUrl}/municipios/v1/${stateSigla}`);
  }
}