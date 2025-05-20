/**
 * AI Service for enhanced analytics and OCR capabilities
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getConfig } from '../utils/config';

// Types
export type Category = 'groceries' | 'food' | 'transportation' | 'entertainment' | 'utilities' | 'shopping' | 'healthcare' | 'education' | 'other';

/**
 * Enhanced receipt item extraction with AI
 */
export const enhanceReceiptData = async (parsedText: string, originalExtraction: any): Promise<any> => {
  try {
    const apiKey = getConfig('AI_API_KEY');
    
    if (!apiKey) {
      console.log('No AI API key configured, using basic extraction');
      return originalExtraction;
    }
    
    // Sample request to an AI service (replace with actual implementation)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an AI specialized in extracting structured data from receipt text. Extract vendor name, date, total amount, tax amount, and line items with quantities and prices."
          },
          {
            role: "user",
            content: `Extract structured data from this receipt: ${parsedText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }
    
    const result = await response.json();
    const enhancedData = parseAIResponse(result.choices[0].message.content);
    
    // Merge AI extraction with original extraction, preferring AI where available
    return {
      ...originalExtraction,
      ...enhancedData,
      // Keep original image URL
      imageUrl: originalExtraction.imageUrl
    };
  } catch (error) {
    console.error('AI enhancement error:', error);
    // Fall back to original extraction if AI enhancement fails
    return originalExtraction;
  }
};

/**
 * Parse the AI response into structured data
 */
const parseAIResponse = (aiResponse: string): any => {
  try {
    // Try to parse as JSON if the response is in JSON format
    try {
      return JSON.parse(aiResponse);
    } catch (e) {
      // Not JSON, continue with text parsing
    }
    
    // Basic parsing for various formats
    const result: any = {};
    
    // Extract vendor
    const vendorMatch = aiResponse.match(/vendor:?\s*"?([^"\n]+)"?/i);
    if (vendorMatch) result.vendor = vendorMatch[1].trim();
    
    // Extract date
    const dateMatch = aiResponse.match(/date:?\s*"?([^"\n]+)"?/i);
    if (dateMatch) result.date = dateMatch[1].trim();
    
    // Extract total
    const totalMatch = aiResponse.match(/total:?\s*"?\$?£?€?₹?(\d+[.,]\d{2})"?/i);
    if (totalMatch) result.total = parseFloat(totalMatch[1].replace(',', '.'));
    
    // Extract tax
    const taxMatch = aiResponse.match(/tax:?\s*"?\$?£?€?₹?(\d+[.,]\d{2})"?/i);
    if (taxMatch) result.tax = parseFloat(taxMatch[1].replace(',', '.'));
    
    // Try to extract items - this is more complex and would need a more sophisticated parser
    // Placeholder for now
    result.items = [];
    
    // Extract category
    const categoryMatch = aiResponse.match(/category:?\s*"?([^"\n]+)"?/i);
    if (categoryMatch) {
      const category = categoryMatch[1].trim().toLowerCase();
      // Map to valid category
      const categoryMap = {
        'grocery': 'groceries',
        'groceries': 'groceries',
        'food': 'food',
        'restaurant': 'food',
        'dining': 'food',
        'transport': 'transportation',
        'transportation': 'transportation',
        'entertainment': 'entertainment',
        'utility': 'utilities',
        'utilities': 'utilities',
        'shop': 'shopping',
        'shopping': 'shopping',
        'health': 'healthcare',
        'healthcare': 'healthcare',
        'education': 'education'
      };
      
      result.category = categoryMap[category] || 'other';
    }
    
    return result;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return {};
  }
};

/**
 * Suggest expense categories based on description
 */
export const suggestCategory = async (description: string): Promise<Category> => {
  // Simple keyword-based categorization
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes('grocer') || lowerDesc.includes('supermarket') || lowerDesc.includes('mart')) {
    return 'groceries';
  }
  
  if (lowerDesc.includes('restaurant') || lowerDesc.includes('food') || lowerDesc.includes('cafe') || 
      lowerDesc.includes('dinner') || lowerDesc.includes('lunch')) {
    return 'food';
  }
  
  if (lowerDesc.includes('uber') || lowerDesc.includes('taxi') || lowerDesc.includes('train') || 
      lowerDesc.includes('bus') || lowerDesc.includes('transport')) {
    return 'transportation';
  }
  
  if (lowerDesc.includes('movie') || lowerDesc.includes('cinema') || lowerDesc.includes('theater') || 
      lowerDesc.includes('concert') || lowerDesc.includes('entertainment')) {
    return 'entertainment';
  }
  
  if (lowerDesc.includes('bill') || lowerDesc.includes('electricity') || lowerDesc.includes('water') || 
      lowerDesc.includes('gas') || lowerDesc.includes('internet') || lowerDesc.includes('phone')) {
    return 'utilities';
  }
  
  if (lowerDesc.includes('cloth') || lowerDesc.includes('mall') || lowerDesc.includes('shop') || 
      lowerDesc.includes('store') || lowerDesc.includes('amazon')) {
    return 'shopping';
  }
  
  if (lowerDesc.includes('doctor') || lowerDesc.includes('hospital') || lowerDesc.includes('clinic') || 
      lowerDesc.includes('pharmacy') || lowerDesc.includes('medicine')) {
    return 'healthcare';
  }
  
  if (lowerDesc.includes('school') || lowerDesc.includes('college') || lowerDesc.includes('course') || 
      lowerDesc.includes('tuition') || lowerDesc.includes('book')) {
    return 'education';
  }
  
  return 'other';
};

/**
 * Process chat messages to identify potential expenses
 */
export const analyzeChat = async (messages: string[]): Promise<any[]> => {
  const expenseSuggestions: any[] = [];
  
  for (const message of messages) {
    const lowerMessage = message.toLowerCase();
    
    // Look for expense-related keywords
    if (
      (lowerMessage.includes('spent') || lowerMessage.includes('paid') || lowerMessage.includes('bought')) &&
      (lowerMessage.includes('₹') || lowerMessage.includes('rs') || lowerMessage.includes('rupees'))
    ) {
      // Extract amount
      const amountMatch = lowerMessage.match(/(?:₹|rs|rupees)\s*(\d+)/i);
      let amount = 0;
      
      if (amountMatch && amountMatch[1]) {
        amount = parseInt(amountMatch[1]);
      }
      
      if (amount > 0) {
        // Suggest category
        const category = await suggestCategory(message);
        
        expenseSuggestions.push({
          description: message,
          amount,
          category
        });
      }
    }
  }
  
  return expenseSuggestions;
};

export default {
  enhanceReceiptData,
  suggestCategory,
  analyzeChat
};
