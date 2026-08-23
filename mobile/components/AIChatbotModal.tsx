import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Colors from '../constants/Colors';
import aiService, { ChatMessage } from '../services/aiService';
import { UserRole } from '../types/user';

interface AIChatbotModalProps {
  visible: boolean;
  onClose: () => void;
  userRole: UserRole;
  userName?: string;
}

export const AIChatbotModal: React.FC<AIChatbotModalProps> = ({
  visible,
  onClose,
  userRole,
  userName,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  // Initial Welcome Message
  useEffect(() => {
    if (visible && messages.length === 0) {
      const welcomeText =
        userRole === 'patient'
          ? `Namaste ${userName || ''}! 🌿 I am your AyurSutra Assistant. Powered by AyurSutra's curated knowledge engine. I can guide you on Ayurvedic diets, Panchakarma therapy preparation, aftercare, and your active treatment plan.`
          : `Hello ${userName || ''}! 🌿 I am your AyurSutra Assistant. Powered by AyurSutra's curated knowledge engine. Ask me about Ayurvedic knowledge, treatment protocols, or clinic operational guidance.`;

      setMessages([
        {
          sender: 'assistant',
          text: welcomeText,
          timestamp: new Date().toISOString(),
          isPersonalized: false,
        },
      ]);
    }
  }, [visible]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);
    setError(null);

    try {
      const result = await aiService.sendMessage(query, conversationId);

      if (result.conversationId) {
        setConversationId(result.conversationId);
      }

      const assistantMsg: ChatMessage = {
        sender: 'assistant',
        text: result.response,
        timestamp: new Date().toISOString(),
        isPersonalized: result.isPersonalized,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to AyurSutra Assistant.');
    } finally {
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleClearHistory = async () => {
    if (conversationId) {
      try {
        await aiService.deleteConversation(conversationId);
      } catch {
        // Non-fatal
      }
    }
    setConversationId(undefined);
    setMessages([
      {
        sender: 'assistant',
        text: 'Conversation history cleared. How can I help you today? 🌿',
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const sampleQuestions =
    userRole === 'patient'
      ? [
          'What diet should I follow for my active therapy?',
          'How do I prepare for my Panchakarma session?',
          'What are the benefits of Ashwagandha?',
        ]
      : [
          'Summarize standard Panchakarma aftercare protocols.',
          'Explain the therapeutic objectives of Shirodhara.',
        ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerIcon}>🌿</Text>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.modalTitle}>AyurSutra Assistant</Text>
              <Text style={styles.modalSubtitle}>Powered by AyurSutra's Curated Knowledge Engine</Text>
            </View>
            <TouchableOpacity onPress={handleClearHistory} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>🗑️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Clinical Disclaimer Banner */}
          <View style={styles.disclaimerBanner}>
            <Text style={styles.disclaimerText}>
              ⚠️ Educational & Wellness Support • Not a Doctor. Clinician verification required.
            </Text>
          </View>

          {/* Messages ScrollView */}
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.messageBubble,
                  item.sender === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                {item.isPersonalized && (
                  <View style={styles.personalBadge}>
                    <Text style={styles.personalBadgeText}>💡 Personalized using your AyurSutra record</Text>
                  </View>
                )}
                <Text
                  style={[
                    styles.messageText,
                    item.sender === 'user' ? styles.userMessageText : styles.assistantMessageText,
                  ]}
                >
                  {item.text}
                </Text>
              </View>
            ))}

            {loading && (
              <View style={[styles.messageBubble, styles.assistantBubble, styles.loadingBubble]}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>Searching AyurSutra knowledge base...</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>❌ {error}</Text>
              </View>
            )}
          </ScrollView>

          {/* Sample Suggestion Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
            {sampleQuestions.map((q, i) => (
              <TouchableOpacity
                key={i}
                style={styles.sampleChip}
                onPress={() => handleSendMessage(q)}
              >
                <Text style={styles.sampleChipText}>⚡ {q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Input Controls */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask about diet, therapy, or appointments..."
              placeholderTextColor={Colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSendMessage()}
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendBtnDisabled]}
              onPress={() => handleSendMessage()}
              disabled={!inputText.trim() || loading}
            >
              <Text style={styles.sendBtnText}>➔</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    height: '85%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerIcon: {
    fontSize: 26,
    marginRight: 10,
  },
  headerTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  clearBtn: {
    padding: 6,
    marginRight: 4,
  },
  clearBtnText: {
    fontSize: 16,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  disclaimerBanner: {
    backgroundColor: Colors.warningBg || '#fffbe6',
    borderColor: '#ffe58f',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginVertical: 8,
  },
  disclaimerText: {
    fontSize: 10,
    color: Colors.warning || '#d48806',
    fontWeight: '700',
    textAlign: 'center',
  },
  messagesContainer: {
    paddingVertical: 10,
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 16,
    padding: 12,
    marginVertical: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 2,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderWidth: 1,
    borderBottomLeftRadius: 2,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  personalBadge: {
    backgroundColor: Colors.primary + '15',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  personalBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },
  userMessageText: {
    color: Colors.white,
    fontWeight: '500',
  },
  assistantMessageText: {
    color: Colors.text,
  },
  errorBanner: {
    backgroundColor: Colors.errorBg,
    padding: 8,
    borderRadius: 8,
    marginVertical: 4,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
  },
  chipsRow: {
    maxHeight: 40,
    marginVertical: 6,
  },
  sampleChip: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  sampleChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.border,
  },
  sendBtnText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
});

export default AIChatbotModal;
