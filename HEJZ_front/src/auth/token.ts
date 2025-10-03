import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'accessToken';

export async function saveToken(token: string) {
  await AsyncStorage.setItem(KEY, token);
}
export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEY);
}
export async function clearToken() {
  await AsyncStorage.removeItem(KEY);
}
