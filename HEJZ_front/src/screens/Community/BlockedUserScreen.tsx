import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BlockedUsersScreen = () => {
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

  useEffect(() => {
    const fetchBlocked = async () => {
      const stored = await AsyncStorage.getItem('blockedUsers');
      const parsed = stored ? JSON.parse(stored) : [];
      setBlockedUsers(parsed);
    };
    fetchBlocked();
  }, []);

  const unblockUser = async (id: string) => {
    Alert.alert('차단 해제', '정말 차단을 해제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '해제',
        style: 'destructive',
        onPress: async () => {
          const updated = blockedUsers.filter((userId) => userId !== id);
          setBlockedUsers(updated);
          await AsyncStorage.setItem('blockedUsers', JSON.stringify(updated));
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: string }) => (
    <View style={styles.userItem}>
      <Text style={styles.userId}>🚫 사용자 ID: {item}</Text>
      <TouchableOpacity onPress={() => unblockUser(item)}>
        <Text style={styles.unblockButton}>차단 해제</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>차단한 사용자 목록</Text>
      <FlatList
        data={blockedUsers}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={{ marginTop: 20 }}>차단한 사용자가 없습니다.</Text>}
      />
    </View>
  );
};

export default BlockedUsersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  userItem: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userId: {
    fontSize: 16,
    color: '#333',
  },
  unblockButton: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: 'bold',
  },
});
