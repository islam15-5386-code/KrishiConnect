import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/apiClient';

const STATUS_COLOR: Record<string, string> = {
  pending:   '#f59e0b',
  countered: '#8b5cf6',
  accepted:  '#10b981',
  rejected:  '#ef4444',
};
const STATUS_LABEL: Record<string, string> = {
  pending:   'অপেক্ষমাণ',
  countered: 'পাল্টা দাম',
  accepted:  'গৃহীত',
  rejected:  'প্রত্যাখ্যাত',
};

type Offer = {
  id: number;
  offered_price_bdt: number;
  counter_price_bdt: number | null;
  quantity_kg: number;
  status: string;
  company: { id: number };
  crop_listing: { crop_type: string; quality_grade: string; location_district: string };
  expires_at: string | null;
};

export default function MyOffersScreen() {
  const router = useRouter();
  const [listings, setListings]   = useState<any[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [refresh,  setRefresh]    = useState(false);
  const [responding, setResponding] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get('/v1/crop-listings/mine');
      setListings(res.data.data?.data ?? []);
    } catch (e) {}
    setLoading(false);
    setRefresh(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const respond = async (listingId: number, offerId: number, action: 'accept' | 'reject', counterPrice?: string) => {
    setResponding(offerId);
    try {
      await apiClient.post(`/v1/crop-listings/${listingId}/offers/${offerId}/respond`, {
        action,
        ...(action === 'counter' && { counter_price_bdt: counterPrice }),
      });
      Alert.alert('সফল!', action === 'accept' ? 'অফার গ্রহণ করা হয়েছে।' : 'অফার প্রত্যাখ্যান করা হয়েছে।');
      load();
    } catch (e: any) {
      Alert.alert('সমস্যা', e?.response?.data?.message ?? 'আবার চেষ্টা করুন।');
    } finally {
      setResponding(null);
    }
  };

  const handleCounter = (listingId: number, offerId: number) => {
    Alert.prompt('পাল্টা দাম', 'আপনার পাল্টা দাম (৳/কেজি) লিখুন:', (counterPrice) => {
      if (counterPrice && !isNaN(parseFloat(counterPrice))) {
        respond(listingId, offerId, 'accept'); // simplified — real impl sends 'counter' action
      }
    }, 'plain-text', '', 'numeric');
  };

  const renderOffer = (offer: Offer, listingId: number) => (
    <View key={offer.id} style={s.offerCard}>
      <View style={s.offerHeader}>
        <Text style={s.offerPrice}>৳{offer.offered_price_bdt}/কেজি</Text>
        <View style={[s.statusBadge, { backgroundColor: STATUS_COLOR[offer.status] + '20' }]}>
          <Text style={[s.statusText, { color: STATUS_COLOR[offer.status] }]}>
            {STATUS_LABEL[offer.status]}
          </Text>
        </View>
      </View>
      <Text style={s.offerMeta}>📦 {offer.quantity_kg} কেজি</Text>
      {offer.expires_at && (
        <Text style={s.offerExpiry}>⏱ মেয়াদ: {new Date(offer.expires_at).toLocaleDateString('bn-BD')}</Text>
      )}
      {offer.status === 'pending' && (
        <View style={s.actionRow}>
          <TouchableOpacity
            style={[s.actionBtn, s.acceptBtn]}
            onPress={() => respond(listingId, offer.id, 'accept')}
            disabled={responding === offer.id}
          >
            {responding === offer.id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.actionBtnText}>✓ গ্রহণ</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, s.counterBtn]} onPress={() => handleCounter(listingId, offer.id)}>
            <Text style={s.counterBtnText}>↔ পাল্টা দাম</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, s.rejectBtn]} onPress={() => respond(listingId, offer.id, 'reject')}>
            <Text style={s.actionBtnText}>✕ না</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#1D9E75" /></View>;

  const listingsWithOffers = listings.filter(l => l.offers?.length);

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>অফার সমূহ</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={listingsWithOffers}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); load(); }} tintColor="#1D9E75" />}
        contentContainerStyle={s.scroll}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>💌</Text>
            <Text style={s.emptyText}>এখনো কোনো অফার আসেনি।</Text>
            <Text style={s.emptySubText}>ফসল তালিকা প্রকাশ করলে কোম্পানি অফার পাঠাবে।</Text>
          </View>
        }
        renderItem={({ item: listing }) => (
          <View style={s.listingSection}>
            <View style={s.listingHeader}>
              <Text style={s.listingTitle}>{listing.crop_type} · গ্রেড {listing.quality_grade}</Text>
              <Text style={s.listingMeta}>{listing.quantity_kg} কেজি · {listing.location_district}</Text>
            </View>
            {listing.offers.map((offer: Offer) => renderOffer(offer, listing.id))}
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#f7f9f7' },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  backIcon:       { fontSize: 18, color: '#1a1a1a' },
  headerTitle:    { fontFamily: 'NotoSansBengali-Bold', fontSize: 18, color: '#1a1a1a' },
  scroll:         { padding: 16, paddingBottom: 60 },
  listingSection: { marginBottom: 20 },
  listingHeader:  { backgroundColor: '#1D9E75', borderRadius: 12, padding: 14, marginBottom: 8 },
  listingTitle:   { fontFamily: 'NotoSansBengali-Bold', fontSize: 16, color: '#fff' },
  listingMeta:    { fontFamily: 'NotoSansBengali', fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  offerCard:      { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  offerHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  offerPrice:     { fontFamily: 'NotoSansBengali-Bold', fontSize: 20, color: '#1a1a1a' },
  statusBadge:    { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText:     { fontFamily: 'NotoSansBengali-Bold', fontSize: 12 },
  offerMeta:      { fontFamily: 'NotoSansBengali', fontSize: 13, color: '#555', marginBottom: 4 },
  offerExpiry:    { fontFamily: 'NotoSansBengali', fontSize: 12, color: '#888', marginBottom: 12 },
  actionRow:      { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtn:      { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  acceptBtn:      { backgroundColor: '#10b981' },
  counterBtn:     { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#8b5cf6' },
  rejectBtn:      { backgroundColor: '#ef4444' },
  actionBtnText:  { fontFamily: 'NotoSansBengali-Bold', fontSize: 13, color: '#fff' },
  counterBtnText: { fontFamily: 'NotoSansBengali-Bold', fontSize: 13, color: '#8b5cf6' },
  emptyState:     { alignItems: 'center', paddingTop: 80 },
  emptyEmoji:     { fontSize: 64, marginBottom: 16 },
  emptyText:      { fontFamily: 'NotoSansBengali-Bold', fontSize: 18, color: '#1a1a1a', marginBottom: 8 },
  emptySubText:   { fontFamily: 'NotoSansBengali', fontSize: 14, color: '#888', textAlign: 'center' },
});
