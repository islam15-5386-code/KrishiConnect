import React, { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import NetInfo from '@react-native-community/netinfo';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from './src/store';
import { flushOfflineQueue } from './src/store/slices/offlineQueueSlice';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  NotoSansBengali_400Regular,
  NotoSansBengali_500Medium,
  NotoSansBengali_700Bold,
} from '@expo-google-fonts/noto-sans-bengali';

import AppNavigator from './src/navigation/AppNavigator';

SplashScreen.preventAutoHideAsync();

// ─── NetInfo listener — flush offline queue on reconnect ─────────────────
function ConnectivityMonitor() {
  const dispatch = useDispatch<AppDispatch>();
  const queueItems = useSelector((s: RootState) => s.offlineQueue.items);
  const wasOffline = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected && state.isInternetReachable;

      if (isOnline && wasOffline.current && queueItems.length > 0) {
        dispatch(flushOfflineQueue());
      }

      wasOffline.current = !isOnline;
    });

    return () => unsubscribe();
  }, [queueItems]);

  return null;
}

// ─── Root App Component ──────────────────────────────────────────────────
export default function App() {
  const [fontsLoaded] = useFonts({
    NotoSansBengali_400Regular,
    NotoSansBengali_500Medium,
    NotoSansBengali_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <StatusBar style="dark" />
        <ConnectivityMonitor />
        <AppNavigator />
      </PersistGate>
    </Provider>
  );
}
