import { Injectable } from '@angular/core';
import { supabase } from '../../../integrations/supabase/client';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  get client() {
    return supabase;
  }
}