import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, StatusBar, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../src/store';
import { addToQueue } from '../../src/store/slices/offlineQueueSlice';
import { uploadWithImages } from '../../src/lib/apiClient';
import NetInfo from '@react-native-community/netinfo';

const CROP_TYPES = [
  { id: 'paddy',  icon: '🌾', label: 'ধান' },
  { id: 'jute',   icon: '🌿', label: 'পাট' },
  { id: 'veggie', icon: '🥦', label: 'সবজি' },
  { id: 'fish',   icon: '🐟', label: 'মাছ' },
  { id: 'fruit',  icon: '🍎', label: 'ফল' },
  { id: 'other',  icon: '🌱', label: 'অন্যান্য' },
];

export default function ReportProblemScreen() {
  const router    = useRouter();
  const dispatch  = useDispatch<AppDispatch>();

  const [title,      setTitle]      = useState('');
  const [description,setDescription]= useState('');
  const [cropType,   setCropType]   = useState('');
  const [images,     setImages]     = useState<string[]>([]);
  const [loading,    setLoading]    = useState(false);

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('', 'সর্বোচ্চ ৫টি ছবি যোগ করতে পারবেন।');
      return;
    }
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('অনুমতি দরকার', 'গ্যালারিতে প্রবেশের অনুমতি দিন।');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality:    0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
    });

    if (!result.canceled) {
      const newUris = result.assets.map((a) => a.uri);
      setImages([...images, ...newUris].slice(0, 5));
    }
  };

  const capturePhoto = async () => {
    if (images.length >= 5) return;
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert('অনুমতি দরকার', 'ক্যামেরা ব্যবহারের অনুমতি দিন।');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      setImages([...images, result.assets[0].uri].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) { Alert.alert('', 'সমস্যার শিরোনাম দিন।'); return; }
    if (!description.trim() || description.length < 20) { Alert.alert('', 'বিস্তারিত বর্ণনা দিন (কমপক্ষে ২০ অক্ষর)।'); return; }
    if (!cropType) { Alert.alert('', 'ফসলের ধরন নির্বাচন করুন।'); return; }

    setLoading(true);

    try {
      const netState = await NetInfo.fetch();
      const isOnline = netState.isConnected && netState.isInternetReachable;

      if (isOnline) {
        // Online: upload directly with images
        await uploadWithImages(
          '/v1/advisory/tickets',
          { title, description, crop_type: cropType },
          images
        );
        Alert.alert('সফল! ✅', 'টিকিট জমা হয়েছে। একজন কৃষি বিশেষজ্ঞ শীঘ্রই জবাব দেবেন।', [
          { text: 'ঠিক আছে', onPress: () => router.back() },
        ]);
      } else {
        // Offline: save text fields to queue (images will be re-captured on sync)
        dispatch(addToQueue({
          endpoint: '/v1/advisory/tickets',
          method:   'POST',
          data:     { title, description, crop_type: cropType },
        }));
        Alert.alert(
          'অফলাইনে সংরক্ষিত 📥',
          'ইন্টারনেট সংযোগ পেলে স্বয়ংক্রিয়ভাবে জমা হবে।',
          [{ text: 'ঠিক আছে', onPress: () => router.back() }]
        );
      }
    } catch (err: any) {
      Alert.alert('সমস্যা হয়েছে', err?.message ?? 'আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>সমস্যা জানান</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Crop Type Selector */}
        <Text style={s.label}>ফসলের ধরন *</Text>
        <View style={s.cropGrid}>
          {CROP_TYPES.map((crop) => (
            <TouchableOpacity
              key={crop.id}
              style={[s.cropCard, cropType === crop.label && s.cropCardSelected]}
              onPress={() => setCropType(crop.label)}
            >
              <Text style={s.cropIcon}>{crop.icon}</Text>
              <Text style={[s.cropLabel, cropType === crop.label && s.cropLabelSelected]}>
                {crop.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Title */}
        <Text style={s.label}>সমস্যার শিরোনাম *</Text>
        <TextInput
          style={s.input}
          placeholder="যেমন: ধানের পাতা হলুদ হয়ে যাচ্ছে"
          placeholderTextColor="#aaa"
          value={title}
          onChangeText={setTitle}
          maxLength={200}
        />

        {/* Description */}
        <Text style={s.label}>বিস্তারিত বর্ণনা *</Text>
        <TextInput
          style={[s.input, s.textarea]}
          placeholder="কতদিন ধরে হচ্ছে, কোন এলাকায়, কী কী লক্ষণ দেখছেন — বিস্তারিত লিখুন"
          placeholderTextColor="#aaa"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        {/* Image Picker */}
        <Text style={s.label}>ছবি যোগ করুন ({images.length}/5)</Text>
        <View style={s.imageRow}>
          {images.map((uri, i) => (
            <TouchableOpacity key={i} onPress={() => removeImage(i)} style={s.imageThumb}>
              <Image source={{ uri }} style={s.thumbImg} contentFit="cover" />
              <View style={s.removeOverlay}><Text style={s.removeX}>✕</Text></View>
            </TouchableOpacity>
          ))}
          {images.length < 5 && (
            <View style={s.imageBtnGroup}>
              <TouchableOpacity style={s.imageBtn} onPress={capturePhoto}>
                <Text style={s.imageBtnIcon}>📷</Text>
                <Text style={s.imageBtnLabel}>ক্যামেরা</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.imageBtn} onPress={pickImage}>
                <Text style={s.imageBtnIcon}>🖼️</Text>
                <Text style={s.imageBtnLabel}>গ্যালারি</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Submit */}
        <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.submitText}>টিকিট জমা দিন 🌿</Text>
          }
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: '#f7f9f7' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backBtn:          { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  backIcon:         { fontSize: 18, color: '#1a1a1a' },
  headerTitle:      { fontFamily: 'NotoSansBengali-Bold', fontSize: 18, color: '#1a1a1a' },
  scroll:           { padding: 20 },
  label:            { fontFamily: 'NotoSansBengali-Bold', fontSize: 15, color: '#1a1a1a', marginBottom: 10, marginTop: 6 },
  input:            { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e0e0e0', paddingHorizontal: 16, paddingVertical: 14, fontFamily: 'NotoSansBengali', fontSize: 15, color: '#1a1a1a', marginBottom: 20 },
  textarea:         { height: 120, paddingTop: 14 },
  cropGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  cropCard:         { width: '30%', backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#e0e0e0' },
  cropCardSelected: { borderColor: '#1D9E75', backgroundColor: '#f0faf6' },
  cropIcon:         { fontSize: 30, marginBottom: 6 },
  cropLabel:        { fontFamily: 'NotoSansBengali-SemiBold', fontSize: 13, color: '#555' },
  cropLabelSelected:{ color: '#1D9E75' },
  imageRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  imageThumb:       { width: 76, height: 76, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  thumbImg:         { width: '100%', height: '100%' },
  removeOverlay:    { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  removeX:          { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  imageBtnGroup:    { flexDirection: 'row', gap: 10 },
  imageBtn:         { width: 76, height: 76, borderRadius: 12, borderWidth: 1.5, borderColor: '#1D9E75', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0faf6' },
  imageBtnIcon:     { fontSize: 24 },
  imageBtnLabel:    { fontFamily: 'NotoSansBengali', fontSize: 10, color: '#1D9E75', marginTop: 2 },
  submitBtn:        { backgroundColor: '#1D9E75', borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  submitText:       { fontFamily: 'NotoSansBengali-Bold', fontSize: 18, color: '#fff' },
});
