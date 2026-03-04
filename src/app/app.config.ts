import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { LucideAngularModule, LayoutDashboard, BookOpen, Award, Settings, ChevronRight, CheckCircle, Lock, Users, Clock, TrendingUp, Moon, Sun, Plus, Edit, Trash, FileText, Layers, Shield, Smartphone, PenTool, GripVertical, ChevronDown, Dot, AlertCircle, Play } from 'lucide-angular';
import { provideNgxMask } from 'ngx-mask';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideNgxMask(),
    importProvidersFrom(
      LucideAngularModule.pick({ 
        LayoutDashboard, BookOpen, Award, Settings, ChevronRight, 
        CheckCircle, Lock, Users, Clock, TrendingUp, Moon, Sun,
        Plus, Edit, Trash, FileText, Layers, Shield, Smartphone,
        PenTool, GripVertical, ChevronDown, Dot, AlertCircle, Play
      })
    )
  ]
};