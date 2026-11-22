export type MockupDevice = 'phone' | 'desktop' | 'both';

export type MockupTheme = 'social' | 'artistico' | 'bebe';

export interface MockupThemeTokens {
  theme: MockupTheme;
  badgeLabel: string;
  headerSubtitle: string;
  accentHex: string;
  accentSoftHex: string;
  secondaryHex: string;
  screenBgHex: string;
  bubbleBgHex: string;
  userBubbleBgHex: string;
  userBubbleTextHex: string;
  chipBorderRgba: string;
  selectedChipBgHex: string;
  selectedChipTextHex: string;
  selectedChipBorderHex: string;
  cursorCoreHex: string;
  cursorRingRgba: string;
  orbGradient: string;
  ambientGlow: string;
  isPastel: boolean;
}

export const MOCKUP_THEMES: Record<MockupTheme, MockupThemeTokens> = {
  social: {
    theme: 'social',
    badgeLabel: 'Nome Social',
    headerSubtitle: 'vamos achar a sua melhor assinatura',
    accentHex: '#D4AF37',
    accentSoftHex: '#F2CA50',
    secondaryHex: '#bea5ff',
    screenBgHex: '#131313',
    bubbleBgHex: '#1C1C1C',
    userBubbleBgHex: '#D4AF37',
    userBubbleTextHex: '#111111',
    chipBorderRgba: 'rgba(212, 175, 55, 0.42)',
    selectedChipBgHex: '#D4AF37',
    selectedChipTextHex: '#111111',
    selectedChipBorderHex: '#D4AF37',
    cursorCoreHex: '#F2CA50',
    cursorRingRgba: 'rgba(242, 202, 80, 0.45)',
    orbGradient: 'linear-gradient(135deg, #D4AF37 0%, #F2CA50 48%, #c084fc 100%)',
    ambientGlow:
      'radial-gradient(circle at 18% 0%, rgba(212, 175, 55, 0.14), transparent 55%), radial-gradient(circle at 86% 18%, rgba(190, 165, 255, 0.1), transparent 48%)',
    isPastel: false,
  },
  artistico: {
    theme: 'artistico',
    badgeLabel: 'Nome Artístico',
    headerSubtitle: 'palco, presença e identidade única',
    accentHex: '#bea5ff',
    accentSoftHex: '#F2CA50',
    secondaryHex: '#d7c6ff',
    screenBgHex: '#131313',
    bubbleBgHex: '#1C1C1C',
    userBubbleBgHex: '#F2CA50',
    userBubbleTextHex: '#111111',
    chipBorderRgba: 'rgba(190, 165, 255, 0.45)',
    selectedChipBgHex: '#bea5ff',
    selectedChipTextHex: '#131313',
    selectedChipBorderHex: '#d7c6ff',
    cursorCoreHex: '#d7c6ff',
    cursorRingRgba: 'rgba(215, 198, 255, 0.48)',
    orbGradient: 'linear-gradient(135deg, #bea5ff 0%, #F2CA50 55%, #c084fc 100%)',
    ambientGlow:
      'radial-gradient(ellipse at 50% -8%, rgba(190, 165, 255, 0.22), transparent 58%), radial-gradient(circle at 85% 15%, rgba(242, 202, 80, 0.13), transparent 48%)',
    isPastel: false,
  },
  bebe: {
    theme: 'bebe',
    badgeLabel: 'Nome do Bebê',
    headerSubtitle: 'cuidado e harmonia para quem está chegando',
    accentHex: '#F5C6CE',
    accentSoftHex: '#BCE3D7',
    secondaryHex: '#D8CCF7',
    screenBgHex: '#151317',
    bubbleBgHex: '#1E1B21',
    userBubbleBgHex: '#F5C6CE',
    userBubbleTextHex: '#171419',
    chipBorderRgba: 'rgba(245, 198, 206, 0.45)',
    selectedChipBgHex: '#BCE3D7',
    selectedChipTextHex: '#131917',
    selectedChipBorderHex: '#BCE3D7',
    cursorCoreHex: '#F5C6CE',
    cursorRingRgba: 'rgba(245, 198, 206, 0.5)',
    orbGradient: 'linear-gradient(135deg, #F5C6CE 0%, #D8CCF7 52%, #BCE3D7 100%)',
    ambientGlow:
      'radial-gradient(circle at 18% 0%, rgba(245, 198, 206, 0.16), transparent 54%), radial-gradient(circle at 86% 22%, rgba(188, 227, 215, 0.13), transparent 50%)',
    isPastel: true,
  },
};
