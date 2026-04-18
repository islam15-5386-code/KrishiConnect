import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import NetInfo from '@react-native-community/netinfo';
import { useDispatch } from 'react-redux';

import { AppDispatch } from '../../store';
import { addToQueue, flushOfflineQueue } from '../../store/slices/offlineQueueSlice';
import { uploadWithImages } from '../../lib/apiClient';

const crops = [
  { key: 'ধান', icon: 'sprout' },
  { key: 'পাট', icon: 'leaf' },
  { key: 'সবজি', icon: 'food-apple-outline' },
  { key: 'মাছ', icon: 'fish' },
  { key: 'ফল', icon: 'fruit-cherries' },
  { key: 'অন্যান্য', icon: 'dots-grid' },
];

export default function ReportProblemScreen({ navigation }: { navigation: any }) {
  const dispatch = useDispatch<AppDispatch>();
  const [cropType, setCropType] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        dispatch(flushOfflineQueue());
      }
    });
    return () => unsub();
  }, [dispatch]);

  const pickFromCamera = async () => {
    if (images.length >= 5) {
      Alert.alert('সীমা', 'সর্বোচ্চ ৫টি ছবি।');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('অনুমতি দরকার', 'ক্যামেরা অনুমতি দিন।');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      setImages((prev) => [...prev, result.assets[0].uri].slice(0, 5));
    }
  };

  const pickFromGallery = async () => {
    if (images.length >= 5) {
      Alert.alert('সীমা', 'সর্বোচ্চ ৫টি ছবি।');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('অনুমতি দরকার', 'গ্যালারি অনুমতি দিন।');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...uris].slice(0, 5));
    }
  };

  const submit = async () => {
    if (!cropType) {
      Alert.alert('ফসল বাছাই করুন', 'একটি ফসল নির্বাচন করুন।');
      return;
    }
    if (!description.trim()) {
      Alert.alert('বিস্তারিত লিখুন', 'সমস্যার বিবরণ দিন।');
      return;
    }

    setLoading(true);
    const payload = {
      title: `${cropType} সমস্যা`,
      crop_type: cropType,
      description,
    };

    try {
      const netState = await NetInfo.fetch();
      const isOnline = Boolean(netState.isConnected && netState.isInternetReachable);

      if (isOnline) {
        await uploadWithImages('/v1/advisory/tickets', payload, images);
      } else {
        dispatch(
          addToQueue({
            endpoint: '/v1/advisory/tickets',
            method: 'POST',
            data: payload,
            mode: 'multipart',
            imageUris: images,
          })
        );
      }

      Alert.alert('সফল', isOnline ? 'সমস্যা পাঠানো হয়েছে।' : 'অফলাইনে সংরক্ষিত হয়েছে।');
      navigation.goBack();
    } catch {
      dispatch(
        addToQueue({
          endpoint: '/v1/advisory/tickets',
          method: 'POST',
          data: payload,
          mode: 'multipart',
          imageUris: images,
        })
      );
      Alert.alert('অফলাইনে সংরক্ষণ', 'সংযোগ হলে স্বয়ংক্রিয়ভাবে পাঠানো হবে।');
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
        <Text style={styles.headerTitle}>সমস্যা রিপোর্ট</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>ফসল</Text>
        <View style={styles.cropGrid}>
          {crops.map((crop) => (
            <TouchableOpacity
              key={crop.key}
              style={[styles.cropCard, cropType === crop.key && styles.cropCardActive]}
              onPress={() => setCropType(crop.key)}
            >
              <MaterialCommunityIcons name={crop.icon as any} size={58} color={cropType === crop.key ? '#1D9E75' : '#6D7E78'} />
              <Text style={[styles.cropLabel, cropType === crop.key && styles.cropLabelActive]}>{crop.key}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>ছবি (সর্বোচ্চ ৫)</Text>
        <View style={styles.photoActions}>
          <TouchableOpacity style={styles.photoBtn} onPress={pickFromCamera}>
            <MaterialCommunityIcons name="camera" size={28} color="#1D9E75" />
            <Text style={styles.photoBtnText}>ক্যামেরা</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoBtn} onPress={pickFromGallery}>
            <MaterialCommunityIcons name="image-multiple" size={28} color="#1D9E75" />
            <Text style={styles.photoBtnText}>গ্যালারি</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
          {images.map((uri, idx) => (
            <View key={uri + idx} style={styles.thumbWrap}>
              <Image source={{ uri }} style={styles.thumb} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => setImages((prev) => prev.filter((_, i) => i !== idx))}>
                <MaterialCommunityIcons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>বিস্তারিত</Text>
        <TextInput
          multiline
          style={styles.input}
          placeholder="বাংলায় লিখুন: সমস্যা কোথায়, কতদিন ধরে, কী লক্ষণ..."
          placeholderTextColor="#8C9C95"
          value={description}
          onChangeText={setDescription}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>পাঠান</Text>}
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
  cropGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
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
  cropLabel: { marginTop: 6, fontFamily: 'NotoSansBengali_500Medium', color: '#5C6F68', fontSize: 13 },
  cropLabelActive: { color: '#1D9E75' },
  photoActions: { flexDirection: 'row', gap: 10 },
  photoBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCEAE3',
    paddingVertical: 12,
    alignItems: 'center',
  },
  photoBtnText: { marginTop: 4, fontFamily: 'NotoSansBengali_500Medium', color: '#1D9E75', fontSize: 13 },
  thumbRow: { marginTop: 12, gap: 8, paddingRight: 8 },
  thumbWrap: { position: 'relative' },
  thumb: { width: 82, height: 82, borderRadius: 12 },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    minHeight: 130,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEAE3',
    fontFamily: 'NotoSansBengali_400Regular',
    color: '#10312A',
    fontSize: 16,
    padding: 14,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: 18,
    backgroundColor: '#1D9E75',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: { color: '#FFFFFF', fontFamily: 'NotoSansBengali_700Bold', fontSize: 18 },
});
