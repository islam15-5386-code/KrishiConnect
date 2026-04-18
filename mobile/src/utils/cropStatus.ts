import { KRISHI_COLORS } from '../theme/krishiTheme';

export type CropStatus = 'স্বাস্থ্যকর' | 'সতর্কতা' | 'ভালো';

export function getCropStatusStyle(status: CropStatus) {
  if (status === 'সতর্কতা') {
    return {
      textColor: KRISHI_COLORS.warning,
      borderColor: KRISHI_COLORS.warning,
      backgroundColor: KRISHI_COLORS.warningBg,
    };
  }

  return {
    textColor: KRISHI_COLORS.brandGreenLight,
    borderColor: KRISHI_COLORS.brandGreenLight,
    backgroundColor: '#E9FAEF',
  };
}
