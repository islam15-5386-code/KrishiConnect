import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, RefreshControl,
  ScrollView, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/apiClient';

const STATUS_COLOR: Record<string, string> = {
  assigned:  '#3b82f6',
  escalated: '#ef4444',
  resolved:  '#10b981',
};
const STATUS_LABEL: Record<string, string> = {
  assigned:  'নির্ধারিত',
  escalated: 'এসকালেটেড',
  resolved:  'সমাধান হয়েছে',
};

type Ticket = {
  id: number; title: string; crop_type: string; district: string;
  status: string; assigned_at: string;
  farmer: { farmerProfile: { full_name: string; district: string } };
  images: { image_url: string }[];
  responses: any[];
};

export default function OfficerDashboardScreen() {
  const router = useRouter();
  const [tickets,   setTickets]   = useState<Ticket[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refresh,   setRefresh]   = useState(false);
  const [filter,    setFilter]    = useState<'all' | 'assigned' | 'escalated'>('all');
  const [selected,  setSelected]  = useState<Ticket | null>(null);
  const [response,  setResponse]  = useState('');
  const [products,  setProducts]  = useState('');
  const [timeline,  setTimeline]  = useState('');
  const [submitting,setSubmitting]= useState(false);

  const load = useCallback(async () => {
    try {
      const params: any = {};
      if (filter !== 'all') params.status = filter;
      const res = await apiClient.get('/v1/officer/tickets', { params });
      setTickets(res.data.data?.data ?? []);
    } catch {}
    setLoading(false);
    setRefresh(false);
  }, [filter]);

  useEffect(() => { setLoading(true); load(); }, [filter]);

  const submitResponse = async () => {
    if (!selected) return;
    if (!response.trim() || response.length < 30) {
      Alert.alert('', 'পরামর্শ কমপক্ষে ৩০ অক্ষরের হতে হবে।');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post(`/v1/officer/tickets/${selected.id}/respond`, {
        response_text:       response,
        recommended_products: products ? [{ name: products }] : [],
        resolution_timeline: timeline || null,
      });
      Alert.alert('সফল! ✅', 'পরামর্শ পাঠানো হয়েছে। কৃষককে জানানো হয়েছে।');
      setSelected(null);
      setResponse('');
      setProducts('');
      setTimeline('');
      load();
    } catch (e: any) {
      Alert.alert('সমস্যা', e?.response?.data?.message ?? 'আবার চেষ্টা করুন।');
    } finally { setSubmitting(false); }
  };

  const assignedCount  = tickets.filter(t => t.status === 'assigned').length;
  const escalatedCount = tickets.filter(t => t.status === 'escalated').length;
  const resolvedCount  = tickets.filter(t => t.status === 'resolved').length;

  // Response Modal
  if (selected) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.root}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setSelected(null)} style={s.backBtn}>
            <Text style={s.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>পরামর্শ দিন</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={s.scroll}>
          {/* Ticket Summary */}
          <View style={s.ticketSummary}>
            <Text style={s.summaryTitle}>{selected.title}</Text>
            <Text style={s.summaryMeta}>
              🌿 {selected.crop_type} · 👤 {selected.farmer?.farmerProfile?.full_name} · 📍 {selected.district}
            </Text>
            {selected.images.length > 0 && (
              <Text style={s.imagesNote}>📸 {selected.images.length}টি ছবি সংযুক্ত</Text>
            )}
          </View>

          <Text style={s.label}>পরামর্শ / সমাধান *</Text>
          <TextInput
            style={[s.input, { height: 160, textAlignVertical: 'top', paddingTop: 14 }]}
            placeholder="কৃষকের সমস্যার বিস্তারিত সমাধান লিখুন। কীটনাশক, সার, চাষ পদ্ধতি ইত্যাদি উল্লেখ করুন।"
            placeholderTextColor="#aaa"
            multiline
            value={response}
            onChangeText={setResponse}
          />

          <Text style={s.label}>প্রস্তাবিত পণ্য (ঐচ্ছিক)</Text>
          <TextInput
            style={s.input}
            placeholder="যেমন: ডায়াজিনন ৬০ EC, ইউরিয়া সার"
            placeholderTextColor="#aaa"
            value={products}
            onChangeText={setProducts}
          />

          <Text style={s.label}>সমাধানের সময়কাল (ঐচ্ছিক)</Text>
          <TextInput
            style={s.input}
            placeholder="যেমন: ৭-১০ দিন"
            placeholderTextColor="#aaa"
            value={timeline}
            onChangeText={setTimeline}
          />

          <TouchableOpacity style={s.submitBtn} onPress={submitResponse} disabled={submitting}>
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.submitText}>পরামর্শ পাঠান ✓</Text>
            }
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      {/* Stats Header */}
      <View style={s.statsHeader}>
        <Text style={s.statsTitle}>কৃষি কর্মকর্তা ড্যাশবোর্ড</Text>
        <View style={s.statsRow}>
          {[
            { label: 'নির্ধারিত', count: assignedCount,  color: '#3b82f6' },
            { label: 'এসকালেটেড', count: escalatedCount, color: '#ef4444' },
            { label: 'সমাধান',   count: resolvedCount,  color: '#10b981' },
          ].map((stat) => (
            <View key={stat.label} style={s.statCard}>
              <Text style={[s.statCount, { color: stat.color }]}>{stat.count}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={s.filterRow}>
        {(['all', 'assigned', 'escalated'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[s.filterTab, filter === f && s.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>
              {f === 'all' ? 'সব' : f === 'assigned' ? 'নির্ধারিত' : 'এসকালেটেড'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Ticket List */}
      {loading
        ? <ActivityIndicator size="large" color="#1D9E75" style={{ marginTop: 60 }} />
        : (
          <FlatList
            data={tickets}
            keyExtractor={(t) => String(t.id)}
            contentContainerStyle={s.list}
            refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); load(); }} tintColor="#1D9E75" />}
            ListEmptyComponent={
              <View style={s.emptyState}>
                <Text style={s.emptyEmoji}>✅</Text>
                <Text style={s.emptyText}>কোনো সক্রিয় টিকিট নেই।</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.card, item.status === 'escalated' && s.cardEscalated]}
                onPress={() => item.responses.length === 0 ? setSelected(item) : null}
                activeOpacity={0.85}
              >
                <View style={s.cardTop}>
                  <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={[s.badge, { backgroundColor: STATUS_COLOR[item.status] + '20' }]}>
                    <Text style={[s.badgeText, { color: STATUS_COLOR[item.status] }]}>
                      {STATUS_LABEL[item.status]}
                    </Text>
                  </View>
                </View>
                <Text style={s.cardMeta}>👤 {item.farmer?.farmerProfile?.full_name}</Text>
                <Text style={s.cardMeta}>🌿 {item.crop_type} · 📍 {item.district}</Text>
                {item.images.length > 0 && (
                  <Text style={s.cardImgNote}>📸 {item.images.length} ছবি</Text>
                )}
                {item.responses.length === 0 && item.status !== 'resolved' && (
                  <View style={s.respondBtn}>
                    <Text style={s.respondText}>পরামর্শ দিন →</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        )
      }
    </View>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#f7f9f7' },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backBtn:         { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  backIcon:        { fontSize: 18, color: '#1a1a1a' },
  headerTitle:     { fontFamily: 'NotoSansBengali-Bold', fontSize: 18, color: '#1a1a1a' },
  statsHeader:     { backgroundColor: '#1D9E75', paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 },
  statsTitle:      { fontFamily: 'NotoSansBengali-Bold', fontSize: 20, color: '#fff', marginBottom: 16 },
  statsRow:        { flexDirection: 'row', gap: 12 },
  statCard:        { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 14, alignItems: 'center' },
  statCount:       { fontFamily: 'NotoSansBengali-Bold', fontSize: 28, marginBottom: 4 },
  statLabel:       { fontFamily: 'NotoSansBengali', fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  filterRow:       { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  filterTab:       { flex: 1, paddingVertical: 14, alignItems: 'center' },
  filterTabActive: { borderBottomWidth: 2, borderBottomColor: '#1D9E75' },
  filterText:      { fontFamily: 'NotoSansBengali', fontSize: 14, color: '#888' },
  filterTextActive:{ fontFamily: 'NotoSansBengali-Bold', color: '#1D9E75' },
  list:            { padding: 16, paddingBottom: 80 },
  card:            { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  cardEscalated:   { borderLeftWidth: 3, borderLeftColor: '#ef4444' },
  cardTop:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle:       { fontFamily: 'NotoSansBengali-Bold', fontSize: 15, color: '#1a1a1a', flex: 1, marginRight: 8 },
  badge:           { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText:       { fontFamily: 'NotoSansBengali-Bold', fontSize: 11 },
  cardMeta:        { fontFamily: 'NotoSansBengali', fontSize: 13, color: '#555', marginBottom: 3 },
  cardImgNote:     { fontFamily: 'NotoSansBengali', fontSize: 12, color: '#888', marginTop: 4 },
  respondBtn:      { marginTop: 12, backgroundColor: '#1D9E75', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  respondText:     { fontFamily: 'NotoSansBengali-Bold', fontSize: 14, color: '#fff' },
  emptyState:      { alignItems: 'center', paddingTop: 80 },
  emptyEmoji:      { fontSize: 64, marginBottom: 16 },
  emptyText:       { fontFamily: 'NotoSansBengali-Bold', fontSize: 18, color: '#888' },
  scroll:          { padding: 20 },
  label:           { fontFamily: 'NotoSansBengali-Bold', fontSize: 15, color: '#1a1a1a', marginBottom: 10, marginTop: 6 },
  input:           { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e0e0e0', paddingHorizontal: 16, paddingVertical: 14, fontFamily: 'NotoSansBengali', fontSize: 15, color: '#1a1a1a', marginBottom: 20 },
  ticketSummary:   { backgroundColor: '#f0faf6', borderRadius: 14, padding: 16, marginBottom: 24, borderLeftWidth: 4, borderLeftColor: '#1D9E75' },
  summaryTitle:    { fontFamily: 'NotoSansBengali-Bold', fontSize: 16, color: '#1a1a1a', marginBottom: 8 },
  summaryMeta:     { fontFamily: 'NotoSansBengali', fontSize: 13, color: '#555', marginBottom: 4 },
  imagesNote:      { fontFamily: 'NotoSansBengali', fontSize: 12, color: '#888', marginTop: 4 },
  submitBtn:       { backgroundColor: '#1D9E75', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  submitText:      { fontFamily: 'NotoSansBengali-Bold', fontSize: 18, color: '#fff' },
});
