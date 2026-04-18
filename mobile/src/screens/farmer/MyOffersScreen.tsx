import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { apiClient } from '../../lib/apiClient';

type OfferItem = {
  id: number;
  listing_id: number;
  company_name: string;
  offered_price_bdt: number;
  asking_price_bdt: number;
  quantity_kg: number;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
};

const diffColor = (offer: OfferItem) => {
  if (offer.offered_price_bdt > offer.asking_price_bdt) return '#1D9E75';
  if (offer.offered_price_bdt < offer.asking_price_bdt) return '#DC2626';
  return '#64748B';
};

export default function MyOffersScreen() {
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<OfferItem | null>(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [actingId, setActingId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await apiClient.get('/v1/farmer/offers');
        const items = (res.data?.data?.data ?? res.data?.data ?? []) as OfferItem[];
        if (mounted) setOffers(items);
      } catch {
        if (mounted) {
          setOffers([
            {
              id: 1,
              listing_id: 1001,
              company_name: 'Green Trade Co.',
              offered_price_bdt: 42,
              asking_price_bdt: 40,
              quantity_kg: 750,
              status: 'pending',
            },
            {
              id: 2,
              listing_id: 1002,
              company_name: 'Agri BD Ltd',
              offered_price_bdt: 36,
              asking_price_bdt: 39,
              quantity_kg: 500,
              status: 'pending',
            },
          ]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const submitAction = async (offer: OfferItem, action: 'accept' | 'reject' | 'counter', customPrice?: string) => {
    try {
      setActingId(offer.id);
      const payload: Record<string, unknown> = { action };
      if (action === 'counter' && customPrice) payload.counter_price_bdt = Number(customPrice);

      await apiClient.post(`/v1/crop-listings/${offer.listing_id}/offers/${offer.id}/respond`, payload);

      setOffers((prev) =>
        prev.map((item) => (item.id === offer.id ? { ...item, status: action === 'counter' ? 'countered' : (action === 'accept' ? 'accepted' : 'rejected') } : item))
      );
    } catch {
      Alert.alert('ত্রুটি', 'পরে আবার চেষ্টা করুন।');
    } finally {
      setActingId(null);
    }
  };

  const openCounter = (offer: OfferItem) => {
    setSelectedOffer(offer);
    setCounterPrice(offer.asking_price_bdt.toString());
    setCounterModalOpen(true);
  };

  const renderCard = ({ item }: { item: OfferItem }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.company}>{item.company_name}</Text>
        <Text style={[styles.diff, { color: diffColor(item) }]}>৳{item.offered_price_bdt} / ৳{item.asking_price_bdt}</Text>
      </View>

      <Text style={styles.meta}>পরিমাণ: {item.quantity_kg} কেজি</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.accept]} onPress={() => submitAction(item, 'accept')}>
          {actingId === item.id ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>গ্রহণ</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.counter]} onPress={() => openCounter(item)}>
          <Text style={styles.btnText}>কাউন্টার</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.reject]} onPress={() => submitAction(item, 'reject')}>
          <Text style={styles.btnText}>না</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const pendingOffers = useMemo(() => offers.filter((o) => o.status === 'pending' || o.status === 'countered'), [offers]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>আমার অফার</Text>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#1D9E75" />
        </View>
      ) : (
        <FlatList
          data={pendingOffers}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={renderCard}
          ListEmptyComponent={<Text style={styles.empty}>এখনো কোনো অফার আসেনি।</Text>}
        />
      )}

      <Modal transparent animationType="slide" visible={counterModalOpen} onRequestClose={() => setCounterModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>কাউন্টার অফার দিন</Text>
            <TextInput
              keyboardType="numeric"
              value={counterPrice}
              onChangeText={setCounterPrice}
              style={styles.modalInput}
              placeholder="৳"
              placeholderTextColor="#94A3B8"
            />

            <TouchableOpacity
              style={styles.modalSubmit}
              onPress={() => {
                if (!selectedOffer || !counterPrice) {
                  setCounterModalOpen(false);
                  return;
                }
                submitAction(selectedOffer, 'counter', counterPrice);
                setCounterModalOpen(false);
              }}
            >
              <Text style={styles.modalSubmitText}>পাঠান</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7F3' },
  header: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#FFFFFF' },
  title: { fontFamily: 'NotoSansBengali_700Bold', fontSize: 24, color: '#133B31' },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 14, gap: 10 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1EDE6',
    padding: 14,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  company: { fontFamily: 'NotoSansBengali_700Bold', color: '#1A3D34', fontSize: 17 },
  diff: { fontFamily: 'NotoSansBengali_700Bold', fontSize: 16 },
  meta: { marginTop: 6, fontFamily: 'NotoSansBengali_400Regular', color: '#5D726A', fontSize: 13 },
  actions: { marginTop: 12, flexDirection: 'row', gap: 8 },
  btn: { flex: 1, borderRadius: 12, alignItems: 'center', paddingVertical: 10 },
  accept: { backgroundColor: '#1D9E75' },
  counter: { backgroundColor: '#EF9F27' },
  reject: { backgroundColor: '#DC2626' },
  btnText: { color: '#FFFFFF', fontFamily: 'NotoSansBengali_700Bold', fontSize: 13 },
  empty: { textAlign: 'center', marginTop: 80, color: '#64748B', fontFamily: 'NotoSansBengali_500Medium', fontSize: 16 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(2, 20, 14, 0.35)' },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  modalHandle: {
    width: 60,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontFamily: 'NotoSansBengali_700Bold', fontSize: 20, color: '#1A3D34' },
  modalInput: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCEAE3',
    height: 54,
    paddingHorizontal: 14,
    fontFamily: 'NotoSansBengali_500Medium',
    fontSize: 18,
    color: '#1A3D34',
  },
  modalSubmit: {
    marginTop: 14,
    backgroundColor: '#1D9E75',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 14,
  },
  modalSubmitText: { color: '#FFFFFF', fontFamily: 'NotoSansBengali_700Bold', fontSize: 17 },
});
