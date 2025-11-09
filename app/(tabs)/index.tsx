import { FOX_SYSTEM_PROMPT } from '@/constants/foxPrompt';
import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

async function requestChatbot(message: string) {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OpenAI API Key. Please set EXPO_PUBLIC_OPENAI_API_KEY in your environment.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: FOX_SYSTEM_PROMPT,
        },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`ChatGPT request failed: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('No response text received from ChatGPT.');
  }

  return content;
}

export default function HomeScreen() {
  const [inputMessage, setInputMessage] = useState('');
  const [foxMessage, setFoxMessage] = useState("Hey… I'm Lumo. I noticed it feels a little quiet around you today.");
  const [isSending, setIsSending] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSend = useCallback(async () => {
    const trimmed = inputMessage.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    try {
      const reply = await requestChatbot(trimmed);
      setFoxMessage(reply);
    } catch (error) {
      console.error('Failed to reach chatbot', error);
      setFoxMessage("I'm sorry, I can't respond right now.");
    } finally {
      setIsSending(false);
      setInputMessage('');
      Keyboard.dismiss();
    }
  }, [inputMessage, isSending]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {/* 背景图 */}
        <Image
          source={require('@/assets/images/backgrounds/Background.png')}
          style={styles.backgroundImage}
          contentFit="cover"
          contentPosition="center"
        />
        {/* 狐狸图片 - 居中显示 */}
        <View style={styles.gifContainer} pointerEvents="box-none">
          <View style={styles.foxWrapper}>
            <Image
              source={require('@/assets/images/pics/Fox.png')}
              style={styles.gifImage}
              contentFit="contain"
            />
            <View style={styles.bubbleWrapper}>
              <View style={styles.bubbleBox}>
                <Text style={styles.bubbleText}>{foxMessage}</Text>
              </View>
              <View style={styles.bubbleTail} />
            </View>
          </View>
        </View>
        <KeyboardAvoidingView
          style={styles.inputAvoider}
          behavior={Platform.select({ ios: 'padding', android: 'height' })}
          keyboardVerticalOffset={Platform.select({ ios: 24, android: 0 })}>
          <View style={[styles.inputBar, { paddingBottom: 12 + insets.bottom }]}>
            <TextInput
              style={styles.input}
              value={inputMessage}
              onChangeText={setInputMessage}
              placeholder="Tell Lumo what's on your mind..."
              placeholderTextColor="#999"
              editable={!isSending}
              multiline
            />
            <Pressable
              style={[styles.sendButton, isSending || !inputMessage.trim() ? styles.sendButtonDisabled : null]}
              onPress={handleSend}
              disabled={isSending || !inputMessage.trim()}>
              <Text style={styles.sendButtonText}>{isSending ? 'Sending…' : 'Send'}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  gifContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  foxWrapper: {
    width: 400,
    height: 400,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gifImage: {
    width: '100%',
    height: '100%',
  },
  bubbleWrapper: {
    position: 'absolute',
    top: -40,
    right: -10,
    alignItems: 'flex-start',
  },
  bubbleBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: 260,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  bubbleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -12,
    left: 36,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(255, 255, 255, 0.9)',
  },
  inputAvoider: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  inputBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 20,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  sendButton: {
    backgroundColor: '#f7b1d8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(247, 177, 216, 0.4)',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
