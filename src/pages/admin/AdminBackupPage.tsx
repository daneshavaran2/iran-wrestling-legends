import { useState } from 'react';
import { 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  Users, 
  History, 
  Building2, 
  BookOpen, 
  Images,
  Trophy,
  CheckSquare,
  Square,
  Clock
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useDataExport } from '@/hooks/useDataExport';
import { toast } from 'sonner';

interface ExportSection {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const exportSections: ExportSection[] = [
  { key: 'wrestlers', label: 'کشتی‌گیرها', icon: Users, description: 'اطلاعات تمام کشتی‌گیرها' },
  { key: 'achievements', label: 'دستاوردها', icon: Trophy, description: 'افتخارات و مدال‌ها' },
  { key: 'history', label: 'تاریخچه', icon: History, description: 'بخش‌های تاریخچه موزه' },
  { key: 'buildings', label: 'بناها', icon: Building2, description: 'اطلاعات بناهای ورزشی' },
  { key: 'books', label: 'کتاب‌ها', icon: BookOpen, description: 'کتاب‌ها و منابع' },
  { key: 'albums', label: 'آلبوم‌ها', icon: Images, description: 'آلبوم‌ها و تصاویر' },
];

export default function AdminBackupPage() {
  const { progress, exportToJSON, exportToExcel, getLastBackupTime } = useDataExport();
  
  const [selectedSections, setSelectedSections] = useState<Record<string, boolean>>({
    wrestlers: true,
    achievements: true,
    history: true,
    buildings: true,
    books: true,
    albums: true,
  });
  
  const [format, setFormat] = useState<'json' | 'excel'>('json');

  const handleToggleSection = (key: string) => {
    setSelectedSections(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectAll = () => {
    const allSelected = Object.values(selectedSections).every(Boolean);
    const newValue = !allSelected;
    setSelectedSections(
      Object.fromEntries(exportSections.map(s => [s.key, newValue]))
    );
  };

  const handleExport = async () => {
    const hasSelection = Object.values(selectedSections).some(Boolean);
    if (!hasSelection) {
      toast.error('لطفاً حداقل یک بخش را انتخاب کنید');
      return;
    }

    toast.info('در حال آماده‌سازی خروجی...');
    
    const options = {
      wrestlers: selectedSections.wrestlers,
      achievements: selectedSections.achievements,
      history: selectedSections.history,
      buildings: selectedSections.buildings,
      books: selectedSections.books,
      albums: selectedSections.albums,
    };

    const success = format === 'json' 
      ? await exportToJSON(options)
      : await exportToExcel(options);

    if (success) {
      toast.success('فایل پشتیبان با موفقیت دانلود شد');
    } else {
      toast.error('خطا در ایجاد فایل پشتیبان');
    }
  };

  const allSelected = Object.values(selectedSections).every(Boolean);
  const someSelected = Object.values(selectedSections).some(Boolean);
  const lastBackup = getLastBackupTime();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">پشتیبان‌گیری</h1>
        <p className="text-muted-foreground">
          خروجی گرفتن از داده‌های موزه برای ذخیره‌سازی یا انتقال
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Section Selection */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CheckSquare className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">انتخاب بخش‌ها</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="text-muted-foreground hover:text-foreground"
            >
              {allSelected ? 'لغو همه' : 'انتخاب همه'}
            </Button>
          </div>

          <div className="space-y-3">
            {exportSections.map((section) => {
              const Icon = section.icon;
              const isSelected = selectedSections[section.key];

              return (
                <div
                  key={section.key}
                  onClick={() => handleToggleSection(section.key)}
                  className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary/10 border-2 border-primary/30'
                      : 'bg-muted/30 border-2 border-transparent hover:bg-muted/50'
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleSection(section.key)}
                    className="pointer-events-none"
                  />
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="flex-1">
                    <div className={`font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {section.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {section.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Format Selection & Export */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Download className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">فرمت خروجی</h2>
            </div>

            <RadioGroup
              value={format}
              onValueChange={(value: 'json' | 'excel') => setFormat(value)}
              className="space-y-4"
            >
              <div
                onClick={() => setFormat('json')}
                className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                  format === 'json'
                    ? 'bg-primary/10 border-2 border-primary/30'
                    : 'bg-muted/30 border-2 border-transparent hover:bg-muted/50'
                }`}
              >
                <RadioGroupItem value="json" id="json" className="pointer-events-none" />
                <FileJson className={`h-6 w-6 ${format === 'json' ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="flex-1">
                  <Label htmlFor="json" className="font-medium cursor-pointer">JSON</Label>
                  <p className="text-xs text-muted-foreground">
                    مناسب برای برنامه‌نویسان و import مجدد
                  </p>
                </div>
              </div>

              <div
                onClick={() => setFormat('excel')}
                className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                  format === 'excel'
                    ? 'bg-primary/10 border-2 border-primary/30'
                    : 'bg-muted/30 border-2 border-transparent hover:bg-muted/50'
                }`}
              >
                <RadioGroupItem value="excel" id="excel" className="pointer-events-none" />
                <FileSpreadsheet className={`h-6 w-6 ${format === 'excel' ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="flex-1">
                  <Label htmlFor="excel" className="font-medium cursor-pointer">Excel</Label>
                  <p className="text-xs text-muted-foreground">
                    مناسب برای مشاهده و ویرایش در اکسل
                  </p>
                </div>
              </div>
            </RadioGroup>
          </GlassCard>

          {/* Export Button */}
          <GlassCard className="p-6">
            {progress.isExporting ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{progress.stage}</span>
                  <span className="font-medium">{progress.percentage}%</span>
                </div>
                <Progress value={progress.percentage} className="h-2" />
              </div>
            ) : (
              <>
                <Button
                  className="w-full mb-4"
                  size="lg"
                  onClick={handleExport}
                  disabled={!someSelected}
                >
                  <Download className="h-5 w-5 ml-2" />
                  دانلود پشتیبان
                </Button>
                
                {lastBackup && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                    <Clock className="h-4 w-4" />
                    <span>آخرین پشتیبان: {lastBackup}</span>
                  </div>
                )}
              </>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Tips Section */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">نکات مهم</h3>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>فایل‌های پشتیبان شامل آدرس تصاویر هستند، نه خود تصاویر.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>فرمت JSON برای بازیابی برنامه‌نویسی مناسب‌تر است.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>فرمت Excel برای مشاهده و گزارش‌گیری مناسب است.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>پیشنهاد می‌شود به صورت دوره‌ای از داده‌ها پشتیبان تهیه کنید.</span>
          </li>
        </ul>
      </GlassCard>
    </div>
  );
}
