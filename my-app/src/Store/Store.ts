import {configureStore,createSlice,PayloadAction} from '@reduxjs/toolkit'

const initialState = {
    isConnected: false,
}

const connectSlice = createSlice({
    name: "auth",
    initialState: initialState,
    reducers: {
        setConnect: (state, action: PayloadAction<typeof initialState.isConnected>) => {
            state.isConnected = action.payload
        },
        delConnect: (state) => {
            state.isConnected = false
        }
    }
})


export const {setConnect} = connectSlice.actions;
export const {delConnect} = connectSlice.actions;

const store = configureStore({
    reducer: {
        connect: connectSlice.reducer,
    }
})

export type RStore = ReturnType<typeof store.getState>

export {store}