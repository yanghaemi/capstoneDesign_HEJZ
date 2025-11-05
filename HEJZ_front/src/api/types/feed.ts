export type ImageDto = { url: string; ord: number };

export type FeedItemDto = {
  id: number;
  userId: number;
  content: string;
  images: ImageDto[];
  createdAt: string;
};

export type FeedListResponse = {
  items: FeedItemDto[];
  nextCursor: string | null;
};

export type FeedCreateRequest = {
  content: string;
  //songId: number;              // ✅ 필수
  emotion: string;             // ✅ 소문자
  genre: string;               // ✅ 소문자
  imageUrls?: string[];        // 서버에 있음(옵션) — 간단히 쓰기 좋음
  media?: MediaUrlRequest[];   // 서버에 있음(옵션) — 정렬/타입 줄 때 유용
};
