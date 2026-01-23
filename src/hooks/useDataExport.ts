import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

interface ExportOptions {
  wrestlers: boolean;
  achievements: boolean;
  history: boolean;
  buildings: boolean;
  books: boolean;
  albums: boolean;
}

interface ExportProgress {
  isExporting: boolean;
  stage: string;
  percentage: number;
}

export function useDataExport() {
  const [progress, setProgress] = useState<ExportProgress>({
    isExporting: false,
    stage: '',
    percentage: 0,
  });

  const toPersianNumber = (num: number): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
  };

  const fetchAllData = async (options: ExportOptions) => {
    const data: Record<string, any[]> = {};
    const stages = Object.entries(options).filter(([_, enabled]) => enabled);
    let completed = 0;

    for (const [key, enabled] of stages) {
      if (!enabled) continue;
      
      setProgress({
        isExporting: true,
        stage: getStageLabel(key),
        percentage: Math.round((completed / stages.length) * 100),
      });

      switch (key) {
        case 'wrestlers':
          const { data: wrestlers } = await supabase
            .from('wrestlers')
            .select('*')
            .order('display_order');
          data.wrestlers = wrestlers || [];
          break;
        case 'achievements':
          const { data: achievements } = await supabase
            .from('achievements')
            .select('*')
            .order('year', { ascending: false });
          data.achievements = achievements || [];
          break;
        case 'history':
          const { data: history } = await supabase
            .from('history_sections')
            .select('*')
            .order('display_order');
          data.history = history || [];
          break;
        case 'buildings':
          const { data: buildings } = await supabase
            .from('buildings')
            .select('*')
            .order('display_order');
          data.buildings = buildings || [];
          break;
        case 'books':
          const { data: books } = await supabase
            .from('books')
            .select('*')
            .order('display_order');
          data.books = books || [];
          break;
        case 'albums':
          const { data: albums } = await supabase
            .from('albums')
            .select('*')
            .order('display_order');
          data.albums = albums || [];
          
          const { data: photos } = await supabase
            .from('album_photos')
            .select('*')
            .order('display_order');
          data.album_photos = photos || [];
          break;
      }
      
      completed++;
    }

    setProgress({
      isExporting: true,
      stage: 'آماده‌سازی فایل',
      percentage: 100,
    });

    return data;
  };

  const getStageLabel = (stage: string): string => {
    const labels: Record<string, string> = {
      wrestlers: 'کشتی‌گیرها',
      achievements: 'دستاوردها',
      history: 'تاریخچه',
      buildings: 'بناها',
      books: 'کتاب‌ها',
      albums: 'آلبوم‌ها',
    };
    return labels[stage] || stage;
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToJSON = async (options: ExportOptions) => {
    try {
      setProgress({ isExporting: true, stage: 'شروع', percentage: 0 });
      
      const data = await fetchAllData(options);
      
      const exportData = {
        exportDate: new Date().toISOString(),
        data,
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      
      const date = new Date().toLocaleDateString('fa-IR').replace(/\//g, '-');
      downloadFile(blob, `museum-backup-${date}.json`);
      
      // Save last backup time
      localStorage.setItem('last_backup_time', new Date().toISOString());
      
      setProgress({ isExporting: false, stage: '', percentage: 0 });
      return true;
    } catch (error) {
      console.error('Export error:', error);
      setProgress({ isExporting: false, stage: '', percentage: 0 });
      return false;
    }
  };

  const exportToExcel = async (options: ExportOptions) => {
    try {
      setProgress({ isExporting: true, stage: 'شروع', percentage: 0 });
      
      const data = await fetchAllData(options);
      
      const workbook = XLSX.utils.book_new();
      
      // Add sheets for each data type
      Object.entries(data).forEach(([key, items]) => {
        if (items && items.length > 0) {
          const worksheet = XLSX.utils.json_to_sheet(items);
          XLSX.utils.book_append_sheet(workbook, worksheet, getStageLabel(key));
        }
      });
      
      // Generate buffer and create blob
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const date = new Date().toLocaleDateString('fa-IR').replace(/\//g, '-');
      downloadFile(blob, `museum-backup-${date}.xlsx`);
      
      // Save last backup time
      localStorage.setItem('last_backup_time', new Date().toISOString());
      
      setProgress({ isExporting: false, stage: '', percentage: 0 });
      return true;
    } catch (error) {
      console.error('Export error:', error);
      setProgress({ isExporting: false, stage: '', percentage: 0 });
      return false;
    }
  };

  const getLastBackupTime = (): string | null => {
    const time = localStorage.getItem('last_backup_time');
    if (!time) return null;
    
    const date = new Date(time);
    return date.toLocaleDateString('fa-IR') + ' - ' + date.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return {
    progress,
    exportToJSON,
    exportToExcel,
    getLastBackupTime,
    toPersianNumber,
  };
}
