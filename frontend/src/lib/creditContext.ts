import { createContext, useContext } from "react";

export interface CreditContextValue {
  balance: number | null;
  refresh: () => void;
}

export const CreditContext = createContext<CreditContextValue>({
  balance: null,
  refresh: () => {},
});

export function useCredits(): CreditContextValue {
  return useContext(CreditContext);
}
