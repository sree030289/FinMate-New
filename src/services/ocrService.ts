import AsyncStorage from '@react-native-async-storage/async-storage';
import { getConfig, setConfig } from '../utils/config';
import * as ImageManipulator from 'expo-image-manipulator';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

/**
 * Store OCR API key securely 
 */
export const storeAPIKey = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(getConfig('STORAGE_KEYS').OCR_API_KEY, key);
    // Also update runtime config
    setConfig('OCR_API_KEY', key);
  } catch (error) {
    console.error('Error storing OCR API key:', error);
    throw error;
  }
};

/**
 * Retrieve the stored API key
 */
export const getAPIKey = async (): Promise<string | null> => {
  try {
    // First check runtime config
    const runtimeKey = getConfig('OCR_API_KEY');
    if (runtimeKey) return runtimeKey;
    
    // Otherwise try to load from storage
    const storedKey = await AsyncStorage.getItem(getConfig('STORAGE_KEYS').OCR_API_KEY);
    
    // Update runtime config if key was found in storage
    if (storedKey) {
      setConfig('OCR_API_KEY', storedKey);
    }
    
    return storedKey;
  } catch (error) {
    console.error('Error retrieving OCR API key:', error);
    return null;
  }
};

/**
 * Check if API key is configured
 */
export const isAPIKeySet = async (): Promise<boolean> => {
  const key = await getAPIKey();
  return !!key && key.length > 0;
};

/**
 * Process image with OCR.space API
 */
export const processImageWithOCR = async (base64Image: string): Promise<any> => {
  const apiKey = await getAPIKey();
  
  if (!apiKey) {
    throw new Error('OCR API key not configured. Please configure it in OCR API Settings.');
  }
  
  try {
    const formData = new FormData();
    formData.append('base64Image', `data:image/jpeg;base64,${base64Image}`);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('scale', 'true');
    formData.append('detectOrientation', 'true');
    
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': apiKey,
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`OCR API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error processing image with OCR:', error);
    throw error;
  }
};

/**
 * Image pre-processing to improve OCR results
 */
export const preprocessImage = async (imageUri: string): Promise<string> => {
  try {
    // Apply a series of image processing operations to improve OCR quality
    const manipulatedImage = await manipulateAsync(
      imageUri,
      [
        // Step 1: Resize for optimal OCR performance (not too large, not too small)
        { resize: { width: 1200 } },
        
        // Step 2: Increase contrast to make text more readable
        { sharpen: 0.7 },
        
        // Step 3: Convert to grayscale for better text recognition
        { grayscale: true },
        
        // Step 4: Adjust brightness/contrast for better text visibility
        { brightness: 0.1 },
        { contrast: 1.2 }
      ],
      { format: SaveFormat.JPEG, compress: 0.8 }
    );
    
    // Return the URI of the preprocessed image
    return manipulatedImage.uri;
  } catch (error) {
    console.error('Error preprocessing image:', error);
    // If preprocessing fails, return the original image
    return imageUri;
  }
};

/**
 * Batch process multiple receipts
 */
export const batchProcessReceipts = async (imageUris: string[]): Promise<any[]> => {
  try {
    // Process receipts in parallel for efficiency
    const preprocessPromises = imageUris.map(uri => preprocessImage(uri));
    const preprocessedImages = await Promise.all(preprocessPromises);
    
    // Process each preprocessed image with OCR
    const ocrResults = [];
    
    for (const imageUri of preprocessedImages) {
      try {
        // Convert image to base64
        const base64 = await imageUriToBase64(imageUri);
        
        // Process with OCR
        const ocrResult = await processImageWithOCR(base64);
        
        // Extract data
        const extractedData = await extractReceiptData(ocrResult);
        
        // Add original image URI
        extractedData.imageUrl = imageUri;
        
        ocrResults.push({
          success: true,
          data: extractedData
        });
      } catch (error) {
        console.error('Error processing individual receipt:', error);
        ocrResults.push({
          success: false,
          error: error.message,
          imageUrl: imageUri
        });
      }
    }
    
    return ocrResults;
  } catch (error) {
    console.error('Error in batch processing receipts:', error);
    throw error;
  }
};

/**
 * Convert image URI to base64
 */
export const imageUriToBase64 = async (uri: string): Promise<string> => {
  try {
    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

/**
 * Extract receipt data from OCR results
 */
export const extractReceiptData = async (ocrResult: any): Promise<any> => {
  try {
    if (!ocrResult.ParsedResults || ocrResult.ParsedResults.length === 0) {
      throw new Error('No parsed results found');
    }
    
    // Get the parsed text
    const parsedText = ocrResult.ParsedResults[0].ParsedText;
    
    // Basic extraction with our predefined logic
    const basicExtraction = {
      vendor: extractVendorName(parsedText) || 'Unknown Vendor',
      date: extractDate(parsedText) || new Date().toISOString().split('T')[0],
      total: extractTotal(parsedText) || 0,
      items: extractItems(parsedText) || [],
      tax: extractTax(parsedText) || 0,
      category: guessCategory(parsedText) || 'other',
    };
    
    // Import aiService for enhanced processing
    const { enhanceReceiptData } = await import('./aiService');
    
    // Enhance with AI if available
    try {
      return await enhanceReceiptData(parsedText, basicExtraction);
    } catch (aiError) {
      console.log('AI enhancement failed, using basic extraction', aiError);
      return basicExtraction;
    }
  } catch (error) {
    console.error('Error extracting receipt data:', error);
    throw error;
  }
};

// Helper functions for parsing receipt text
function extractVendorName(text: string): string | null {
  // Very simplified example - real implementation would be more robust
  const firstLine = text.split('\n')[0];
  return firstLine || null;
}

function extractDate(text: string): string | null {
  // Look for date patterns in the text
  const datePattern = /\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}/g;
  const matches = text.match(datePattern);
  return matches ? matches[0] : null;
}

function extractTotal(text: string): number | null {
  // Look for total patterns like "Total: $123.45"
  const totalPattern = /total\s*:?\s*[$₹€£]?\s*(\d+[.,]\d{2})/i;
  const match = text.match(totalPattern);
  if (match && match[1]) {
    return parseFloat(match[1].replace(',', '.'));
  }
  return null;
}

function extractItems(text: string): any[] {
  // This would be a complex function to extract line items
  // For now, just return an empty array
  return [];
}

function extractTax(text: string): number | null {
  // Look for tax/VAT patterns
  const taxPattern = /tax|vat|gst\s*:?\s*[$₹€£]?\s*(\d+[.,]\d{2})/i;
  const match = text.match(taxPattern);
  if (match && match[1]) {
    return parseFloat(match[1].replace(',', '.'));
  }
  return null;
}

function guessCategory(text: string): string | null {
  // Simple category guessing based on keywords
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('grocer') || lowerText.includes('market') || lowerText.includes('food')) {
    return 'groceries';
  }
  if (lowerText.includes('restaurant') || lowerText.includes('cafe') || lowerText.includes('diner')) {
    return 'food';
  }
  if (lowerText.includes('transport') || lowerText.includes('taxi') || lowerText.includes('uber')) {
    return 'transportation';
  }
  
  return null;
}

export default {
  storeAPIKey,
  getAPIKey,
  isAPIKeySet,
  processImageWithOCR,
  extractReceiptData,
  preprocessImage,
  batchProcessReceipts,
  imageUriToBase64
};
