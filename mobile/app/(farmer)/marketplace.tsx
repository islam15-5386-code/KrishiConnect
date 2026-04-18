import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/apiClient';

const CATEGORIES = ['সব', 'Fertilizer', 'Pesticide', 'Seed', 'Tool', 'Equipment'];
const CAT_ICONS: Record<string, string> = {
  'সব': '🛒', Fertilizer: '🪣', Pesticide: '🧴', Seed: '🌱', Tool: '🔧', Equipment: '⚙️',
};

export default function MarketplaceScreen() {
  const router = useRouter();
  const [products, setProducts]   = useState<any[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [refresh,  setRefresh]    = useState(false);
  const [category, setCategory]   = useState('সব');
  const [search,   setSearch]     = useState('');
  const [page,     setPage]       = useState(1);
  const [hasMore,  setHasMore]    = useState(true);

  const load = useCallback(async (reset = false) => {
    const currentPage = reset ? 1 : page;
    try {
      const params: Record<string, any> = { page: currentPage, per_page: 20 };
      if (category !== 'সব') params.category = category;

      const res = await apiClient.get('/v1/marketplace/products', { params });
      const data = res.data.data;
      const items = data?.data ?? [];

      if (reset) {
        setProducts(items);
        setPage(2);
      } else {
        setProducts(prev => [...prev, ...items]);
        setPage(currentPage + 1);
      }
      setHasMore(data?.current_page < data?.last_page);
    } catch (e) {}
    setLoading(false);
    setRefresh(false);
  }, [category, page]);

  useEffect(() => { setLoading(true); load(true); }, [category]);

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderProduct = ({ item }: { item: any }) => (
    <TouchableOpacity style={s.card} onPress={() => router.push(`/(farmer)/product/${item.id}` as any)} activeOpacity={0.85}>
      <Image
        source={{ uri: item.images?.[0] ?? 'https://via.placeholder.com/180' }}
        style={s.cardImg}
        contentFit="cover"
        transition={300}
      />
      {!item.stock_quantity && (
        <View style={s.outOfStock}><Text style={s.outOfStockText}>স্টক নেই</Text></View>
      )}
      <View style={s.cardBody}>
        <Text style={s.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={s.productCategory}>{CAT_ICONS[item.category] ?? '📦'} {item.category}</Text>
        <View style={s.priceRow}>
          <Text style={s.price}>৳{item.price_bdt}</Text>
          <Text style={s.unit}>/{item.unit}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>বাজার 🛒</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={s.searchRow}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="পণ্য খুঁজুন..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category Filter Chips */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(c) => c}
        contentContainerStyle={s.chips}
        renderItem={({ item: cat }) => (
          <TouchableOpacity
            style={[s.chip, category === cat && s.chipActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[s.chipText, category === cat && s.chipTextActive]}>
              {CAT_ICONS[cat]} {cat}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Product Grid */}
      {loading
        ? <ActivityIndicator size="large" color="#1D9E75" style={{ marginTop: 60 }} />
        : (
          <FlatList
            data={filtered}
            numColumns={2}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={s.grid}
            columnWrapperStyle={{ gap: 12 }}
            refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); load(true); }} tintColor="#1D9E75" />}
            onEndReached={() => hasMore && load()}
            onEndReachedThreshold={0.4}
            ListFooterComponent={hasMore ? <ActivityIndicator color="#1D9E75" style={{ marginVertical: 20 }} /> : null}
            ListEmptyComponent={
              <View style={s.emptyState}>
                <Text style={s.emptyEmoji}>📭</Text>
                <Text style={s.emptyText}>কোনো পণ্য পাওয়া যায়নি।</Text>
              </View>
            }
            renderItem={renderProduct}
          />
        )
      }
    </View>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#f7f9f7' },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backBtn:         { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  backIcon:        { fontSize: 18, color: '#1a1a1a' },
  headerTitle:     { fontFamily: 'NotoSansBengali-Bold', fontSize: 18, color: '#1a1a1a' },
  searchRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 14, borderWidth: 1, borderColor: '#e0e0e0', paddingHorizontal: 14, gap: 8 },
  searchIcon:      { fontSize: 18 },
  searchInput:     { flex: 1, paddingVertical: 12, fontFamily: 'NotoSansBengali', fontSize: 15, color: '#1a1a1a' },
  chips:           { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip:            { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0' },
  chipActive:      { backgroundColor: '#1D9E75', borderColor: '#1D9E75' },
  chipText:        { fontFamily: 'NotoSansBengali', fontSize: 13, color: '#555' },
  chipTextActive:  { color: '#fff', fontFamily: 'NotoSansBengali-Bold' },
  grid:            { paddingHorizontal: 16, paddingBottom: 80 },
  card:            { flex: 1, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardImg:         { width: '100%', height: 140 },
  outOfStock:      { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(239,68,68,0.9)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  outOfStockText:  { fontFamily: 'NotoSansBengali-Bold', fontSize: 10, color: '#fff' },
  cardBody:        { padding: 12 },
  productName:     { fontFamily: 'NotoSansBengali-Bold', fontSize: 13, color: '#1a1a1a', marginBottom: 4, lineHeight: 18 },
  productCategory: { fontFamily: 'NotoSansBengali', fontSize: 11, color: '#888', marginBottom: 8 },
  priceRow:        { flexDirection: 'row', alignItems: 'baseline' },
  price:           { fontFamily: 'NotoSansBengali-Bold', fontSize: 18, color: '#1D9E75' },
  unit:            { fontFamily: 'NotoSansBengali', fontSize: 12, color: '#888', marginLeft: 2 },
  emptyState:      { alignItems: 'center', paddingTop: 80 },
  emptyEmoji:      { fontSize: 64, marginBottom: 16 },
  emptyText:       { fontFamily: 'NotoSansBengali-Bold', fontSize: 18, color: '#888' },
});
