export interface User {
  id: number;
  username: string;
  email?: string | null;
  phone?: string | null;
  github_id?: string | null;
  avatar?: string | null;
  neighborhood?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  title: string;
  price: number;
  photo: string;
  description: string;
  status?: string;
  user_id: number;
  user: {
    id: number;
    username: string;
    avatar?: string | null;
    neighborhood?: string | null;
  };
  favorite_count: number;
  views: number;
  neighborhood?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductListResponse {
  data: Product[];
  next_cursor: number | null;
  has_more: boolean;
}


export interface PostAuthor {
  id: number;
  username: string;
  avatar?: string | null;
  neighborhood?: string | null;
}

export interface PostImage {
  id: number;
  url: string;
}

export interface Comment {
  id: number;
  payload: string;
  created_at: string;
  user: {
    id: number;
    username: string;
    avatar?: string | null;
  };
}

export interface PostListItem {
  id: number;
  topic: string;
  title: string;
  description?: string | null;
  views: number;
  created_at: string;
  comment_count: number;
  author: PostAuthor;
}

export interface PostDetail {
  id: number;
  topic: string;
  title: string;
  description?: string | null;
  views: number;
  created_at: string;
  author: PostAuthor;
  images: PostImage[];
  comments: Comment[];
}

export interface Post extends PostListItem {}

export interface PostListResponse {
  data: PostListItem[];
  next_cursor: number | null;
  has_more: boolean;
}


export interface ChatRoom {
  id: string;
  created_at: string;
  updated_at: string;
  users?: User[];
}

export interface ChatRoomDetail extends ChatRoom {
  product_id: number;
  buyer_id: number;
  seller_id: number;
  product: Product;
  buyer: PostAuthor;
  seller: PostAuthor;
  ticket?: string;
}

export interface Message {
  id: number;
  payload: string;
  created_at: string;
  userId: number;
  chatRoomId: string;
  user: {
    username: string;
    avatar?: string | null;
  };
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface LikeStatus {
  likeCount: number;
  isLiked: boolean;
}

export interface ApiError {
  detail: string;
}

export interface ValidationError {
  fieldErrors: Record<string, string[]>;
  formErrors?: string[];
}
