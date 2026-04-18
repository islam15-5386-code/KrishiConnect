import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Dimensions, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import BanglaText from '../../components/BanglaText';
import { KRISHI_BORDER, KRISHI_COLORS, KRISHI_RADIUS, KRISHI_SPACING } from '../../theme/krishiTheme';
import { RootStackParamList } from '../../navigation/AppNavigator';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'OTPLogin'>;

export default function OTPLoginScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);

  const formattedTimer = useMemo(() => `পুনরায় পাঠাতে ${String(44).toLocaleString('bn-BD')} সেকেন্ড`, []);

  return (
    <View style={styles.root}>
      <View style={styles.topPanel}>
        <View style={styles.logoRing}>
          <View style={styles.leaf} />
        </View>
        <Text style={styles.brand}>KRISHI</Text>
      </View>

      <View style={styles.bottomCard}>
        <View style={styles.flagRow}>
          <Text style={styles.flag}>🇧🇩</Text>
          <Text style={styles.prefix}>+880</Text>
        </View>

        <BanglaText style={styles.fieldLabel}>মোবাইল নম্বর</BanglaText>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={styles.phoneInput}
          placeholder="আপনার মোবাইল নম্বর লিখুন"
          placeholderTextColor={KRISHI_COLORS.textMutedWhite}
        />

        <BanglaText style={styles.fieldLabel}>ওটিপি</BanglaText>
        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={`otp-${index}`}
              value={digit}
              onChangeText={(value) => {
                const next = [...otp];
                next[index] = value.slice(-1);
                setOtp(next);
              }}
              keyboardType="number-pad"
              maxLength={1}
              style={[styles.otpBox, index === 1 ? styles.otpActive : null]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.confirmBtn} onPress={() => navigation.replace('MainTabs')}>
          <BanglaText medium style={styles.confirmLabel}>নিশ্চিত করুন</BanglaText>
        </TouchableOpacity>

        <BanglaText style={styles.timer}>{formattedTimer}</BanglaText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: KRISHI_COLORS.backgroundPrimary,
  },
  topPanel: {
    height: height * 0.33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRing: {
    width: width * 0.18,
    height: width * 0.18,
    borderRadius: (width * 0.18) / 2,
    borderWidth: KRISHI_BORDER.thick,
    borderColor: KRISHI_COLORS.brandGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaf: {
    width: width * 0.06,
    height: width * 0.08,
    borderTopLeftRadius: 20,
    borderBottomRightRadius: 20,
    backgroundColor: KRISHI_COLORS.brandGreenLight,
    transform: [{ rotate: '-30deg' }],
  },
  brand: {
    marginTop: KRISHI_SPACING.sm,
    color: KRISHI_COLORS.textOnDark,
    fontFamily: 'NotoSansBengali_500Medium',
    fontWeight: '500',
    letterSpacing: 1.4,
    fontSize: 22,
  },
  bottomCard: {
    flex: 1,
    backgroundColor: KRISHI_COLORS.white,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingHorizontal: KRISHI_SPACING.xl,
    paddingTop: KRISHI_SPACING.xl,
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KRISHI_SPACING.sm,
    marginBottom: KRISHI_SPACING.md,
  },
  flag: {
    fontSize: 24,
  },
  prefix: {
    color: KRISHI_COLORS.textOnWhite,
    fontFamily: 'NotoSansBengali_500Medium',
    fontWeight: '500',
    fontSize: 16,
  },
  fieldLabel: {
    color: KRISHI_COLORS.textMutedWhite,
    fontSize: 13,
    marginBottom: KRISHI_SPACING.xs,
  },
  phoneInput: {
    height: 48,
    borderWidth: KRISHI_BORDER.thin,
    borderColor: '#A4CFA4',
    borderRadius: KRISHI_RADIUS.element,
    paddingHorizontal: KRISHI_SPACING.md,
    color: KRISHI_COLORS.textOnWhite,
    marginBottom: KRISHI_SPACING.lg,
    fontFamily: 'NotoSansBengali_400Regular',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: KRISHI_SPACING.lg,
  },
  otpBox: {
    width: 44,
    height: 44,
    borderRadius: KRISHI_RADIUS.element,
    borderWidth: KRISHI_BORDER.thin,
    borderColor: '#BBD7BB',
    textAlign: 'center',
    color: KRISHI_COLORS.textOnWhite,
    fontFamily: 'NotoSansBengali_500Medium',
    fontWeight: '500',
    fontSize: 16,
  },
  otpActive: {
    borderColor: KRISHI_COLORS.brandGreenLight,
    borderWidth: KRISHI_BORDER.thick,
  },
  confirmBtn: {
    borderRadius: KRISHI_RADIUS.pill,
    backgroundColor: KRISHI_COLORS.accentYellow,
    borderWidth: KRISHI_BORDER.thick,
    borderColor: '#CDA42E',
    paddingVertical: KRISHI_SPACING.md,
    alignItems: 'center',
  },
  confirmLabel: {
    color: KRISHI_COLORS.textOnWhite,
    fontSize: 16,
  },
  timer: {
    marginTop: KRISHI_SPACING.md,
    color: KRISHI_COLORS.textMutedWhite,
    textAlign: 'center',
  },
});
