import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { LucideAngularModule, AlertCircle, AlertTriangle, ArrowLeft, ArrowRight, Award, Bell, BookOpen, Briefcase, Calendar, Check, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ClipboardList, Clock, Compass, Dot, Download, Edit, Edit2, ExternalLink, Eye, File, FileCheck, FileSpreadsheet, FileText, Filter, Folder, GraduationCap, GripVertical, HelpCircle, Home, Info, Layers, Layout, LayoutDashboard, List, Loader2, Lock, LogIn, LogOut, Mail, Moon, Paperclip, Palette, PenTool, Play, Plus, RefreshCw, RotateCcw, Search, SearchX, Send, Settings, Shield, Smartphone, Star, Sun, Tag, Trash, Trash2, TrendingUp, Upload, User, UserPlus, Users, X, Youtube, Zap } from 'lucide-angular';
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
        AlertCircle, AlertTriangle, ArrowLeft, ArrowRight, Award, Bell, BookOpen, Briefcase, Calendar, Check, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ClipboardList, Clock, Compass, Dot, Download, Edit, Edit2, ExternalLink, Eye, File, FileCheck, FileSpreadsheet, FileText, Filter, Folder, GraduationCap, GripVertical, HelpCircle, Home, Info, Layers, Layout, LayoutDashboard, List, Loader2, Lock, LogIn, LogOut, Mail, Moon, Paperclip, Palette, PenTool, Play, Plus, RefreshCw, RotateCcw, Search, SearchX, Send, Settings, Shield, Smartphone, Star, Sun, Tag, Trash, Trash2, TrendingUp, Upload, User, UserPlus, Users, X, Youtube, Zap
      }),
      NgChartsModule
    )
  ]
};