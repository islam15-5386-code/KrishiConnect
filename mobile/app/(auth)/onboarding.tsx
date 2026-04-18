import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  FlatList, Animated, ImageBackground, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors, fonts } from '../../src/theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    headline: 'কৃষি সমস্যার সহজ সমাধান',
    sub: 'ছবি তুলুন, বিশেষজ্ঞ পরামর্শ পান — সরাসরি আপনার মোবাইলে',
    emoji: '🌾',
    bg: ['#0f5c3d', '#1D9E75'],
  },
  {
    id: '2',
    headline: 'সেরা দামে ফসল বিক্রি করুন',
    sub: 'সরাসরি কোম্পানির সাথে দরদাম করুন। মধ্যস্বত্বভোগী ছাড়াই।',
    emoji: '💰',
    bg: ['#7c4f00', '#EF9F27'],
  },
  {
    id: '3',
    headline: 'বাজার দর সবসময় হাতের মুঠোয়',
    sub: 'রিয়েল-টাইম মূল্য, সার-বীজ-কীটনাশক মার্কেটপ্লেস এক জায়গায়।',
    emoji: '📊',
    bg: ['#1a3a5c', '#2563eb'],
  },
];

export default function OnboardingScreen() {
  const router       = useRouter();
  const [current, setCurrent] = useState(0);
  const flatListRef  = useRef<FlatList>(null);
  const fadeAnim     = useRef(new Animated.Value(1)).current;

  const goNext = () => {
    if (current < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: current + 1, animated: true });
      setCurrent(current + 1);
    } else {
      router.replace('/(auth)/login');
    }
  };

  const skip = () => router.replace('/(auth)/login');

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LinearGradient colors={item.bg as any} style={s.slide}>
            {/* Decorative crop photo overlay */}
            <View style={s.emojiContainer}>
              <Text style={s.emoji}>{item.emoji}</Text>
            </View>
            <View style={s.textBlock}>
              <Text style={s.headline}>{item.headline}</Text>
              <Text style={s.sub}>{item.sub}</Text>
            </View>
          </LinearGradient>
        )}
      />

      {/* Dot Indicators */}
      <View style={s.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[s.dot, i === current && s.dotActive]}
          />
        ))}
      </View>

      {/* Navigation Buttons */}
      <View style={s.btnRow}>
        {current < SLIDES.length - 1 ? (
          <>
            <TouchableOpacity onPress={skip} style={s.skipBtn}>
              <Text style={s.skipText}>এড়িয়ে যান</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goNext} style={s.nextBtn}>
              <Text style={s.nextText}>পরবর্তী →</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={goNext} style={s.startBtn}>
            <Text style={s.startText}>শুরু করুন 🌱</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#1D9E75' },
  slide:         { width, height, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emojiContainer:{ width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  emoji:         { fontSize: 80 },
  textBlock:     { alignItems: 'center' },
  headline:      { fontFamily: 'NotoSansBengali-Bold', fontSize: 26, color: '#fff', textAlign: 'center', lineHeight: 38, marginBottom: 16 },
  sub:           { fontFamily: 'NotoSansBengali', fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 26 },
  dotsRow:       { position: 'absolute', bottom: 140, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive:     { width: 24, backgroundColor: '#fff' },
  btnRow:        { position: 'absolute', bottom: 52, left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skipBtn:       { padding: 12 },
  skipText:      { fontFamily: 'NotoSansBengali', fontSize: 16, color: 'rgba(255,255,255,0.7)' },
  nextBtn:       { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 30, paddingHorizontal: 28, paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  nextText:      { fontFamily: 'NotoSansBengali-Bold', fontSize: 16, color: '#fff' },
  startBtn:      { flex: 1, backgroundColor: '#fff', borderRadius: 30, paddingVertical: 16, alignItems: 'center' },
  startText:     { fontFamily: 'NotoSansBengali-Bold', fontSize: 18, color: '#1D9E75' },
});
