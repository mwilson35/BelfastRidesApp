import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { io } from 'socket.io-client';

interface Message {
  id: string;
  text: string;
  senderId: number;
  senderType: 'rider' | 'driver';
  timestamp: Date;
  senderName: string;
}

interface Props {
  rideId: number;
  token: string;
  currentUserId: number;
  currentUserType: 'rider' | 'driver';
  onClose: () => void;
}

const socket = io('http://192.168.33.5:5000');

const ChatScreen: React.FC<Props> = ({
  rideId,
  token,
  currentUserId,
  currentUserType,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Join the chat room for this ride
    socket.emit('joinChat', { rideId, userId: currentUserId, userType: currentUserType });
    
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('📱 Connected to chat');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('📱 Disconnected from chat');
    });

    // Listen for new messages
    socket.on('newMessage', (message: Message) => {
      setMessages(prev => [...prev, message]);
      // Auto-scroll to bottom when new message arrives
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    // Listen for chat history
    socket.on('chatHistory', (history: Message[]) => {
      setMessages(history);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('newMessage');
      socket.off('chatHistory');
      socket.emit('leaveChat', { rideId });
    };
  }, [rideId, currentUserId, currentUserType]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const messageData = {
      rideId,
      text: newMessage.trim(),
      senderId: currentUserId,
      senderType: currentUserType,
    };

    socket.emit('sendMessage', messageData);
    setNewMessage('');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === currentUserId;
    
    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.otherMessage,
        ]}
      >
        <Text style={styles.senderName}>
          {isMyMessage ? 'You' : item.senderName || 'Other User'}
        </Text>
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat</Text>
        <View style={styles.connectionStatus}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isConnected ? '#28a745' : '#dc3545' },
            ]}
          />
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
      />

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: newMessage.trim() ? '#007bff' : '#ccc' },
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <MaterialIcons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  connectionStatus: {
    padding: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '75%',
    padding: 12,
    borderRadius: 12,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    opacity: 0.7,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatScreen;
