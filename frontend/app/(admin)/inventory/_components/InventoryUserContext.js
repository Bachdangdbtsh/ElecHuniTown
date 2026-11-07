'use client';

import { createContext, useContext } from 'react';

const InventoryUserContext = createContext(null);

export function InventoryUserProvider({ user, children }) {
  return <InventoryUserContext.Provider value={user}>{children}</InventoryUserContext.Provider>;
}

export function useInventoryUser() {
  const user = useContext(InventoryUserContext);
  if (!user) throw new Error('useInventoryUser must be used inside InventoryUserProvider');
  return user;
}
