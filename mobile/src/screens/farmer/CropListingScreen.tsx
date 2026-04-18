import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useDispatch } from 'react-redux';

import { AppDispatch } from '../../store';
import { addToQueue, flushOfflineQueue } from '../../store/slices/offlineQueueSlice';
import { apiClient } from '../../lib/apiClient';

const DRAFT_KEY = 'krishi_crop_listing_draft';

const cropOptions = [
  { key: 'ধান', icon: 'sprout' },
  { key: 'পাট', icon: 'leaf' },
  { key: 'সবজি', icon: 'food-apple-outline' },
  { key: 'মাছ', icon: 'fish' },
  { key: 'ফল', icon: 'fruit-cherries' },
  { key: 'অন্যান্য', icon: 'dots-grid' },
];

const gradeInfo = [
  { grade: 'A', note: 'উচ্চ মান', color: '#1D9E75' },
  { grade: 'B', note: 'ভাল মান', color: '#EF9F27' },
  { grade: 'C', note: 'সাধারণ মান', color: '#94A3B8' },
];

export default function CropListingScreen({ navigation }: { navigation: any }) {
  const dispatch = useDispatch<AppDispatch>();

  const [cropType, setCropType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [grade, setGrade] = useState<'A' | 'B' | 'C' | ''>('');
  const [price, setPrice] = useState('');
  const [district, setDistrict] = useState('');
  const [benchmark, setBenchmark] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        setCropType(draft.cropType ?? '');
        setQuantity(draft.quantity ?? '');
        setGrade(draft.grade ?? '');
        setPrice(draft.price ?? '');
        setDistrict(draft.district ?? '');
      }
    })();
  }, []);

  useEffect(() => {
    const draft = JSON.stringify({ cropType, quantity, grade, price, district });
    AsyncStorage.setItem(DRAFT_KEY, draft);
  }, [cropType, quantity, grade, price, district]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        dispatch(flushOfflineQueue());
      }
    });
    return () => unsubscribe();
  }, [dispatch]);

  useEffect(() => {
    if (!cropType || !district) {
      setBenchmark(null);
      return;
    }

    let active = true;
    const loadBenchmark = async () => {
      try {
        const response = await apiClient.get(`/v1/prices/${encodeURIComponent(cropType)}`, { params: { district } });
        const value = Number(response.data?.data?.price_bdt_per_kg ?? response.data?.data?.price ?? 0);
        if (active) setBenchmark(Number.isFinite(value) ? value : null);
      } catch {
        if (active) setBenchmark(null);
      }
    };

    loadBenchmark();
    return () => {
      active = false;
    };
  }, [cropType, district]);

  const diff = useMemo(() => {
    if (!benchmark || !price) return null;
    const p = Number(price);
    if (!Number.isFinite(p)) return null;
    return p - benchmark;
  }, [benchmark, price]);

  const submit = async () => {
    if (!cropType || !quantity || !grade || !price || !district) {
      Alert.alert('তথ্য অসম্পূর্ণ', 'সব প্রয়োজনীয় ঘর পূরণ করুন।');
      return;
    }

    const payload = {
      crop_type: cropType,
      quantity_kg: quantity,
      quality_grade: grade,
      asking_price_bdt: price,
      location_district: district,
      market_benchmark_price: benchmark,
    };

    setLoading(true);
    try {
      const net = await NetInfo.fetch();
      const isOnline = Boolean(net.isConnected && net.isInternetReachable);

      if (isOnline) {
        await apiClient.post('/v1/crop-listings', payload);
      } else {
        dispatch(addToQueue({ endpoint: '/v1/crop-listings', method: 'POST', data: payload, mode: 'json' }));
      }

      await AsyncStorage.removeItem(DRAFT_KEY);
      Alert.alert('সফল', isOnline ? 'ফসল তালিকা প্রকাশিত হয়েছে।' : 'অফলাইনে সংরক্ষিত হয়েছে।');
      navigation.goBack();
    } catch {
      dispatch(addToQueue({ endpoint: '/v1/crop-listings', method: 'POST', data: payload, mode: 'json' }));
      Alert.alert('অফলাইনে রাখা হয়েছে', 'সংযোগ ফিরলে স্বয়ংক্রিয়ভাবে পাঠানো হবে।');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#173B32" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ফসল বিক্রি</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>ফসলের ধরন</Text>
        <View style={styles.grid}>
          {cropOptions.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[styles.cropCard, cropType === c.key && styles.cropCardActive]}
              onPress={() => setCropType(c.key)}
            >
              <MaterialCommunityIcons name={c.icon as any} size={56} color={cropType === c.key ? '#1D9E75' : '#6F827C'} />
              <Text style={[styles.cropText, cropType === c.key && styles.cropTextActive]}>{c.key}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>পরিমাণ (কেজি)</Text>
        <TextInput value={quantity} onChangeText={setQuantity} style={styles.input} keyboardType="numeric" placeholder="যেমন 500" placeholderTextColor="#8EA099" />

        <Text style={styles.sectionTitle}>মান</Text>
        <View style={styles.gradeRow}>
          {gradeInfo.map((g) => (
            <TouchableOpacity key={g.grade} style={[styles.gradeChip, grade === g.grade && { borderColor: g.color, backgroundColor: `${g.color}18` }]} onPress={() => setGrade(g.grade as 'A' | 'B' | 'C')}>
              <Text style={[styles.gradeText, grade === g.grade && { color: g.color }]}>{g.grade}</Text>
              <Text style={styles.gradeNote}>{g.note}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>চাহিদা মূল্য (৳)</Text>
        <TextInput value={price} onChangeText={setPrice} style={styles.input} keyboardType="numeric" placeholder="যেমন 42" placeholderTextColor="#8EA099" />

        <Text style={styles.sectionTitle}>জেলা</Text>
        <TextInput value={district} onChangeText={setDistrict} style={styles.input} placeholder="যেমন: কুমিল্লা" placeholderTextColor="#8EA099" />

        <View style={styles.benchmarkCard}>
          <Text style={styles.benchmarkTitle}>বাজার রেফারেন্স</Text>
          <Text style={styles.benchmarkValue}>{benchmark ? `৳${benchmark.toFixed(2)} / কেজি` : 'তথ্য আসেনি'}</Text>
          {diff !== null && (
            <Text style={[styles.diff, { color: diff >= 0 ? '#1D9E75' : '#EF4444' }]}>
              {diff >= 0 ? 'রেফারেন্সের চেয়ে বেশি' : 'রেফারেন্সের চেয়ে কম'} ({Math.abs(diff).toFixed(2)})
            </Text>
          )}
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>তালিকা দিন</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7F3' },
  header: {
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: { fontFamily: 'NotoSansBengali_700Bold', fontSize: 20, color: '#173B32' },
  content: { padding: 16, paddingBottom: 34 },
  sectionTitle: { fontFamily: 'NotoSansBengali_700Bold', fontSize: 18, color: '#112A24', marginBottom: 10, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cropCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#DFE9E3',
  },
  cropCardActive: { borderColor: '#1D9E75', backgroundColor: '#F0FBF7' },
  cropText: { marginTop: 6, fontFamily: 'NotoSansBengali_500Medium', color: '#5C6F68', fontSize: 13 },
  cropTextActive: { color: '#1D9E75' },
  input: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEAE3',
    fontFamily: 'NotoSansBengali_400Regular',
    color: '#10312A',
    fontSize: 16,
    paddingHorizontal: 14,
  },
  gradeRow: { flexDirection: 'row', gap: 8 },
  gradeChip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCEAE3',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    alignItems: 'center',
  },
  gradeText: { fontFamily: 'NotoSansBengali_700Bold', fontSize: 20, color: '#475B54' },
  gradeNote: { fontFamily: 'NotoSansBengali_400Regular', fontSize: 11, color: '#7A8E87', marginTop: 2 },
  benchmarkCard: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE9E3',
    padding: 14,
  },
  benchmarkTitle: { fontFamily: 'NotoSansBengali_500Medium', color: '#60756D', fontSize: 13 },
  benchmarkValue: { fontFamily: 'NotoSansBengali_700Bold', color: '#334F45', fontSize: 18, marginTop: 4 },
  diff: { marginTop: 6, fontFamily: 'NotoSansBengali_500Medium', fontSize: 13 },
  submitBtn: {
    marginTop: 18,
    backgroundColor: '#1D9E75',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: { color: '#FFFFFF', fontFamily: 'NotoSansBengali_700Bold', fontSize: 18 },
});
