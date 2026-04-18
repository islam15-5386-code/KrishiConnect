import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import BanglaText from '../../components/BanglaText';
import { KRISHI_BORDER, KRISHI_COLORS, KRISHI_RADIUS, KRISHI_SPACING } from '../../theme/krishiTheme';
import { RootStackParamList } from '../../navigation/AppNavigator';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.centerWrap}>
        <View style={styles.logoRing}>
          <View style={styles.leaf} />
          <View style={styles.leafStem} />
        </View>

        <Text style={styles.brand}>KRISHI</Text>
        <BanglaText style={styles.subtitle}>কৃষি সংযোগ</BanglaText>
        <Text style={styles.tagline}>FROM FARM TO FUTURE</Text>
      </View>

      <View style={styles.bottomWrap}>
        <TouchableOpacity style={styles.cta} onPress={() => navigation.replace('OTPLogin')}>
          <BanglaText medium style={styles.ctaLabel}>শুরু করুন</BanglaText>
        </TouchableOpacity>

        <View style={styles.dotRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KRISHI_COLORS.backgroundPrimary,
    paddingHorizontal: KRISHI_SPACING.xl,
    paddingBottom: KRISHI_SPACING.xl,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.06,
  },
  logoRing: {
    width: width * 0.28,
    height: width * 0.28,
    borderRadius: (width * 0.28) / 2,
    borderWidth: 2,
    borderColor: KRISHI_COLORS.brandGreenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaf: {
    width: width * 0.085,
    height: width * 0.12,
    backgroundColor: KRISHI_COLORS.brandGreenLight,
    borderTopLeftRadius: 40,
    borderBottomRightRadius: 40,
    transform: [{ rotate: '-35deg' }],
  },
  leafStem: {
    width: 2,
    height: 18,
    backgroundColor: KRISHI_COLORS.brandGreenLight,
    marginTop: 4,
  },
  brand: {
    marginTop: KRISHI_SPACING.lg,
    color: KRISHI_COLORS.textOnDark,
    fontSize: 28,
    fontFamily: 'NotoSansBengali_500Medium',
    fontWeight: '500',
    letterSpacing: 2.8,
  },
  subtitle: {
    marginTop: KRISHI_SPACING.sm,
    color: KRISHI_COLORS.textMutedDark,
    fontSize: 16,
  },
  tagline: {
    marginTop: KRISHI_SPACING.sm,
    color: KRISHI_COLORS.darkSoft,
    fontSize: 10,
    fontFamily: 'NotoSansBengali_400Regular',
    letterSpacing: 1.4,
  },
  bottomWrap: {
    alignItems: 'center',
    gap: KRISHI_SPACING.md,
  },
  cta: {
    width: width * 0.72,
    backgroundColor: KRISHI_COLORS.accentYellow,
    borderRadius: KRISHI_RADIUS.pill,
    borderWidth: KRISHI_BORDER.thick,
    borderColor: '#C8A027',
    paddingVertical: KRISHI_SPACING.md,
    alignItems: 'center',
  },
  ctaLabel: {
    color: KRISHI_COLORS.textOnWhite,
    fontSize: 16,
  },
  dotRow: {
    flexDirection: 'row',
    gap: KRISHI_SPACING.sm,
    marginBottom: KRISHI_SPACING.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E6A2E',
  },
  dotActive: {
    backgroundColor: KRISHI_COLORS.brandGreenLight,
    width: 18,
  },
});
