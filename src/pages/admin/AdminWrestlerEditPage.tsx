import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Save, Trash2, Plus, X, Image as ImageIcon, Video, Upload } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassInput } from '@/components/ui/GlassInput';
import { GoldButton } from '@/components/ui/GoldButton';
import { SkeletonProfile } from '@/components/ui/skeleton-cards';
import { UploadDropzone } from '@/components/UploadDropzone';
import { LazyImage } from '@/components/ui/LazyImage';
import { useWrestlers, Wrestler } from '@/contexts/WrestlerContext';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { Achievement, wrestlingStyles, iranianProvinces, medalTypes } from '@/data/wrestlers';
import { cn } from '@/lib/utils';

type WizardStep = 'basic' | 'bio' | 'video' | 'achievements' | 'media';

const steps: { id: WizardStep; label: string }[] = [
  { id: 'basic', label: 'اطلاعات پایه' },
  { id: 'bio', label: 'بیوگرافی و داستان' },
  { id: 'video', label: 'ویدیو معرفی' },
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
    getMediaByWrestlerId,
    addAchievement,
    deleteAchievement,
    addMedia,
    deleteMedia,
    isLoading 
  } = useWrestlers();

  const { uploadFile, deleteFile, isUploading, uploadProgress, error: uploadError } = useMediaUpload();

  const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
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
    intro_video_url: '',
    success_path: '',
    social_activities: '',
  });

  const [achievements, setAchievements] = useState<Omit<Achievement, 'id'>[]>([]);
  const [existingMedia, setExistingMedia] = useState<{ id: string; type: 'image' | 'video'; url: string; title: string | null }[]>([]);

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
          intro_video_url: wrestler.intro_video_url || '',
          success_path: wrestler.success_path || '',
          social_activities: wrestler.social_activities || '',
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

        const existingMediaItems = getMediaByWrestlerId(id);
        setExistingMedia(existingMediaItems.map(m => ({
          id: m.id,
          type: m.type,
          url: m.url,
          title: m.title,
        })));
      }
    }
  }, [id, isNew, getWrestlerById, getAchievementsByWrestlerId, getMediaByWrestlerId]);

  const handleInputChange = (field: keyof Wrestler, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle profile image upload
  const handleProfileImageUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    setIsUploadingProfile(true);
    
    try {
      // Use a temporary ID for new wrestlers or actual ID for existing
      const uploadId = isNew ? `temp-${Date.now()}` : id!;
      const url = await uploadFile(file, uploadId);
      setFormData(prev => ({ ...prev, image_url: url }));
    } catch (err) {
      console.error('Failed to upload profile image:', err);
      setError('خطا در آپلود تصویر پروفایل');
    } finally {
      setIsUploadingProfile(false);
    }
  };

  // Handle intro video upload
  const handleVideoUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    setIsUploadingVideo(true);
    
    try {
      const uploadId = isNew ? `temp-video-${Date.now()}` : id!;
      const url = await uploadFile(file, uploadId);
      setFormData(prev => ({ ...prev, intro_video_url: url }));
    } catch (err) {
      console.error('Failed to upload video:', err);
      setError('خطا در آپلود ویدیو');
    } finally {
      setIsUploadingVideo(false);
    }
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
          intro_video_url: formData.intro_video_url || null,
          success_path: formData.success_path || null,
          social_activities: formData.social_activities || null,
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
          intro_video_url: formData.intro_video_url || null,
          success_path: formData.success_path || null,
          social_activities: formData.social_activities || null,
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

  const handleFilesSelected = async (files: File[]) => {
    if (!id || isNew) return;
    
    for (const file of files) {
      try {
        const url = await uploadFile(file, id);
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        
        const newMedia = await addMedia({
          wrestler_id: id,
          type,
          url,
          thumbnail: null,
          title: file.name,
          display_order: existingMedia.length,
        });
        
        setExistingMedia(prev => [...prev, {
          id: newMedia.id,
          type: newMedia.type,
          url: newMedia.url,
          title: newMedia.title,
        }]);
      } catch (err) {
        console.error('Failed to upload file:', err);
      }
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    const mediaItem = existingMedia.find(m => m.id === mediaId);
    if (!mediaItem) return;

    try {
      await deleteFile(mediaItem.url);
      await deleteMedia(mediaId);
      setExistingMedia(prev => prev.filter(m => m.id !== mediaId));
    } catch (err) {
      console.error('Failed to delete media:', err);
    }
  };

  const setAsProfileImage = (url: string) => {
    setFormData(prev => ({ ...prev, image_url: url }));
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

              {/* Profile Image Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-muted-foreground">
                  تصویر پروفایل
                </label>
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Preview */}
                  <div className="w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-muted border border-border/50">
                    {formData.image_url ? (
                      <img 
                        src={formData.image_url} 
                        alt="پیش‌نمایش"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-10 w-10 opacity-50" />
                      </div>
                    )}
                  </div>
                  
                  {/* Upload Area */}
                  <div className="flex-1">
                    <UploadDropzone
                      onFilesSelected={handleProfileImageUpload}
                      isUploading={isUploadingProfile}
                      uploadProgress={uploadProgress}
                      accept="image/jpeg,image/png,image/webp"
                      maxFiles={1}
                      maxSizeMB={5}
                      multiple={false}
                      showLimits={false}
                    />
                    {formData.image_url && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                        className="mt-2 text-sm text-destructive hover:underline"
                      >
                        حذف تصویر
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Or manual URL */}
                <div className="mt-4">
                  <label className="block text-xs text-muted-foreground mb-1">
                    یا آدرس مستقیم تصویر:
                  </label>
                  <GlassInput
                    value={formData.image_url || ''}
                    onChange={(e) => handleInputChange('image_url', e.target.value)}
                    placeholder="https://..."
                    dir="ltr"
                    className="text-left text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'bio' && (
          <div className="space-y-6 animate-fade-in">
            {/* روایت من (Bio) - First person narrative */}
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                روایت من (بیوگرافی اول شخص)
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                این متن به زبان اول شخص نوشته شود، انگار کشتی‌گیر خودش صحبت می‌کند.
              </p>
              <textarea
                value={formData.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="من از کودکی عاشق کشتی بودم..."
                className="glass-input min-h-[150px] resize-y"
              />
            </div>

            {/* زندگی‌نامه کامل */}
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                زندگی‌نامه کامل
              </label>
              <textarea
                value={formData.full_story || ''}
                onChange={(e) => handleInputChange('full_story', e.target.value)}
                placeholder="شرح کامل زندگی‌نامه..."
                className="glass-input min-h-[200px] resize-y"
              />
            </div>

            {/* مسیر موفقیت */}
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                مسیر موفقیت
              </label>
              <textarea
                value={formData.success_path || ''}
                onChange={(e) => handleInputChange('success_path', e.target.value)}
                placeholder="داستان مسیر موفقیت و چالش‌ها..."
                className="glass-input min-h-[150px] resize-y"
              />
            </div>

            {/* فعالیت‌های اجتماعی */}
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                فعالیت‌های اجتماعی
              </label>
              <textarea
                value={formData.social_activities || ''}
                onChange={(e) => handleInputChange('social_activities', e.target.value)}
                placeholder="فعالیت‌های خیریه، اجتماعی و فرهنگی..."
                className="glass-input min-h-[120px] resize-y"
              />
            </div>
          </div>
        )}

        {currentStep === 'video' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Video className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-primary">ویدیو معرفی کشتی‌گیر</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                این ویدیو (حداکثر ۳۰ ثانیه) در بالای صفحه پروفایل نمایش داده می‌شود.
                کشتی‌گیر می‌تواند خودش را معرفی کند.
              </p>
            </div>

            {/* Video Upload */}
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                آپلود ویدیو معرفی
              </label>
              <UploadDropzone
                onFilesSelected={handleVideoUpload}
                isUploading={isUploadingVideo}
                uploadProgress={uploadProgress}
                accept="video/mp4,video/webm,video/quicktime"
                maxFiles={1}
                maxSizeMB={50}
                multiple={false}
                showLimits={true}
              />
            </div>

            {/* Or manual URL */}
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                یا آدرس مستقیم ویدیو
              </label>
              <GlassInput
                value={formData.intro_video_url || ''}
                onChange={(e) => handleInputChange('intro_video_url', e.target.value)}
                placeholder="https://..."
                dir="ltr"
                className="text-left"
              />
            </div>
            
            {/* Video Preview */}
            {formData.intro_video_url && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">پیش‌نمایش</label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, intro_video_url: '' }))}
                    className="text-sm text-destructive hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    حذف ویدیو
                  </button>
                </div>
                <div className="rounded-xl overflow-hidden border border-border/50 bg-black">
                  <video
                    src={formData.intro_video_url}
                    controls
                    className="w-full max-h-[400px]"
                  />
                </div>
              </div>
            )}
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

            {isNew ? (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>ابتدا کشتی‌گیر را ذخیره کنید، سپس می‌توانید رسانه اضافه کنید</p>
              </div>
            ) : (
              <>
                {/* Upload Dropzone */}
                <UploadDropzone
                  onFilesSelected={handleFilesSelected}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                  minSizeMB={0.01}
                  maxSizeMB={10}
                  maxFiles={20}
                  showLimits={true}
                />

                {uploadError && (
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                    {uploadError}
                  </div>
                )}

                {/* Existing Media */}
                {existingMedia.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">رسانه‌های موجود</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {existingMedia.map(item => (
                        <div key={item.id} className="relative group">
                          <div className={cn(
                            'aspect-square rounded-xl overflow-hidden ring-2 transition-all',
                            formData.image_url === item.url 
                              ? 'ring-primary' 
                              : 'ring-transparent'
                          )}>
                            <LazyImage
                              src={item.url}
                              alt={item.title || 'رسانه'}
                              className="w-full h-full"
                            />
                          </div>
                          
                          {/* Actions */}
                          <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleDeleteMedia(item.id)}
                              className="p-2 rounded-full bg-destructive/90 text-white hover:bg-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          
                          {/* Set as profile */}
                          {item.type === 'image' && (
                            <button
                              onClick={() => setAsProfileImage(item.url)}
                              className={cn(
                                'absolute bottom-2 right-2 px-2 py-1 rounded-lg text-xs font-medium transition-all',
                                formData.image_url === item.url
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-black/50 text-white opacity-0 group-hover:opacity-100'
                              )}
                            >
                              {formData.image_url === item.url ? '✓ پروفایل' : 'تصویر پروفایل'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
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
