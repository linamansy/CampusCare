const fs = require('fs');
const path = require('path');
const supabase = require('../utils/supabaseClient');

const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'campuscare-images';

/**
 * Uploads a file (buffer or local path) to Supabase Storage and returns the public URL
 * @param {string|Buffer} fileSource - Path to the local file or a Buffer
 * @param {string} destinationPath - Path in the Supabase bucket (e.g. 'issues/image.jpg')
 * @param {string} [mimeType='image/jpeg'] - MIME type of the file
 * @returns {Promise<string>} Public URL of the uploaded image
 */
exports.uploadToSupabase = async (fileSource, destinationPath, mimeType = 'image/jpeg') => {
  try {
    if (!fileSource) {
      throw new Error('No file source provided for upload');
    }

    let fileBody;
    if (Buffer.isBuffer(fileSource)) {
      fileBody = fileSource;
    } else if (typeof fileSource === 'string') {
      if (!fs.existsSync(fileSource)) {
        throw new Error(`File not found at path: ${fileSource}`);
      }
      fileBody = fs.readFileSync(fileSource);
    } else {
      throw new Error('Invalid file source type');
    }

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(destinationPath, fileBody, {
        upsert: true,
        contentType: mimeType,
        cacheControl: '3600'
      });

    if (error) {
      console.error('Supabase Storage Error Details:', error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(destinationPath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('Failed to retrieve public URL from Supabase');
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Detailed Supabase Upload Error:', error);
    throw new Error(`Failed to upload image to storage: ${error.message}`);
  } finally {
    // Cleanup local file after upload attempt ONLY if it was a path
    if (typeof fileSource === 'string' && fs.existsSync(fileSource)) {
      try {
        fs.unlinkSync(fileSource);
      } catch (unlinkError) {
        console.error('Failed to delete local temp file:', unlinkError);
      }
    }
  }
};
