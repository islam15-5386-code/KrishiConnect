import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../src/store';
import { addToQueue } from '../../src/store/slices/offlineQueueSlice';
import { apiClient, uploadWithImages } from '../../src/lib/apiClient';
import NetInfo from '@react-native-community/netinfo';

const CROP_TYPES = [
  { icon: '🌾', label: 'ধান' },
  { icon: '🌿', label: 'পাট' },
  { icon: '🥦', label: 'সবজি' },
  { icon: '🐟', label: 'মাছ' },
  { icon: '🍎', label: 'ফল' },
  { icon: '🌱', label: 'অন্যান্য' },
];

const GRADES = [
  { grade: 'A', label: 'প্রিমিয়াম', desc: 'সর্বোচ্চ মানের ফসল', color: '#059669' },
  { grade: 'B', label: 'স্ট্যান্ডার্ড', desc: 'ভালো মানের ফসল',   color: '#2563eb' },
  { grade: 'C', label: 'ইকোনমি',    desc: 'সাধারণ মানের ফসল',  color: '#d97706' },
];

export default function CropListingScreen() {
  const router   = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const [cropType,   setCropType]   = useState('');
  const [quantity,   setQuantity]   = useState('');
  const [grade,      setGrade]      = useState('');
  const [price,      setPrice]      = useState('');
  const [district,   setDistrict]   = useState('');
  const [harvest,    setHarvest]    = useState('');
  const [desc,       setDesc]       = useState('');
  const [benchmark,  setBenchmark]  = useState<{ price_bdt_per_kg: number } | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [bLoading,   setBLoading]   = useState(false);

  // Fetch market benchmark price when crop type changes
  useEffect(() => {
    if (!cropType || !district) return;
    const fetchBenchmark = async () => {
      setBLoading(true);
      try {
        const res = await apiClient.get(`/v1/prices/${encodeURIComponent(cropType)}`, {
          params: { district },
        });
        setBenchmark(res.data.data);
      } catch { setBenchmark(null); }
      setBLoading(false);
    };
    fetchBenchmark();
  }, [cropType, district]);

  const priceDiff = benchmark && price
    ? parseFloat(price) - benchmark.price_bdt_per_kg
    : null;

  const handleSubmit = async () => {
    if (!cropType)   { Alert.alert('', 'ফসলের ধরন নির্বাচন করুন।');     return; }
    if (!quantity)   { Alert.alert('', 'পরিমাণ (কেজি) দিন।');           return; }
    if (!grade)      { Alert.alert('', 'মান (A/B/C) নির্বাচন করুন।');   return; }
    if (!price)      { Alert.alert('', 'চাহিদা মূল্য দিন।');            return; }

    setLoading(true);
    try {
      const netState = await NetInfo.fetch();
      const isOnline = netState.isConnected && netState.isInternetReachable;

      const payload = {
        crop_type:         cropType,
        quantity_kg:       quantity,
        quality_grade:     grade,
        asking_price_bdt:  price,
        location_district: district,
        harvest_date:      harvest || undefined,
        description:       desc || undefined,
      };

      if (isOnline) {
        await apiClient.post('/v1/crop-listings', payload);
        Alert.alert('সফল! 🌾', 'আপনার ফসলের তালিকা প্রকাশিত হয়েছে।', [
          { text: 'ঠিক আছে', onPress: () => router.back() },
        ]);
      } else {
        dispatch(addToQueue({ endpoint: '/v1/crop-listings', method: 'POST', data: payload }));
        Alert.alert('অফলাইনে সংরক্ষিত 📥', 'ইন্টারনেট পেলে স্বয়ংক্রিয়ভাবে প্রকাশিত হবে।', [
          { text: 'ঠিক আছে', onPress: () => router.back() },
        ]);
      }
    } catch (e: any) {
      Alert.alert('সমস্যা হয়েছে', e?.response?.data?.message ?? 'আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>ফসল বিক্রির তালিকা</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Crop Type */}
        <Text style={s.label}>ফসলের ধরন *</Text>
        <View style={s.cropGrid}>
          {CROP_TYPES.map((c) => (
            <TouchableOpacity
              key={c.label}
              style={[s.cropCard, cropType === c.label && s.cropSelected]}
              onPress={() => setCropType(c.label)}
            >
              <Text style={s.cropIcon}>{c.icon}</Text>
              <Text style={[s.cropLabel, cropType === c.label && { color: '#1D9E75' }]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* District (for benchmark lookup) */}
        <Text style={s.label}>জেলা *</Text>
        <TextInput style={s.input} placeholder="আপনার জেলা" placeholderTextColor="#aaa" value={district} onChangeText={setDistrict} />

        {/* Quantity */}
        <Text style={s.label}>পরিমাণ (কেজি) *</Text>
        <TextInput style={s.input} placeholder="যেমন: 500" placeholderTextColor="#aaa" keyboardType="numeric" value={quantity} onChangeText={setQuantity} />

        {/* Quality Grade */}
        <Text style={s.label}>মানের স্তর *</Text>
        <View style={s.gradeRow}>
          {GRADES.map((g) => (
            <TouchableOpacity
              key={g.grade}
              style={[s.gradeCard, grade === g.grade && { borderColor: g.color, backgroundColor: g.color + '15' }]}
              onPress={() => setGrade(g.grade)}
            >
              <Text style={[s.gradeGrade, { color: g.color }]}>{g.grade}</Text>
              <Text style={s.gradeLabel}>{g.label}</Text>
              <Text style={s.gradeDesc}>{g.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Asking Price */}
        <Text style={s.label}>চাহিদা মূল্য (৳/কেজি) *</Text>
        <TextInput style={s.input} placeholder="যেমন: 35" placeholderTextColor="#aaa" keyboardType="numeric" value={price} onChangeText={setPrice} />

        {/* Market Benchmark */}
        {bLoading && <ActivityIndicator size="small" color="#1D9E75" style={{ marginBottom: 12 }} />}
        {benchmark && price ? (
          <View style={[s.benchmarkCard, { borderLeftColor: priceDiff! >= 0 ? '#10b981' : '#ef4444' }]}>
            <Text style={s.benchmarkTitle}>বাজার দরের সাথে তুলনা</Text>
            <Text style={s.benchmarkVal}>বাজার দর: ৳{benchmark.price_bdt_per_kg}/কেজি</Text>
            <Text style={[s.benchmarkDiff, { color: priceDiff! >= 0 ? '#10b981' : '#ef4444' }]}>
              {priceDiff! >= 0 ? '▲' : '▼'} {Math.abs(priceDiff!).toFixed(2)} টাকা {priceDiff! >= 0 ? 'বেশি' : 'কম'}
            </Text>
          </View>
        ) : null}

        {/* Harvest Date */}
        <Text style={s.label}>ফসল কাটার তারিখ</Text>
        <TextInput style={s.input} placeholder="YYYY-MM-DD" placeholderTextColor="#aaa" value={harvest} onChangeText={setHarvest} />

        {/* Description */}
        <Text style={s.label}>বিস্তারিত</Text>
        <TextInput style={[s.input, { height: 90, textAlignVertical: 'top', paddingTop: 12 }]} placeholder="অতিরিক্ত তথ্য..." placeholderTextColor="#aaa" multiline value={desc} onChangeText={setDesc} />

        <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.submitText}>তালিকা প্রকাশ করুন 🌾</Text>
          }
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#f7f9f7' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  backIcon:      { fontSize: 18, color: '#1a1a1a' },
  headerTitle:   { fontFamily: 'NotoSansBengali-Bold', fontSize: 18, color: '#1a1a1a' },
  scroll:        { padding: 20 },
  label:         { fontFamily: 'NotoSansBengali-Bold', fontSize: 15, color: '#1a1a1a', marginBottom: 10, marginTop: 6 },
  input:         { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e0e0e0', paddingHorizontal: 16, paddingVertical: 14, fontFamily: 'NotoSansBengali', fontSize: 15, color: '#1a1a1a', marginBottom: 20 },
  cropGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  cropCard:      { width: '30%', backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#e0e0e0' },
  cropSelected:  { borderColor: '#1D9E75', backgroundColor: '#f0faf6' },
  cropIcon:      { fontSize: 30, marginBottom: 6 },
  cropLabel:     { fontFamily: 'NotoSansBengali-SemiBold', fontSize: 13, color: '#555' },
  gradeRow:      { flexDirection: 'row', gap: 10, marginBottom: 24 },
  gradeCard:     { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#e0e0e0' },
  gradeGrade:    { fontFamily: 'NotoSansBengali-Bold', fontSize: 24, marginBottom: 4 },
  gradeLabel:    { fontFamily: 'NotoSansBengali-Bold', fontSize: 13, color: '#1a1a1a' },
  gradeDesc:     { fontFamily: 'NotoSansBengali', fontSize: 11, color: '#888', textAlign: 'center', marginTop: 2 },
  benchmarkCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderLeftWidth: 4, marginBottom: 20 },
  benchmarkTitle:{ fontFamily: 'NotoSansBengali-Bold', fontSize: 14, color: '#1a1a1a', marginBottom: 4 },
  benchmarkVal:  { fontFamily: 'NotoSansBengali', fontSize: 13, color: '#555', marginBottom: 4 },
  benchmarkDiff: { fontFamily: 'NotoSansBengali-Bold', fontSize: 14 },
  submitBtn:     { backgroundColor: '#1D9E75', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  submitText:    { fontFamily: 'NotoSansBengali-Bold', fontSize: 18, color: '#fff' },
});
