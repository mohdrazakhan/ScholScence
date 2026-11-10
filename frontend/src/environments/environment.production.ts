export const environment = {
  production: true,
  apiUrl: 'https://scholscence-backend.onrender.com/api/v1',
  supabaseUrl: 'https://ayuwznogkbphpqukaoeo.supabase.co',
  supabaseKey: 'sb_publishable_5-moe9UnjB1y9R9AdBPVQg_SFrOU_Gs',
  redisCache: {
    enabled: false, // Set to true when Redis Gateway / Upstash is configured
    endpoint: '',   // e.g. 'https://redis-cache.schoolsense.in' or Upstash REST endpoint
    token: '',
  },
};

