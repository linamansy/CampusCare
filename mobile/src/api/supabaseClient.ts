import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const getSupabaseConfig = () => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tjtbaxvhdipjxjazvzri.supabase.co';
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  const bucket = process.env.EXPO_PUBLIC_SUPABASE_BUCKET || 'campuscare-images';
  
  return { url, anonKey, bucket };
};

const config = getSupabaseConfig();

export const supabase = createClient(config.url, config.anonKey);
export const SUPABASE_BUCKET = config.bucket;

/**
 * Uploads an image to Supabase Storage directly from mobile
 */
export const uploadImageToSupabase = async (uri: string, path: string, type: string) => {
  try {
    console.log('[Supabase Debug] Uploading image:', uri, 'to', path);
    
    // Fetch the file as a blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(path, blob, {
        contentType: type,
        upsert: true
      });
      
    if (error) {
      console.error('[Supabase Error] Storage upload failed:', error);
      throw error;
    }
    
    const { data: publicUrlData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(path);
      
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('[Supabase Error] Direct upload catch:', err);
    throw err;
  }
};
