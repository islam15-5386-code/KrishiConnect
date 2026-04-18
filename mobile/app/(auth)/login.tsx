import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated, Alert, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { sendOtp, verifyOtp, clearError } from '../../src/store/slices/authSlice';
import { AppDispatch, RootState } from '../../src/store';

type Step = 'phone' | 'otp';

export default function LoginScreen() {
  const router    = useRouter();
  const dispatch  = useDispatch<AppDispatch>();
  const { loading, error, otpSent } = useSelector((s: RootState) => s.auth);

  const [step, setStep]     = useState<Step>('phone');
  const [phone, setPhone]   = useState('');
  const [otp, setOtp]       = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef<Array<TextInput | null>>([null, null, null, null, null, null]);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Show error alerts
  useEffect(() => {
    if (error) {
      Alert.alert('সমস্যা হয়েছে', error, [{ text: 'ঠিক আছে', onPress: () => dispatch(clearError()) }]);
    }
  }, [error]);

  const handleSendOtp = async () => {
    if (phone.length < 11) {
      Alert.alert('', 'সঠিক মোবাইল নম্বর দিন।');
      return;
    }
    const result = await dispatch(sendOtp(phone));
    if (sendOtp.fulfilled.match(result)) {
      setStep('otp');
      setCountdown(60);
      Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true }).start();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      Alert.alert('', '৬ সংখ্যার OTP দিন।');
      return;
    }
    const result = await dispatch(verifyOtp({ phoneNumber: phone, code }));
    if (verifyOtp.fulfilled.match(result)) {
      // Auth guard in App.tsx will handle routing automatically
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (!value && index > 0) otpRefs.current[index - 1]?.focus();
  };

  return (
    <LinearGradient colors={['#0f5c3d', '#1D9E75', '#34d399']} style={s.gradient}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        {/* Logo */}
        <View style={s.logoArea}>
          <Text style={s.logoEmoji}>🌾</Text>
          <Text style={s.logoTitle}>কৃষি সংযোগ</Text>
          <Text style={s.logoSub}>KrishiConnect</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          {step === 'phone' ? (
            <>
              <Text style={s.cardTitle}>মোবাইল নম্বর দিন</Text>
              <Text style={s.cardSub}>আপনার নম্বরে একটি OTP যাবে</Text>
              <View style={s.phoneRow}>
                <View style={s.countryCode}><Text style={s.countryText}>🇧🇩 +880</Text></View>
                <TextInput
                  style={s.phoneInput}
                  placeholder="01XXXXXXXXX"
                  placeholderTextColor="#aaa"
                  keyboardType="phone-pad"
                  maxLength={11}
                  value={phone}
                  onChangeText={setPhone}
                  autoFocus
                />
              </View>
              <TouchableOpacity style={s.primaryBtn} onPress={handleSendOtp} disabled={loading}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.primaryBtnText}>OTP পাঠান →</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.cardTitle}>OTP যাচাই করুন</Text>
              <Text style={s.cardSub}>{phone} নম্বরে পাঠানো ৬ সংখ্যার কোড দিন</Text>

              {/* Six digit OTP boxes */}
              <View style={s.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={(ref) => (otpRefs.current[i] = ref)}
                    style={[s.otpBox, digit && s.otpBoxFilled]}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={(v) => handleOtpChange(v, i)}
                    selectionColor="#1D9E75"
                  />
                ))}
              </View>

              <TouchableOpacity style={s.primaryBtn} onPress={handleVerifyOtp} disabled={loading}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.primaryBtnText}>যাচাই করুন ✓</Text>}
              </TouchableOpacity>

              {/* Resend countdown */}
              <TouchableOpacity
                onPress={handleSendOtp}
                disabled={countdown > 0}
                style={s.resendBtn}
              >
                <Text style={[s.resendText, countdown > 0 && s.resendDisabled]}>
                  {countdown > 0 ? `পুনরায় পাঠান (${countdown}s)` : 'পুনরায় OTP পাঠান'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep('phone')} style={s.backBtn}>
                <Text style={s.backText}>← নম্বর পরিবর্তন</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient:      { flex: 1 },
  flex:          { flex: 1, justifyContent: 'flex-end', padding: 20 },
  logoArea:      { alignItems: 'center', paddingBottom: 48 },
  logoEmoji:     { fontSize: 64 },
  logoTitle:     { fontFamily: 'NotoSansBengali-Bold', fontSize: 32, color: '#fff', marginTop: 12 },
  logoSub:       { fontFamily: 'NotoSansBengali', fontSize: 16, color: 'rgba(255,255,255,0.7)', letterSpacing: 2 },
  card:          { backgroundColor: '#fff', borderRadius: 28, padding: 28, paddingBottom: 40, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  cardTitle:     { fontFamily: 'NotoSansBengali-Bold', fontSize: 22, color: '#1a1a1a', marginBottom: 6 },
  cardSub:       { fontFamily: 'NotoSansBengali', fontSize: 14, color: '#666', marginBottom: 24 },
  phoneRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  countryCode:   { backgroundColor: '#f0faf6', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 16, borderWidth: 1, borderColor: '#cde8dc' },
  countryText:   { fontFamily: 'NotoSansBengali', fontSize: 14, color: '#1D9E75' },
  phoneInput:    { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0', paddingHorizontal: 16, paddingVertical: 16, fontFamily: 'NotoSansBengali', fontSize: 18, color: '#1a1a1a' },
  otpRow:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  otpBox:        { width: 46, height: 56, borderRadius: 12, borderWidth: 1.5, borderColor: '#e0e0e0', textAlign: 'center', fontSize: 22, fontFamily: 'NotoSansBengali-Bold', color: '#1a1a1a', backgroundColor: '#fafafa' },
  otpBoxFilled:  { borderColor: '#1D9E75', backgroundColor: '#f0faf6' },
  primaryBtn:    { backgroundColor: '#1D9E75', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  primaryBtnText:{ fontFamily: 'NotoSansBengali-Bold', fontSize: 18, color: '#fff' },
  resendBtn:     { alignItems: 'center', paddingVertical: 8 },
  resendText:    { fontFamily: 'NotoSansBengali', fontSize: 15, color: '#1D9E75' },
  resendDisabled:{ color: '#aaa' },
  backBtn:       { alignItems: 'center', paddingTop: 8 },
  backText:      { fontFamily: 'NotoSansBengali', fontSize: 14, color: '#888' },
});
