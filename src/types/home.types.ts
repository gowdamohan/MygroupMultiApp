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

/** Generic footer_page row (group_name = 'corporate') */
export interface FooterPageItem {
  id: number;
  footer_page_type?: string;
  title?: string;
  tag_line?: string;
  image?: string;
  content?: string;
  url?: string;
  event_date?: string;
  year?: number;
  group_name?: string;
}

/** A single image from gallery_images_master */
export interface GalleryImageItem {
  image_id: number;
  gallery_id: number;
  image_name: string;
  image_description?: string | null;
  gallery_name?: string | null;
  group_id?: number | null;
}

export interface HomeData {
  logo: Logo;
  topIcon: TopIconList;
  socialLink: SocialLink[];
  copyRight?: CopyRight;
  mainAds?: MainAds;

  // ── footer_page arrays (group_name = 'corporate') ──
  clients: FooterPageItem[];          // footer_page_type = 'clients'
  eventsList: FooterPageItem[];       // footer_page_type = 'events'
  newsroomList: FooterPageItem[];     // footer_page_type = 'newsroom'
  awardsList: FooterPageItem[];       // footer_page_type = 'awards'
  testimonialsList: FooterPageItem[]; // footer_page_type = 'testimonials'
  galleryImages: GalleryImageItem[];  // gallery_list + gallery_images_master

  // ── Legacy single-item fields (mobile / backward compat) ──
  aboutUs: AboutUs[];
  newsroom?: Newsroom | null;
  awards?: Awards | null;
  event?: Events | null;
  gallery?: Gallery | null;
  testimonials: Testimonial[];
}

export interface MobileHomeResponse {
  success: boolean;
  data: HomeData;
  message?: string;
}

