// Mock data for wrestlers - will be replaced with Supabase data
export interface Wrestler {
  id: string;
  name: string;
  style: 'freestyle' | 'greco-roman';
  weight_class: string;
  province: string;
  image_url: string | null;
  bio: string | null;
  full_story: string | null;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  wrestler_id: string;
  title: string;
  event: string;
  year: number;
  medal_type: 'gold' | 'silver' | 'bronze';
  description: string | null;
}

export interface WrestlerMedia {
  id: string;
  wrestler_id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail: string | null;
  title: string | null;
  display_order: number;
}

// Initial 38 wrestlers seed data
export const initialWrestlers: Omit<Wrestler, 'created_at' | 'updated_at'>[] = [
  { id: '1', name: 'محمدمهدی یعقوبی', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '2', name: 'امید نوروزی', style: 'greco-roman', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '3', name: 'محمدعلی صنعتکاران', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '4', name: 'احسان لشگری', style: 'greco-roman', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '5', name: 'محمدعلی خجسته‌پور', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '6', name: 'کمیل قاسمی', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '7', name: 'محمدحسین محبی', style: 'greco-roman', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '8', name: 'مسعود مصطفی‌جوکار', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '9', name: 'شمس‌الدین سیدعباسی', style: 'greco-roman', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '10', name: 'محمدعلی گرایی', style: 'greco-roman', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '11', name: 'ابراهیم جوادی', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '12', name: 'عسکری محمدیان', style: 'greco-roman', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '13', name: 'قاسم غلامرضا رضایی', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '14', name: 'ابوطالب طالبی', style: 'greco-roman', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '15', name: 'محمدحسن محبی', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '16', name: 'امامعلی حبیبی', style: 'greco-roman', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '17', name: 'سعید عبدولی', style: 'greco-roman', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '18', name: 'رحیم علی‌آبادی', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '19', name: 'حسن رحیمی', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '20', name: 'محمدابراهیم سیف‌پور سعدآبادی', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '21', name: 'عباس جدیدی', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '22', name: 'عبدالله موحد اردبیلی', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '23', name: 'سید عبدالله مجتبوی', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '24', name: 'ناصر گیوه‌چی', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '25', name: 'علیرضا حیدری', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '26', name: 'منصور برزگر', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '27', name: 'حسن یزدانی', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '28', name: 'صادق گودرزی', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '29', name: 'سیدمراد محمدی پهنه‌کالی', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '30', name: 'توفیق جهانبخت', style: 'greco-roman', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '31', name: 'امیرحسین زارع', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '32', name: 'سید علی‌اکبر حیدری هفشجانی', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '33', name: 'محمد پازیار', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '34', name: 'علیرضا رضایی', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '35', name: 'محمود ملاقاسمی', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '36', name: 'محسن فره‌وشی', style: 'freestyle', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '37', name: 'حمید سوریان', style: 'greco-roman', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
  { id: '38', name: 'محمدهادی ساروی', style: 'greco-roman', weight_class: '', province: '', image_url: null, bio: null, full_story: null },
];

// Get mock wrestlers with timestamps
export const getMockWrestlers = (): Wrestler[] => {
  const now = new Date().toISOString();
  return initialWrestlers.map(w => ({
    ...w,
    created_at: now,
    updated_at: now,
  }));
};

// Iranian provinces
export const iranianProvinces = [
  'تهران', 'اصفهان', 'فارس', 'خراسان رضوی', 'آذربایجان شرقی', 
  'آذربایجان غربی', 'خوزستان', 'کرمان', 'گیلان', 'مازندران',
  'قم', 'البرز', 'مرکزی', 'گلستان', 'قزوین', 'همدان', 'کردستان',
  'لرستان', 'کرمانشاه', 'چهارمحال و بختیاری', 'یزد', 'سمنان',
  'زنجان', 'اردبیل', 'سیستان و بلوچستان', 'هرمزگان', 'بوشهر',
  'کهگیلویه و بویراحمد', 'ایلام', 'خراسان شمالی', 'خراسان جنوبی'
];

// Wrestling styles in Persian
export const wrestlingStyles = {
  'freestyle': 'آزاد',
  'greco-roman': 'فرنگی',
} as const;

// Medal types in Persian
export const medalTypes = {
  'gold': 'طلا',
  'silver': 'نقره',
  'bronze': 'برنز',
} as const;
