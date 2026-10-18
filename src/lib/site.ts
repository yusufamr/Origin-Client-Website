// Shared contact details and social links, used by the footer, hero and portfolio teaser.
export const WHATSAPP_NUMBER = '+20 127 368 3473';
export const WHATSAPP_LINK = 'https://wa.me/201273683473';
export const PHONE_LINK = 'tel:+201273683473';
export const MAPS_LINK = 'https://maps.app.goo.gl/SziKtrcp2LiKLaMp9';

export type SocialName = 'instagram' | 'tiktok' | 'facebook' | 'youtube' | 'whatsapp';

export const SOCIAL_LINKS: { name: SocialName; href: string }[] = [
  { name: 'instagram', href: 'https://www.instagram.com/originupvc?igsh=M283YTZlN2luYWlm' },
  { name: 'tiktok', href: 'https://www.tiktok.com/@origin.upvc.for.w?_r=1&_t=ZS-98WKUjvqZqW' },
  { name: 'facebook', href: 'https://www.facebook.com/share/1G5k9S5XuD/?mibextid=wwXIfr' },
  { name: 'youtube', href: 'https://www.youtube.com/@OriginUPVC' },
  { name: 'whatsapp', href: WHATSAPP_LINK },
];

// The fixed product range shown in the home page's "Our Products" section.
// Titles and descriptions live in the i18n dictionaries under services.items.
export const PRODUCTS: {
  key: 'windows' | 'shutters' | 'doors' | 'showers';
  icon: 'windows' | 'shutters' | 'door' | 'shower';
}[] = [
  { key: 'windows', icon: 'windows' },
  { key: 'shutters', icon: 'shutters' },
  { key: 'doors', icon: 'door' },
  { key: 'showers', icon: 'shower' },
];
