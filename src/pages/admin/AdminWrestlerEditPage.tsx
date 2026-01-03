import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Save, Trash2, Plus, Upload, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassInput } from '@/components/ui/GlassInput';
import { GoldButton } from '@/components/ui/GoldButton';
import { SkeletonProfile } from '@/components/ui/skeleton-cards';
import { useWrestlers } from '@/contexts/WrestlerContext';
import { Wrestler, Achievement, wrestlingStyles, iranianProvinces, medalTypes } from '@/data/wrestlers';
import { cn } from '@/lib/utils';

type WizardStep = 'basic' | 'bio' | 'achievements' | 'media';

const steps: { id: WizardStep; label: string }[] = [
  { id: 'basic', label: 'اطلاعات پایه' },
  { id: 'bio', label: 'بیوگرافی' },
  { id: 'achievements', label: 'افتخارات' },
  { id: 'media', label: 'رسانه‌ها' },
];

export default function AdminWrestlerEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  
  const { 
    getWrestlerById, 
    addWrestler, 
    updateWrestler,
    getAchievementsByWrestlerId,
    addAchievement,
    deleteAchievement,
    isLoading 
  } = useWrestlers();

  const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Wrestler>>({
    name: '',
    style: 'freestyle',
    weight_class: '',
    province: '',
    bio: '',
    full_story: '',
    image_url: '',
  });

  const [achievements, setAchievements] = useState<Omit<Achievement, 'id'>[]>([]);

  // Load existing data
  useEffect(() => {
    if (!isNew && id) {
      const wrestler = getWrestlerById(id);
      if (wrestler) {
        setFormData({
          name: wrestler.name,
          style: wrestler.style,
          weight_class: wrestler.weight_class,
          province: wrestler.province,
          bio: wrestler.bio || '',
          full_story: wrestler.full_story || '',
          image_url: wrestler.image_url || '',
        });
        const existingAchievements = getAchievementsByWrestlerId(id);
        setAchievements(existingAchievements.map(a => ({
          wrestler_id: a.wrestler_id,
          title: a.title,
          event: a.event,
          year: a.year,
          medal_type: a.medal_type,
          description: a.description,
        })));
      }
    }
  }, [id, isNew, getWrestlerById, getAchievementsByWrestlerId]);

  const handleInputChange = (field: keyof Wrestler, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      setError('نام کشتی‌گیر الزامی است');
      setCurrentStep('basic');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isNew) {
        const newWrestler = await addWrestler({
          name: formData.name!,
          style: formData.style as 'freestyle' | 'greco-roman',
          weight_class: formData.weight_class || '',
          province: formData.province || '',
          bio: formData.bio || null,
          full_story: formData.full_story || null,
          image_url: formData.image_url || null,
        });
        
        // Add achievements
        for (const ach of achievements) {
          await addAchievement({ ...ach, wrestler_id: newWrestler.id });
        }
        
        navigate('/admin/wrestlers');
      } else {
        await updateWrestler(id!, {
          name: formData.name,
          style: formData.style as 'freestyle' | 'greco-roman',
          weight_class: formData.weight_class,
          province: formData.province,
          bio: formData.bio || null,
          full_story: formData.full_story || null,
          image_url: formData.image_url || null,
        });
        navigate('/admin/wrestlers');
      }
    } catch (err) {
      setError('خطا در ذخیره اطلاعات');
    } finally {
      setIsSaving(false);
    }
  };

  const addNewAchievement = () => {
    setAchievements(prev => [...prev, {
      wrestler_id: id || '',
      title: '',
      event: '',
      year: new Date().getFullYear(),
      medal_type: 'gold',
      description: null,
    }]);
  };

  const updateAchievementField = (index: number, field: keyof Achievement, value: any) => {
    setAchievements(prev => prev.map((a, i) => 
      i === index ? { ...a, [field]: value } : a
    ));
  };

  const removeAchievement = (index: number) => {
    setAchievements(prev => prev.filter((_, i) => i !== index));
  };

  if (isLoading && !isNew) {
    return (
      <div className="p-6">
        <SkeletonProfile />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <GoldButton
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/wrestlers')}
          >
            <ArrowRight className="h-4 w-4" />
          </GoldButton>
          <h1 className="text-2xl font-bold text-gold">
            {isNew ? 'افزودن کشتی‌گیر جدید' : 'ویرایش کشتی‌گیر'}
          </h1>
        </div>
        <GoldButton
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <>
              <Save className="h-4 w-4" />
              ذخیره
            </>
          )}
        </GoldButton>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive">
          {error}
        </div>
      )}

      {/* Wizard Steps */}
      <GlassCard className="p-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-xl whitespace-nowrap transition-all duration-240',
                currentStep === step.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <span className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-sm">
                {index + 1}
              </span>
              {step.label}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Step Content */}
      <GlassCard className="p-8">
        {currentStep === 'basic' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">
                  نام کشتی‌گیر *
                </label>
                <GlassInput
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="نام کامل"
                />
              </div>

              {/* Style */}
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">
                  سبک کشتی
                </label>
                <select
                  value={formData.style || 'freestyle'}
                  onChange={(e) => handleInputChange('style', e.target.value)}
                  className="glass-input cursor-pointer"
                >
                  {Object.entries(wrestlingStyles).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Weight Class */}
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">
                  دسته وزنی
                </label>
                <GlassInput
                  value={formData.weight_class || ''}
                  onChange={(e) => handleInputChange('weight_class', e.target.value)}
                  placeholder="مثال: ۷۴ کیلوگرم"
                />
              </div>

              {/* Province */}
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">
                  استان
                </label>
                <select
                  value={formData.province || ''}
                  onChange={(e) => handleInputChange('province', e.target.value)}
                  className="glass-input cursor-pointer"
                >
                  <option value="">انتخاب استان</option>
                  {iranianProvinces.map(province => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>

              {/* Image URL */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-muted-foreground">
                  آدرس تصویر
                </label>
                <GlassInput
                  value={formData.image_url || ''}
                  onChange={(e) => handleInputChange('image_url', e.target.value)}
                  placeholder="https://..."
                  dir="ltr"
                  className="text-left"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 'bio' && (
          <div className="space-y-6 animate-fade-in">
            {/* Bio */}
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                بیوگرافی کوتاه
              </label>
              <textarea
                value={formData.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="خلاصه‌ای از زندگی و افتخارات..."
                className="glass-input min-h-[120px] resize-y"
              />
            </div>

            {/* Full Story */}
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                زندگی‌نامه کامل
              </label>
              <textarea
                value={formData.full_story || ''}
                onChange={(e) => handleInputChange('full_story', e.target.value)}
                placeholder="شرح کامل زندگی‌نامه..."
                className="glass-input min-h-[300px] resize-y"
              />
            </div>
          </div>
        )}

        {currentStep === 'achievements' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">افتخارات و مدال‌ها</h3>
              <GoldButton variant="outline" size="sm" onClick={addNewAchievement}>
                <Plus className="h-4 w-4 ml-2" />
                افزودن
              </GoldButton>
            </div>

            {achievements.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                هنوز افتخاری ثبت نشده است
              </div>
            ) : (
              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <GlassCard key={index} variant="subtle" className="p-6">
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={() => removeAchievement(index)}
                        className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-1 text-muted-foreground">عنوان</label>
                        <GlassInput
                          value={achievement.title}
                          onChange={(e) => updateAchievementField(index, 'title', e.target.value)}
                          placeholder="مثال: قهرمان المپیک"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-muted-foreground">رویداد</label>
                        <GlassInput
                          value={achievement.event}
                          onChange={(e) => updateAchievementField(index, 'event', e.target.value)}
                          placeholder="مثال: المپیک توکیو"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-muted-foreground">سال</label>
                        <GlassInput
                          type="number"
                          value={achievement.year}
                          onChange={(e) => updateAchievementField(index, 'year', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-muted-foreground">نوع مدال</label>
                        <select
                          value={achievement.medal_type}
                          onChange={(e) => updateAchievementField(index, 'medal_type', e.target.value)}
                          className="glass-input cursor-pointer"
                        >
                          {Object.entries(medalTypes).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        )}

        {currentStep === 'media' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">تصاویر و رسانه‌ها</h3>
            </div>

            {/* Drag & Drop Area */}
            <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">فایل‌ها را اینجا رها کنید</p>
              <p className="text-sm text-muted-foreground">
                یا کلیک کنید تا فایل انتخاب شود
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                پشتیبانی از JPG, PNG, MP4 (حداکثر ۱۰ مگابایت)
              </p>
            </div>

            <div className="text-center py-8 text-muted-foreground">
              <p>برای فعال‌سازی آپلود رسانه، Lovable Cloud را متصل کنید</p>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Step Navigation */}
      <div className="flex justify-between">
        <GoldButton
          variant="outline"
          onClick={() => {
            const currentIndex = steps.findIndex(s => s.id === currentStep);
            if (currentIndex > 0) {
              setCurrentStep(steps[currentIndex - 1].id);
            }
          }}
          disabled={currentStep === 'basic'}
        >
          مرحله قبل
        </GoldButton>
        
        {currentStep === 'media' ? (
          <GoldButton onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'در حال ذخیره...' : 'ذخیره و خروج'}
          </GoldButton>
        ) : (
          <GoldButton
            onClick={() => {
              const currentIndex = steps.findIndex(s => s.id === currentStep);
              if (currentIndex < steps.length - 1) {
                setCurrentStep(steps[currentIndex + 1].id);
              }
            }}
          >
            مرحله بعد
          </GoldButton>
        )}
      </div>
    </div>
  );
}
