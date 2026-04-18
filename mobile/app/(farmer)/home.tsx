import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, StatusBar, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import { apiClient } from '../../src/lib/apiClient';

const QUICK_ACTIONS = [
  { id: 'report',     icon: '🌿', label: 'সমস্যা\nজানান',  route: '/(farmer)/report-problem',  color: '#1D9E75' },
  { id: 'sell',       icon: '🌾', label: 'ফসল\nবিক্রি',    route: '/(farmer)/crop-listing',    color: '#EF9F27' },
  { id: 'market',     icon: '🛒', label: 'বাজার',          route: '/(farmer)/marketplace',     color: '#2563eb' },
  { id: 'prices',     icon: '📊', label: 'দাম\nদেখুন',     route: '/(farmer)/prices',          color: '#7c3aed' },
  { id: 'offers',     icon: '💰', label: 'অফার',           route: '/(farmer)/my-offers',       color: '#dc2626' },
  { id: 'orders',     icon: '📦', label: 'অর্ডার',         route: '/(farmer)/orders',          color: '#059669' },
];

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  open:      { label: 'খোলা',      color: '#f59e0b' },
  assigned:  { label: 'প্রক্রিয়াধীন', color: '#3b82f6' },
  resolved:  { label: 'সমাধান',    color: '#10b981' },
  escalated: { label: 'এসকালেটেড',  color: '#ef4444' },
};

export default function FarmerHomeScreen() {
  const router   = useRouter();
  const user     = useSelector((s: RootState) => s.auth.user);
  const [profile, setProfile]   = useState<any>(null);
  const [tickets, setTickets]   = useState<any[]>([]);
  const [offers,  setOffers]    = useState<any[]>([]);
  const [refresh, setRefresh]   = useState(false);

  const load = async () => {
    try {
      const [p, t, o] = await Promise.all([
        apiClient.get('/v1/farmer/profile'),
        apiClient.get('/v1/advisory/tickets?per_page=3'),
        apiClient.get('/v1/crop-listings/mine?per_page=3'),
      ]);
      setProfile(p.data.data);
      setTickets(t.data.data?.data ?? []);
      setOffers(o.data.data?.data ?? []);
    } catch (e) { /* Handled by interceptor */ }
    setRefresh(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* Hero Header */}
      <LinearGradient colors={['#0f5c3d', '#1D9E75']} style={s.header}>
        <Text style={s.greeting}>
          আস্সালামু আলাইকুম 👋
        </Text>
        <Text style={s.name}>
          {profile?.farmerProfile?.full_name ?? 'কৃষক বন্ধু'}
        </Text>
        {profile?.farmerProfile && (
          <View style={s.landBadge}>
            <Text style={s.landText}>
              🌱 {profile.farmerProfile.land_size_acres} একর · {profile.farmerProfile.district}
            </Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); load(); }} tintColor="#1D9E75" />}
      >
        {/* Pending Offers Banner */}
        {offers.some(l => l.status === 'negotiating') && (
          <TouchableOpacity style={s.offerBanner} onPress={() => router.push('/(farmer)/my-offers')}>
            <Text style={s.offerBannerText}>💰 নতুন ক্রয় অফার এসেছে — দেখুন →</Text>
          </TouchableOpacity>
        )}

        {/* Quick Action Grid */}
        <Text style={s.sectionTitle}>দ্রুত কাজ করুন</Text>
        <View style={s.actionGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[s.actionCard, { borderTopColor: action.color }]}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.8}
            >
              <Text style={s.actionIcon}>{action.icon}</Text>
              <Text style={s.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Active Advisory Tickets */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>আমার টিকিট</Text>
          <TouchableOpacity onPress={() => router.push('/(farmer)/tickets')}>
            <Text style={s.seeAll}>সব দেখুন →</Text>
          </TouchableOpacity>
        </View>

        {tickets.length === 0
          ? <View style={s.emptyCard}><Text style={s.emptyText}>কোনো সক্রিয় টিকিট নেই।</Text></View>
          : tickets.map((ticket) => (
              <TouchableOpacity
                key={ticket.id}
                style={s.ticketCard}
                onPress={() => router.push(`/(farmer)/ticket/${ticket.id}` as any)}
              >
                <View style={s.ticketTop}>
                  <Text style={s.ticketTitle} numberOfLines={1}>{ticket.title}</Text>
                  <View style={[s.statusBadge, { backgroundColor: STATUS_BADGE[ticket.status]?.color + '20' }]}>
                    <Text style={[s.statusText, { color: STATUS_BADGE[ticket.status]?.color }]}>
                      {STATUS_BADGE[ticket.status]?.label}
                    </Text>
                  </View>
                </View>
                <Text style={s.ticketMeta}>🌿 {ticket.crop_type} · 📍 {ticket.district}</Text>
              </TouchableOpacity>
            ))
        }

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#f7f9f7' },
  header:        { paddingTop: 56, paddingHorizontal: 24, paddingBottom: 32 },
  greeting:      { fontFamily: 'NotoSansBengali', fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  name:          { fontFamily: 'NotoSansBengali-Bold', fontSize: 26, color: '#fff', marginTop: 4 },
  landBadge:     { marginTop: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start' },
  landText:      { fontFamily: 'NotoSansBengali', fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  scroll:        { padding: 20 },
  offerBanner:   { backgroundColor: '#fef3c7', borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: '#EF9F27', marginBottom: 20 },
  offerBannerText:{ fontFamily: 'NotoSansBengali-SemiBold', fontSize: 15, color: '#92400e' },
  sectionTitle:  { fontFamily: 'NotoSansBengali-Bold', fontSize: 18, color: '#1a1a1a', marginBottom: 14, marginTop: 4 },
  sectionRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  seeAll:        { fontFamily: 'NotoSansBengali', fontSize: 14, color: '#1D9E75' },
  actionGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  actionCard:    { width: '30%', backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', borderTopWidth: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  actionIcon:    { fontSize: 32, marginBottom: 8 },
  actionLabel:   { fontFamily: 'NotoSansBengali-SemiBold', fontSize: 13, color: '#1a1a1a', textAlign: 'center', lineHeight: 18 },
  ticketCard:    { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  ticketTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ticketTitle:   { fontFamily: 'NotoSansBengali-Bold', fontSize: 15, color: '#1a1a1a', flex: 1, marginRight: 8 },
  statusBadge:   { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText:    { fontFamily: 'NotoSansBengali-Bold', fontSize: 12 },
  ticketMeta:    { fontFamily: 'NotoSansBengali', fontSize: 13, color: '#666' },
  emptyCard:     { backgroundColor: '#fff', borderRadius: 14, padding: 24, alignItems: 'center', marginBottom: 12 },
  emptyText:     { fontFamily: 'NotoSansBengali', fontSize: 14, color: '#aaa' },
});
