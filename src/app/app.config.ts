import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { LucideAngularModule, LayoutDashboard, BookOpen, Award, Settings, ChevronRight, CheckCircle, Lock, Users, Clock, TrendingUp, Moon, Sun } from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      LucideAngularModule.pick({ 
        LayoutDashboard, BookOpen, Award, Settings, ChevronRight, 
        CheckCircle, Lock, Users, Clock, TrendingUp, Moon, Sun 
      })
    )
  ]
};