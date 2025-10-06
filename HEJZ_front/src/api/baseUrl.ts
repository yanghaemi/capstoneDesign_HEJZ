// src/api/baseUrl.ts
import { Platform } from 'react-native';

/**
 * ✅ 사용법 요약
 * - 지금 상황(실기기 Wi-Fi): LAN_IP만 네 PC IP로 두고, 아래 USE_LAN = true 유지 (기본값).
 * - USB + adb reverse: 터미널에서 `adb reverse tcp:8080 tcp:8080` → USE_ADB_REVERSE = true
 * - 안드 에뮬레이터: USE_LAN/USE_ADB_REVERSE 둘 다 false → 10.0.2.2 사용
 *
 * 배포 시: PROD_URL만 실제 배포 API 도메인으로 바꾸면 끝.
 */

// 🔧 개발 포트 & PC LAN IP (누나 PC: 192.168.0.6)
const DEV_PORT = 8080;
const LAN_IP = '192.168.0.6';

// 🔀 모드 스위치 (상황에 맞게 true/false만 바꾸면 됨)
const USE_LAN = true;          // 실기기(Wi-Fi)에서 PC로 직접 붙기
const USE_ADB_REVERSE = false; // USB 연결 + `adb reverse` 쓸 때

// 🔗 개발용 URL들
const DEV_URLS = {
  emulator: `http://10.0.2.2:${DEV_PORT}`,  // Android 에뮬레이터 전용
  lan: `http://${LAN_IP}:${DEV_PORT}`,      // 실기기 ↔ PC(LAN)
  reverse: `http://127.0.0.1:${DEV_PORT}`,  // adb reverse 사용 시
};

// 🚀 배포 엔드포인트 (배포 시 이거만 바꾸면 됨)
const PROD_URL = 'https://prod.api.yourdomain.com';

// 🧭 개발 환경에서의 베이스 URL 선택
function getDevBaseUrl() {
  if (Platform.OS === 'android') {
    if (USE_ADB_REVERSE) return DEV_URLS.reverse;
    if (USE_LAN) return DEV_URLS.lan;
    return DEV_URLS.emulator;
  }
  // iOS(시뮬/실기기)는 보통 LAN으로 붙는 게 가장 간단
  return DEV_URLS.lan;
}

// 📌 최종 BASE_URL
export const BASE_URL = __DEV__ ? getDevBaseUrl() : PROD_URL;
export default BASE_URL;

// (선택) 디버그 로그: 필요 없으면 주석 처리
if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log('[BASE_URL]', BASE_URL);
}
