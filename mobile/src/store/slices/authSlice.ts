import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../lib/apiClient';

interface AuthUser {
  id: number;
  role: 'farmer' | 'agricultural_officer' | 'company' | 'vendor' | 'admin';
  is_new_user: boolean;
  preferred_language: 'bn' | 'en';
  profile_complete: boolean;
}

interface AuthState {
  token:     string | null;
  user:      AuthUser | null;
  loading:   boolean;
  error:     string | null;
  otpSent:   boolean;
  expiresAt: number | null; // Unix timestamp
}

const initialState: AuthState = {
  token:     null,
  user:      null,
  loading:   false,
  error:     null,
  otpSent:   false,
  expiresAt: null,
};

// ─── Thunks ──────────────────────────────────────────────────────────────────

export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async (phoneNumber: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/v1/auth/send-otp', { phone_number: phoneNumber });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'OTP পাঠাতে সমস্যা হয়েছে।');
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ phoneNumber, code }: { phoneNumber: string; code: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/v1/auth/verify-otp', {
        phone_number: phoneNumber,
        code,
      });
      return response.data.data; // { token, token_type, expires_in, user }
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'OTP যাচাই ব্যর্থ হয়েছে।');
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.token     = null;
      state.user      = null;
      state.expiresAt = null;
      state.error     = null;
    },
    setFcmToken: (state, action: PayloadAction<string>) => {
      // Updated on every app open; token synced to backend
      if (state.user) {
        // Token is synced via a separate API call, stored here for reference
      }
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    // Send OTP
    builder
      .addCase(sendOtp.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(sendOtp.fulfilled, (state) => { state.loading = false; state.otpSent = true; })
      .addCase(sendOtp.rejected,  (state, action) => {
        state.loading = false;
        state.error   = action.payload as string;
      });

    // Verify OTP
    builder
      .addCase(verifyOtp.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading   = false;
        state.token     = action.payload.token;
        state.user      = action.payload.user;
        // Calculate expiry timestamp (expires_in is in seconds)
        state.expiresAt = Date.now() + (action.payload.expires_in * 1000);
        // Inject token into API client for subsequent requests
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${action.payload.token}`;
      })
      .addCase(verifyOtp.rejected,  (state, action) => {
        state.loading = false;
        state.error   = action.payload as string;
      });
  },
});

export const { logout, setFcmToken, clearError } = authSlice.actions;
export default authSlice.reducer;
