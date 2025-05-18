import { Keyboard, Platform, Dimensions, KeyboardEvent, EmitterSubscription } from 'react-native';

interface KeyboardSize {
  height: number;
  width: number;
  screenX: number;
  screenY: number;
}

/**
 * Enhanced Utility class for keyboard handling across platforms
 * A singleton that manages keyboard behaviors
 */
class KeyboardHelper {
  private static instance: KeyboardHelper;
  private keyboardHeight = 0;
  private keyboardShown = false;
  private listeners: EmitterSubscription[] = [];
  
  private constructor() {
    // Private constructor for singleton
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): KeyboardHelper {
    if (!KeyboardHelper.instance) {
      KeyboardHelper.instance = new KeyboardHelper();
    }
    return KeyboardHelper.instance;
  }
  
  /**
   * Force keyboard to show, useful for situations when keyboard isn't appearing
   * @param inputRef React reference to the input element
   * @param delay Optional delay in milliseconds (default: 300ms)
   */
  public forceShowKeyboard(inputRef: any, delay: number = 300): void {
    if (!inputRef?.current) return;
    
    // Give a delay to ensure component is mounted
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, delay);
  }
  
  /**
   * Dismiss keyboard
   */
  public dismissKeyboard(): void {
    Keyboard.dismiss();
  }
  
  /**
   * Setup keyboard appearance listeners
   * @param showCallback Function to call when keyboard shows
   * @param hideCallback Function to call when keyboard hides
   * @returns Function to remove listeners
   */
  public setupKeyboardListeners(
    showCallback?: (keyboardSize: KeyboardSize) => void,
    hideCallback?: () => void
  ): () => void {
    // Clean up any existing listeners
    this.cleanupListeners();
    
    // Get proper event names based on platform
    const showEventName = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEventName = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    
    // Set up show listener
    const keyboardShowListener = Keyboard.addListener(
      showEventName,
      (event: KeyboardEvent) => {
        this.keyboardShown = true;
        this.keyboardHeight = event.endCoordinates.height;
        
        if (showCallback) {
          showCallback(event.endCoordinates);
        }
      }
    );
    
    // Set up hide listener
    const keyboardHideListener = Keyboard.addListener(
      hideEventName,
      () => {
        this.keyboardShown = false;
        this.keyboardHeight = 0;
        
        if (hideCallback) {
          hideCallback();
        }
      }
    );
    
    // Store listeners for cleanup
    this.listeners.push(keyboardShowListener, keyboardHideListener);
    
    // Return cleanup function
    return () => this.cleanupListeners();
  }
  
  /**
   * Clean up all keyboard event listeners
   */
  public cleanupListeners(): void {
    this.listeners.forEach(listener => {
      listener.remove();
    });
    this.listeners = [];
  }
  
  /**
   * Get current keyboard height
   */
  public getKeyboardHeight(): number {
    return this.keyboardHeight;
  }
  
  /**
   * Check if keyboard is currently shown
   */
  public isKeyboardShown(): boolean {
    return this.keyboardShown;
  }
  
  /**
   * Check if platform is iOS
   */
  public isIOS(): boolean {
    return Platform.OS === 'ios';
  }
  
  /**
   * Check if platform is Android
   */
  public isAndroid(): boolean {
    return Platform.OS === 'android';
  }
  
  /**
   * Get screen dimensions adjusted for keyboard
   */
  public getAdjustedScreenHeight(): number {
    const { height } = Dimensions.get('window');
    return height - (this.keyboardShown ? this.keyboardHeight : 0);
  }
}

// Export singleton instance
const keyboardHelper = KeyboardHelper.getInstance();
export default keyboardHelper;
