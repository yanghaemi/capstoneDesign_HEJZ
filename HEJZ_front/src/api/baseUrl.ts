// src/api/baseUrl.ts
import { Platform } from 'react-native';

export const BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8080'   // 에뮬레이터
    : 'http://localhost:8080';

// 나중에 갤럭시 + USB reverse 쓰면 아래로 바꾸면 됨
// export const BASE_URL = 'http://127.0.0.1:8080';
