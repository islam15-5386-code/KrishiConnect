import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import ticketsReducer from './slices/ticketsSlice';
import listingsReducer from './slices/listingsSlice';
import offlineQueueReducer from './slices/offlineQueueSlice';

const persistConfig = {
  key:       'krishiconnect_root',
  storage:   AsyncStorage,
  // Only persist auth token + offline queue across app restarts
  whitelist: ['auth', 'offlineQueue'],
};

const rootReducer = combineReducers({
  auth:         authReducer,
  tickets:      ticketsReducer,
  listings:     listingsReducer,
  offlineQueue: offlineQueueReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
