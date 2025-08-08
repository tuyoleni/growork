import { Platform } from 'react-native';

interface TTSMakerResponse {
  success: boolean;
  data?: {
    audio_url?: string;
    error?: string;
  };
  error?: string;
}

interface TTSOptions {
  text: string;
  voice?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
}

class TTSService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.ttsmaker.com/v1';

  constructor() {
    // You can set the API key here or load it from environment variables
    this.apiKey = process.env.EXPO_PUBLIC_TTSMAKER_API_KEY || null;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  async synthesizeSpeech(options: TTSOptions): Promise<string | null> {
    if (!this.apiKey) {
      console.error('TTSMaker API key not configured');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          text: options.text,
          voice: options.voice || 'en-US-Studio-M',
          speed: options.speed || 1.0,
          pitch: options.pitch || 1.0,
          volume: options.volume || 1.0,
          format: 'mp3',
        }),
      });

      const data: TTSMakerResponse = await response.json();

      if (data.success && data.data?.audio_url) {
        return data.data.audio_url;
      } else {
        console.error('TTSMaker API error:', data.error || data.data?.error);
        return null;
      }
    } catch (error) {
      console.error('Error synthesizing speech:', error);
      return null;
    }
  }

  async playAudio(audioUrl: string): Promise<void> {
    try {
      // For React Native, we'll use the WebView approach or native audio player
      // This is a simplified implementation - you might want to use expo-av for better audio handling
      if (Platform.OS === 'web') {
        const audio = new Audio(audioUrl);
        await audio.play();
      } else {
        // For mobile, you might want to use expo-av or react-native-sound
        console.log('Audio URL generated:', audioUrl);
        // TODO: Implement native audio playback
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }

  async textToSpeech(text: string, options?: Partial<TTSOptions>): Promise<void> {
    const audioUrl = await this.synthesizeSpeech({
      text,
      ...options,
    });

    if (audioUrl) {
      await this.playAudio(audioUrl);
    }
  }
}

export const ttsService = new TTSService();
export default ttsService; 