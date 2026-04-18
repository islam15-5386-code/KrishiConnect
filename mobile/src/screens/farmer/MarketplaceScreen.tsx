import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MarketplaceScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>মার্কেটপ্লেস</Text>
      <Text style={styles.sub}>ইনপুট পণ্য দ্রুত অর্ডার করুন।</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F7F3' },
  title: { fontFamily: 'NotoSansBengali_700Bold', fontSize: 26, color: '#1D9E75' },
  sub: { marginTop: 8, fontFamily: 'NotoSansBengali_400Regular', fontSize: 15, color: '#64748B' },
});
