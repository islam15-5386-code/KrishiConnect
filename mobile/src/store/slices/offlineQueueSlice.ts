import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient, uploadWithImages } from '../../lib/apiClient';

export interface OfflineQueueItem {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH';
  data: any;
  mode?: 'json' | 'multipart';
  imageUris?: string[];
  createdAt: number;
  retries: number;
}

interface OfflineQueueState {
  items: OfflineQueueItem[];
  isSyncing: boolean;
}

const initialState: OfflineQueueState = {
  items: [],
  isSyncing: false,
};

/**
 * Flush the offline queue when connectivity is restored.
 * Called by the NetInfo listener in App.tsx.
 *
 * Items are retried up to 3 times before being dropped.
 */
export const flushOfflineQueue = createAsyncThunk(
  'offlineQueue/flush',
  async (_, { getState, dispatch }) => {
    const state = getState() as any;
    const items: OfflineQueueItem[] = state.offlineQueue.items;

    for (const item of items) {
      try {
        if ((item.mode ?? 'json') === 'multipart') {
          await uploadWithImages(item.endpoint, item.data ?? {}, item.imageUris ?? []);
        } else {
          await apiClient.request({ method: item.method, url: item.endpoint, data: item.data });
        }
        dispatch(removeFromQueue(item.id));
      } catch (err) {
        if (item.retries >= 3) {
          dispatch(removeFromQueue(item.id));
        } else {
          dispatch(incrementRetry(item.id));
        }
      }
    }
  }
);

const offlineQueueSlice = createSlice({
  name: 'offlineQueue',
  initialState,
  reducers: {
    addToQueue: (state, action: PayloadAction<Omit<OfflineQueueItem, 'id' | 'createdAt' | 'retries'>>) => {
      state.items.push({
        ...action.payload,
        id: `${Date.now()}_${Math.random()}`,
        createdAt: Date.now(),
        retries: 0,
      });
    },
    removeFromQueue: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    incrementRetry: (state, action: PayloadAction<string>) => {
      const item = state.items.find((i) => i.id === action.payload);
      if (item) item.retries += 1;
    },
    clearQueue: (state) => { state.items = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(flushOfflineQueue.pending, (state) => { state.isSyncing = true; })
      .addCase(flushOfflineQueue.fulfilled, (state) => { state.isSyncing = false; })
      .addCase(flushOfflineQueue.rejected, (state) => { state.isSyncing = false; });
  },
});

export const { addToQueue, removeFromQueue, incrementRetry, clearQueue } = offlineQueueSlice.actions;
export default offlineQueueSlice.reducer;
