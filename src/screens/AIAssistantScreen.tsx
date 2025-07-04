import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';
import {useAuth} from '../contexts/AuthContext';
import {aiApi} from '../services/api';

interface AIAssistantScreenProps {
  navigation: any;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIAssistantScreen: React.FC<AIAssistantScreenProps> = ({navigation}) => {
  const {theme} = useTheme();
  const {user} = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initial welcome messages
    const welcomeMessages: ChatMessage[] = [
      {
        role: 'assistant',
        content: `Olá ${user?.name || 'usuário'}! Sou sua assistente nutricional personalizada.`,
        timestamp: new Date(),
      },
      {
        role: 'assistant',
        content: 'Posso ajudar você com dicas de nutrição, criação de planos alimentares e responder dúvidas sobre alimentação saudável.',
        timestamp: new Date(),
      },
      {
        role: 'assistant',
        content: 'Como posso ajudar você hoje?',
        timestamp: new Date(),
      }
    ];
    setMessages(welcomeMessages);
  }, [user]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Check if user is asking for meal plan creation
      const isCreatingPlan = inputText.toLowerCase().includes('plano') || 
                            inputText.toLowerCase().includes('cardápio') ||
                            inputText.toLowerCase().includes('dieta');

      let response;
      if (isCreatingPlan) {
        response = await aiApi.generateMealPlan({
          message: inputText,
          userProfile: user,
        });
      } else {
        response = await aiApi.sendMessage(inputText, messages.slice(-10));
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message || 'Desculpe, não consegui processar sua solicitação. Tente novamente.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If a meal plan was created, show success message
      if (isCreatingPlan && response.success) {
        setTimeout(() => {
          const successMessage: ChatMessage = {
            role: 'assistant',
            content: 'Seu plano foi criado com sucesso! Você pode visualizá-lo na aba "Meu Plano".',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, successMessage]);
        }, 1000);
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Ops! Algo deu errado. Verifique sua conexão e tente novamente.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    'Criar um plano de nutrição personalizado',
    'Dicas para uma alimentação saudável',
    'Como calcular minhas necessidades calóricas?',
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: 20,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 5,
    },
    headerSubtitle: {
      fontSize: 16,
      color: theme.colors.text,
      opacity: 0.7,
    },
    messagesContainer: {
      flex: 1,
      padding: 20,
    },
    messageWrapper: {
      marginBottom: 15,
      maxWidth: '80%',
    },
    userMessageWrapper: {
      alignSelf: 'flex-end',
    },
    assistantMessageWrapper: {
      alignSelf: 'flex-start',
    },
    messageContent: {
      padding: 15,
      borderRadius: 20,
    },
    userMessage: {
      backgroundColor: theme.colors.primary,
      borderBottomRightRadius: 5,
    },
    assistantMessage: {
      backgroundColor: theme.colors.card,
      borderBottomLeftRadius: 5,
    },
    messageText: {
      fontSize: 16,
      lineHeight: 22,
    },
    userMessageText: {
      color: '#ffffff',
    },
    assistantMessageText: {
      color: theme.colors.text,
    },
    messageTime: {
      fontSize: 12,
      opacity: 0.6,
      marginTop: 5,
      textAlign: 'right',
    },
    userMessageTime: {
      color: '#ffffff',
    },
    assistantMessageTime: {
      color: theme.colors.text,
    },
    suggestionsContainer: {
      padding: 20,
      paddingTop: 10,
    },
    suggestionsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 10,
    },
    suggestionButton: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    suggestionText: {
      fontSize: 14,
      color: theme.colors.text,
      textAlign: 'center',
    },
    inputContainer: {
      flexDirection: 'row',
      padding: 20,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    textInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 25,
      paddingHorizontal: 15,
      paddingVertical: 12,
      fontSize: 16,
      backgroundColor: theme.colors.card,
      color: theme.colors.text,
      marginRight: 10,
    },
    sendButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 25,
      paddingHorizontal: 20,
      paddingVertical: 12,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 50,
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    sendButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    loadingText: {
      color: theme.colors.text,
      fontSize: 14,
      fontStyle: 'italic',
      opacity: 0.7,
      textAlign: 'center',
      marginVertical: 10,
    },
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assistente IA</Text>
        <Text style={styles.headerSubtitle}>Sua nutricionista virtual</Text>
      </View>

      <ScrollView 
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message, index) => (
          <View
            key={index}
            style={[
              styles.messageWrapper,
              message.role === 'user' ? styles.userMessageWrapper : styles.assistantMessageWrapper,
            ]}
          >
            <View
              style={[
                styles.messageContent,
                message.role === 'user' ? styles.userMessage : styles.assistantMessage,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.role === 'user' ? styles.userMessageText : styles.assistantMessageText,
                ]}
              >
                {message.content}
              </Text>
              <Text
                style={[
                  styles.messageTime,
                  message.role === 'user' ? styles.userMessageTime : styles.assistantMessageTime,
                ]}
              >
                {formatTime(message.timestamp)}
              </Text>
            </View>
          </View>
        ))}

        {isLoading && (
          <Text style={styles.loadingText}>Pensando...</Text>
        )}

        {messages.length <= 3 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Sugestões:</Text>
            {suggestedQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionButton}
                onPress={() => setInputText(question)}
              >
                <Text style={styles.suggestionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Digite sua pergunta..."
          placeholderTextColor={theme.colors.text + '60'}
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          <Text style={styles.sendButtonText}>
            {isLoading ? '...' : '📤'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default AIAssistantScreen;