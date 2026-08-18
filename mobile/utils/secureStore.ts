import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const memoryStorage: Record<string, string> = {};

export const saveItem = async (key: string, value: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      memoryStorage[key] = value;
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.warn(`SecureStore saveItem error for key "${key}":`, error);
    memoryStorage[key] = value;
  }
};

export const getItem = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const stored = window.sessionStorage.getItem(key);
        if (stored) return stored;
      }
      return memoryStorage[key] || null;
    }
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.warn(`SecureStore getItem error for key "${key}":`, error);
    return memoryStorage[key] || null;
  }
};

export const deleteItem = async (key: string): Promise<void> => {
  try {
    delete memoryStorage[key];
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.warn(`SecureStore deleteItem error for key "${key}":`, error);
  }
};
