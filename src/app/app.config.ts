import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { LucideAngularModule, AlertCircle, AlertTriangle, ArrowLeft, Award, Bell, BookOpen, Briefcase, Calendar, Check, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock, Compass, Dot, Download, Edit, Edit2, Eye, FileCheck, FileText, Filter, Folder, GraduationCap, GripVertical, HelpCircle, Home, Info, Layers, Layout, LayoutDashboard, Loader2, Lock, LogIn, LogOut, Mail, Moon, PenTool, Play, Plus, RotateCcw, Search, SearchX, Send, Settings, Shield, Smartphone, Star, Sun, Tag, Trash, Trash2, TrendingUp, User, Users, X } from 'lucide-angular';
import { provideNgxMask } from 'ngx-mask';
import { NgChartsModule } from 'ng2-charts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideNgxMask(),
    provideAnimations(),
    importProvidersFrom(
      LucideAngularModule.pick({
        AlertCircle, AlertTriangle, ArrowLeft, Award, Bell, BookOpen, Briefcase, Calendar, Check, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock, Compass, Dot, Download, Edit, Edit2, Eye, FileCheck, FileText, Filter, Folder, GraduationCap, GripVertical, HelpCircle, Home, Info, Layers, Layout, LayoutDashboard, Loader2, Lock, LogIn, LogOut, Mail, Moon, PenTool, Play, Plus, RotateCcw, Search, SearchX, Send, Settings, Shield, Smartphone, Star, Sun, Tag, Trash, Trash2, TrendingUp, User, Users, X
      }),
      NgChartsModule
    )
  ]
};