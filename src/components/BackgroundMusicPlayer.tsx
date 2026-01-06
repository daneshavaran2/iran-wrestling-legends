import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';

export function BackgroundMusicPlayer() {
  // This component just initializes the background music hook
  // No UI is rendered - music plays automatically based on admin settings
  useBackgroundMusic();
  
  return null;
}
