import { createContext, useContext, useReducer, useMemo } from 'react';

export const PaymentContext = createContext();

const intialState = {
    status: "idle",
    error: null,
    paymentId: null,
}

function paymentReducer(state, action) {
    switch (action.type) {
        case "IDLE":
            return { ...state, status: "idle" };
        case "CREATED_LOCAL":
            return {...state, status: "CREATED_LOCAL" };
        case "SUBMIT_REQUEST":
            return { ...state, status: "SUBMITTING" };
        case "SUBMIT_SUCCESS":
            return { ...state, status: "PROCESSING", paymentId: action.paymentId };
        case "SUBMIT_FAILURE":
            return { ...state, status: "FAILED", error: action.error };
        case "RECONCILE_PROCESSING":
            return { ...state, status: "PROCESSING" };
        case "RECONCILE_SUCCESS":
            return {
                ...state,
                status: "SUCCESS",
                paymentId: action.paymentId
            };

        case "RECONCILE_FAILURE":
            return {
                ...state,
                status: "FAILED",
                error: action.error
            };

        case "EXPIRE":
            return { ...state, status: "EXPIRED" };

        case "RESET":
            return intialState;

        default:
            return state;
    }
}

export default function PaymentContextProvider({ children }) {
    const [state, dispatch] = useReducer(paymentReducer, intialState);
    const value = useMemo(() => ({
        state,
        dispatch,
    }), [state, dispatch]);
    return (
        <PaymentContext.Provider value={value}>
            {children}
        </PaymentContext.Provider>
    )
}

export function usePayment() {
    let context = useContext(PaymentContext);
    if (!context) {
        throw new Error("usePayment must be used within a PaymentContextProvider");
    }
    return context;
}
