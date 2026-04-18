import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TicketItem {
  id: number;
  title: string;
  status: 'open' | 'assigned' | 'resolved' | 'escalated';
  district?: string;
}

interface TicketsState {
  items: TicketItem[];
}

const initialState: TicketsState = {
  items: [],
};

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    setTickets: (state, action: PayloadAction<TicketItem[]>) => {
      state.items = action.payload;
    },
    clearTickets: (state) => {
      state.items = [];
    },
  },
});

export const { setTickets, clearTickets } = ticketsSlice.actions;
export default ticketsSlice.reducer;
