import heroFloorImg from '../assets/images/energym_hero_barbell_1794722262628.jpg';
import galleryFreeWeightsImg from '../assets/images/gym_free_weights_1794557694311.jpg';
import gallerySquatRacksImg from '../assets/images/gym_squat_racks_1794557692599.jpg';
import galleryCardioZoneImg from '../assets/images/gym_cardio_zone_1794557695205.jpg';
import galleryFunctionalTurfImg from '../assets/images/gym_functional_turf_1794557695132.jpg';
import galleryCableMachinesImg from '../assets/images/gym_cable_machines_1794557695128.jpg';
import galleryStretchingAreaImg from '../assets/images/gym_stretching_area_1794557695847.jpg';
import trainerRohitImg from '../assets/images/trainer_rohit_sharma_1794557696132.jpg';
import trainerAnanyaImg from '../assets/images/trainer_ananya_verma_1794557696005.jpg';
import trainerVikramImg from '../assets/images/trainer_vikram_patel_1794557696697.jpg';

export interface GalleryPhoto {
  id: string;
  src: string;
  alt: string;
  caption: string;
  placeholderLabel: string;
}

export interface TrainerProfile {
  id: string;
  name: string;
  speciality: string;
  experienceYears: number;
  photoSrc: string;
  photoAlt: string;
  placeholderLabel: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  priceInr: number;
  billingPeriod: string;
  popular?: boolean;
  description: string;
  features: string[];
}

export interface GymTiming {
  days: string;
  hours: string;
}

/**
 * ============================================================================
 * ENERGYM SINGLE CONFIGURATION OBJECT
 * ============================================================================
 * Update phone numbers, address, timings, membership prices, trainer profiles,
 * social links, and image paths below. Replace any imported image with a new
 * local file import or a public path string (e.g. "/images/photo.jpg").
 * ============================================================================
 */
export const ENERGYM_CONFIG = {
  business: {
    name: 'Energym',
    brandPrefix: 'ENER',
    brandAccent: 'GYM',
    tagline:
      '24×7 strength, conditioning, alternate-day steam recovery, and personal coaching in Vijay Nagar, Indore.',
    address:
      '170, 171 ENERGYM, Scheme Number 78, Part II, Scheme 78, Vijay Nagar, Indore, Madhya Pradesh 452010',
    shortLocation: 'Scheme 78, Vijay Nagar, Indore',
    phoneDisplay: '08770964099',
    phoneHref: 'tel:+918770964099',
    whatsappDisplay: '+91 8770964099',
    whatsappDigits: '918770964099',
    googleMapsUrl: 'https://maps.app.goo.gl/egJeseyN5smAnpnr6',
    googleMapsEmbedUrl:
      'https://maps.google.com/maps?q=170,+171+ENERGYM,+Scheme+Number+78,+Part+II,+Vijay+Nagar,+Indore,+Madhya+Pradesh+452010&t=&z=16&ie=UTF8&iwloc=&output=embed',
    copyrightText: '© 2026 Energym. All rights reserved.',
  },

  timings: [
    { days: 'Gym Hours (Mon – Sun)', hours: 'Open 24×7' },
    { days: 'Steam Facility', hours: '3× / Week (Alternate Days)' },
  ] satisfies GymTiming[],

  navigation: [
    { label: 'Home', href: '#home' },
    { label: 'Gym', href: '#gym' },
    { label: 'Trainers', href: '#trainers' },
    { label: 'Membership', href: '#membership' },
    { label: 'Contact', href: '#contact' },
  ],

  hero: {
    locationLine: 'Scheme 78, Part II · Vijay Nagar, Indore · Open 24×7',
    headline: 'Train Hard. Stay Energised.',
    subtext:
      'Open 24×7 with commercial strength machines, heavy free weights, alternate-day steam recovery, and certified coaches.',
    primaryCtaLabel: 'Book Free Trial',
    secondaryCtaLabel: 'Call Now',
    imageSrc: heroFloorImg,
    imageAlt:
      'Athlete chalking hands over a loaded barbell under spotlight on Energym concrete training floor in Vijay Nagar, Indore',
    placeholderLabel: 'Hero Gym Floor Photo (16:9)',
  },

  freeTrial: {
    heading: 'Try Energym Free for 1 Day',
    subheading:
      'Experience our 24×7 equipment floor, meet the coaching team, and complete an assessment session before choosing a plan.',
    noPaymentNote: 'No payment needed',
    goals: [
      'Muscle Gain & Strength',
      'Fat Loss & Conditioning',
      'General Fitness & Mobility',
      'Personal Training Enquiry',
    ],
    preferredTimes: [
      'Early Morning (4:00 AM – 8:00 AM)',
      'Morning (8:00 AM – 12:00 PM)',
      'Afternoon (12:00 PM – 4:00 PM)',
      'Evening (4:00 PM – 8:00 PM)',
      'Night (8:00 PM – 12:00 AM)',
      'Late Night (12:00 AM – 4:00 AM · 24×7)',
    ],
  },

  gallery: [
    {
      id: 'free-weights',
      src: galleryFreeWeightsImg,
      alt: 'Energym free-weight zone with hex dumbbells and adjustable benches',
      caption: 'Free Weight Zone — Full Dumbbell Rack & Benches',
      placeholderLabel: 'Gym Photo 1 — Free Weights',
    },
    {
      id: 'squat-racks',
      src: gallerySquatRacksImg,
      alt: 'Heavy-duty squat racks and calibrated weight plates at Energym Indore',
      caption: 'Strength Bay — Heavy Squat Racks & Weight Plates',
      placeholderLabel: 'Gym Photo 2 — Squat Racks',
    },
    {
      id: 'cardio-zone',
      src: galleryCardioZoneImg,
      alt: 'Cardio conditioning deck with curved treadmills, rowers, and air bikes',
      caption: 'Cardio Deck — Treadmills, Rowers & Air Bikes',
      placeholderLabel: 'Gym Photo 3 — Cardio Zone',
    },
    {
      id: 'functional-turf',
      src: galleryFunctionalTurfImg,
      alt: 'Indoor sprint turf lane with sled, battle ropes, and kettlebells',
      caption: 'Conditioning Turf — Sleds, Kettlebells & Ropes',
      placeholderLabel: 'Gym Photo 4 — Functional Turf',
    },
    {
      id: 'cable-machines',
      src: galleryCableMachinesImg,
      alt: 'Multi-station cable crossover and lat pulldown equipment at Energym',
      caption: 'Machine Floor — Cable Stations & Isolated Pulleys',
      placeholderLabel: 'Gym Photo 5 — Cable Machines',
    },
    {
      id: 'stretching-area',
      src: galleryStretchingAreaImg,
      alt: 'Dedicated recovery and mobility zone with mats, rollers, and plyo boxes',
      caption: 'Mobility & Core Area — Recovery & Warm-Up Floor',
      placeholderLabel: 'Gym Photo 6 — Mobility Zone',
    },
  ] satisfies GalleryPhoto[],

  // Replace placeholder coach details and portraits with your actual Energym trainers
  trainers: [
    {
      id: 'coach-rohit',
      name: 'Rohit Sharma',
      speciality: 'Strength & Powerlifting',
      experienceYears: 7,
      photoSrc: trainerRohitImg,
      photoAlt: 'Coach Rohit Sharma, Strength and Powerlifting trainer at Energym',
      placeholderLabel: 'Trainer Photo 1 — Replace in energymConfig.ts',
    },
    {
      id: 'coach-ananya',
      name: 'Ananya Verma',
      speciality: 'Fat Loss & Functional Mobility',
      experienceYears: 5,
      photoSrc: trainerAnanyaImg,
      photoAlt: 'Coach Ananya Verma, Fat Loss and Functional Mobility trainer at Energym',
      placeholderLabel: 'Trainer Photo 2 — Replace in energymConfig.ts',
    },
    {
      id: 'coach-vikram',
      name: 'Vikram Patel',
      speciality: 'Hypertrophy & Sports Nutrition',
      experienceYears: 8,
      photoSrc: trainerVikramImg,
      photoAlt: 'Coach Vikram Patel, Hypertrophy and Sports Nutrition trainer at Energym',
      placeholderLabel: 'Trainer Photo 3 — Replace in energymConfig.ts',
    },
  ] satisfies TrainerProfile[],

  // Update ₹ membership pricing and included features below
  memberships: [
    {
      id: 'monthly',
      name: 'Monthly',
      priceInr: 1500,
      billingPeriod: '1 Month',
      popular: false,
      description: 'Flexible 24×7 month-to-month access with steam recovery.',
      features: [
        '24×7 access to strength & cardio floor',
        'Steam facility (3 days/week, alternate days)',
        'General floor trainer guidance',
        'Locker access & initial fitness assessment',
      ],
    },
    {
      id: '3-months',
      name: '3 Months',
      priceInr: 3500,
      billingPeriod: '3 Months',
      popular: true,
      description: 'Popular starter block for measurable strength and fat-loss results.',
      features: [
        'Everything in Monthly (24×7 + Steam)',
        'Custom 12-week workout split',
        'Monthly progress & form check-in',
        'Basic nutrition & macro guidelines',
        '1 guest pass for a friend per month',
      ],
    },
    {
      id: '6-months',
      name: '6 Months',
      priceInr: 6000,
      billingPeriod: '6 Months',
      popular: false,
      description: 'Consistent half-year transformation block with steady coaching.',
      features: [
        'Everything in 3 Months (24×7 + Steam)',
        'Bi-monthly body composition review',
        'Updated strength progression split',
        'Diet consultation & habit tracking',
        'Up to 15 days membership freeze option',
      ],
    },
    {
      id: '12-months',
      name: '12 Months',
      priceInr: 8000,
      billingPeriod: '12 Months',
      popular: false,
      description: 'Best annual value for year-round consistency and priority coaching.',
      features: [
        '24×7 × 365 access + alternate-day steam',
        'Quarterly personalized training review',
        'Priority booking for personal training',
        'Diet consultation & habit tracking',
        'Up to 30 days membership freeze option',
      ],
    },
  ] satisfies MembershipPlan[],

  socialLinks: {
    instagram: 'https://instagram.com/',
    facebook: 'https://facebook.com/',
  },
};
