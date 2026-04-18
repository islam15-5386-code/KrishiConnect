import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import { RootState } from '../../store';
import { apiClient } from '../../lib/apiClient';

const { width } = Dimensions.get('window');

const quickActions = [
  { key: 'report', title: 'সমস্যা জানান', icon: 'bug-outline', color: '#1D9E75' },
  { key: 'sell', title: 'ফসল বিক্রি', icon: 'sprout-outline', color: '#EF9F27' },
  { key: 'market', title: 'মার্কেটপ্লেস', icon: 'storefront-outline', color: '#1D9E75' },
  { key: 'price', title: 'দাম', icon: 'chart-line', color: '#EF9F27' },
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const user = useSelector((s: RootState) => s.auth.user);
  const [stats, setStats] = useState({ land: '2.5 একর', activeTickets: 0, activeListings: 0 });
  const [tickets, setTickets] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);

  const greetingName = useMemo(() => (user ? `কৃষক #${user.id}` : 'কৃষক বন্ধু'), [user]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [profileRes, ticketRes, offerRes] = await Promise.all([
          apiClient.get('/v1/farmer/profile'),
          apiClient.get('/v1/advisory/tickets'),
          apiClient.get('/v1/offers/incoming'),
        ]);

        if (!mounted) return;

        const profile = profileRes.data?.data?.farmerProfile;
        const ticketItems = ticketRes.data?.data?.data ?? ticketRes.data?.data ?? [];
        const offerItems = offerRes.data?.data?.data ?? offerRes.data?.data ?? [];

        setStats({
          land: profile?.land_size_acres ? `${profile.land_size_acres} একর` : '2.5 একর',
          activeTickets: ticketItems.length,
          activeListings: offerItems.length,
        });
        setTickets(ticketItems.slice(0, 8));
        setOffers(offerItems.slice(0, 3));
      } catch {
        if (!mounted) return;
        setTickets([
          { id: 101, title: 'ধান পাতায় দাগ', status: 'assigned' },
          { id: 102, title: 'পাটে পোকা', status: 'open' },
        ]);
        setOffers([{ id: 1, is_new: true, company: { name: 'Agri BD Ltd' } }]);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const onActionPress = (key: string) => {
    if (key === 'report') navigation.navigate('ReportProblem');
    if (key === 'sell') navigation.navigate('CropListing');
    if (key === 'market') navigation.navigate('MarketplaceTab');
    if (key === 'price') navigation.navigate('PricesTab');
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80' }}
        style={styles.hero}
        imageStyle={styles.heroImage}
      >
        <View style={styles.heroOverlay}>
          <Text style={styles.heroGreeting}>আসসালামু আলাইকুম, {greetingName}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>জমি</Text>
              <Text style={styles.statValue}>{stats.land}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>টিকিট</Text>
              <Text style={styles.statValue}>{stats.activeTickets}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>অফার</Text>
              <Text style={styles.statValue}>{stats.activeListings}</Text>
            </View>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>দ্রুত কাজ</Text>
        <View style={styles.actionGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.key} style={styles.actionCard} onPress={() => onActionPress(action.key)}>
              <MaterialCommunityIcons name={action.icon as any} size={58} color={action.color} />
              <Text style={styles.actionLabel}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>সক্রিয় টিকিট</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ticketRow}>
          {tickets.map((ticket) => (
            <View key={ticket.id} style={styles.ticketCard}>
              <Text style={styles.ticketTitle}>{ticket.title}</Text>
              <Text style={styles.ticketStatus}>{ticket.status}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={[styles.offerBanner, offers.some((o) => o.is_new) && styles.offerBannerNew]}
        onPress={() => navigation.navigate('MyOffersTab')}
      >
        <MaterialCommunityIcons name="hand-coin-outline" size={34} color="#FFFFFF" />
        <View style={styles.offerTextWrap}>
          <Text style={styles.offerTitle}>নতুন অফার এসেছে</Text>
          <Text style={styles.offerSub}>আপনার ফসলে কোম্পানির প্রস্তাব দেখুন</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7F3' },
  content: { paddingBottom: 28 },
  hero: { width: width, height: 320, justifyContent: 'flex-end' },
  heroImage: { borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroOverlay: {
    backgroundColor: 'rgba(7, 32, 22, 0.45)',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 18,
    paddingBottom: 22,
    paddingTop: 14,
  },
  heroGreeting: {
    color: '#FFFFFF',
    fontFamily: 'NotoSansBengali_700Bold',
    fontSize: 26,
    marginBottom: 12,
  },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statLabel: { fontFamily: 'NotoSansBengali_400Regular', fontSize: 12, color: '#35554A' },
  statValue: { fontFamily: 'NotoSansBengali_700Bold', fontSize: 18, color: '#1D9E75', marginTop: 2 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontFamily: 'NotoSansBengali_700Bold', fontSize: 20, color: '#0F172A', marginBottom: 12 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    alignItems: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E8EFEB',
  },
  actionLabel: {
    marginTop: 8,
    fontFamily: 'NotoSansBengali_500Medium',
    color: '#124437',
    fontSize: 14,
    textAlign: 'center',
  },
  ticketRow: { gap: 10, paddingRight: 8 },
  ticketCard: {
    width: 210,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8EFEB',
    padding: 14,
  },
  ticketTitle: { fontFamily: 'NotoSansBengali_700Bold', color: '#0F172A', fontSize: 15, marginBottom: 8 },
  ticketStatus: { fontFamily: 'NotoSansBengali_500Medium', color: '#1D9E75', fontSize: 13 },
  offerBanner: {
    marginTop: 22,
    marginHorizontal: 16,
    backgroundColor: '#7AAE9E',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  offerBannerNew: { backgroundColor: '#1D9E75' },
  offerTextWrap: { flex: 1 },
  offerTitle: { fontFamily: 'NotoSansBengali_700Bold', color: '#FFFFFF', fontSize: 17 },
  offerSub: { fontFamily: 'NotoSansBengali_400Regular', color: '#E6FFF6', fontSize: 12, marginTop: 4 },
});
