import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { LucideAngularModule, LayoutDashboard, BookOpen, Award, Settings, ChevronRight, CheckCircle, Lock, Users, Clock, TrendingUp, Moon, Sun, Plus, Edit, Trash, FileText, Layers } from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    importProvidersFrom(
      LucideAngularModule.pick({ 
        LayoutDashboard, BookOpen, Award, Settings, ChevronRight, 
        CheckCircle, Lock, Users, Clock, TrendingUp, Moon, Sun,
        Plus, Edit, Trash, FileText, Layers
      })
    )
  ]
};