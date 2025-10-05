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
  imageUrls?: string[]; // 지금은 여기에 영상 URL도 넣자
};
