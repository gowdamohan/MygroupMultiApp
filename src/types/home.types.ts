// Home Page TypeScript Interfaces

export interface AppDetails {
  id: number;
  create_id: number;
  name: string;
  icon: string;
  logo?: string;
  name_image?: string;
  url: string;
  description?: string;
  background_color?: string;
  status?: number;
}

export interface TopIconList {
  myapps: AppDetails[];
  myCompany: AppDetails[];
  online: AppDetails[];
  offline: AppDetails[];
}

export interface Logo {
  id: number;
  name_image: string;
  logo: string;
}

export interface SocialLink {
  id: number;
  group_id: number;
  platform: string; // youtube, facebook, instagram, twitter, linkedin, website, blog
  url: string;
  icon?: string;
}

export interface AboutUs {
  id: number;
  group_id: number;
  title: string;
  content: string;
  image: string;
}

export interface MainAds {
  id: number;
  ads1?: string;
  ads2?: string;
  ads3?: string;
  ads1_url?: string;
  ads2_url?: string;
  ads3_url?: string;
}

export interface Newsroom {
  id: number;
  title: string;
  description: string;
  image: string;
  content: string;
  created_at?: string;
}

export interface Awards {
  id: number;
  title: string;
  description: string;
  image: string;
  content: string;
  award_date?: string;
  created_at?: string;
}

export interface Events {
  id: number;
  title: string;
  description: string;
  image: string;
  content: string;
  event_date?: string;
  location?: string;
  created_at?: string;
}

export interface Gallery {
  image_id: number;
  gallery_id: number;
  image_name: string;
  title?: string;
  description?: string;
}

export interface Testimonial {
  id: number;
  name: string;
  designation: string;
  image: string;
  testimonial: string;
  rating: number; // 1-5 star rating
}

export interface CopyRight {
  id: number;
  text: string;
  year?: number;
  company_name?: string;
}

export interface HomeData {
  logo: Logo;
  topIcon: TopIconList;
  socialLink: SocialLink[];
  copyRight?: CopyRight;
  aboutUs: AboutUs[];
  mainAds?: MainAds;
  newsroom?: Newsroom;
  awards?: Awards;
  event?: Events;
  gallery?: Gallery;
  testimonials: Testimonial[];
}

export interface MobileHomeResponse {
  success: boolean;
  data: HomeData;
  message?: string;
}

