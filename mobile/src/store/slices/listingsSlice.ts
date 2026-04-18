import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ListingItem {
  id: number;
  crop_type: string;
  quantity_kg: number;
  asking_price_bdt: number;
}

interface ListingsState {
  items: ListingItem[];
}

const initialState: ListingsState = {
  items: [],
};

const listingsSlice = createSlice({
  name: 'listings',
  initialState,
  reducers: {
    setListings: (state, action: PayloadAction<ListingItem[]>) => {
      state.items = action.payload;
    },
    clearListings: (state) => {
      state.items = [];
    },
  },
});

export const { setListings, clearListings } = listingsSlice.actions;
export default listingsSlice.reducer;
