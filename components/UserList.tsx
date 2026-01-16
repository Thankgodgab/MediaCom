import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/theme';

interface User {
    id: string;
    name: string;
    role: 'director' | 'member';
    isSpeaking?: boolean;
}

interface UserListProps {
    users: User[];
}

export const UserList: React.FC<UserListProps> = ({ users }) => {
    const renderItem = ({ item }: { item: User }) => (
        <View style={styles.userCard}>
            <View style={styles.avatar}>
                <MaterialCommunityIcons
                    name={item.role === 'director' ? "account-star" : "account"}
                    size={24}
                    color={item.isSpeaking ? Colors.success : Colors.text}
                />
                {item.isSpeaking && (
                    <View style={styles.speakerIndicator} />
                )}
            </View>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userRole}>{item.role.toUpperCase()}</Text>
            </View>
            <MaterialCommunityIcons
                name={item.isSpeaking ? "volume-high" : "volume-low"}
                size={20}
                color={item.isSpeaking ? Colors.success : Colors.textDim}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>ACTIVE TEAM</Text>
            <FlatList
                data={users}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 20,
    },
    sectionTitle: {
        paddingHorizontal: 24,
        fontSize: 12,
        fontWeight: '800',
        color: Colors.textDim,
        letterSpacing: 2,
        marginBottom: 12,
    },
    list: {
        paddingHorizontal: 20,
    },
    userCard: {
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.glass,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    userRole: {
        color: Colors.textDim,
        fontSize: 10,
        fontWeight: '700',
        marginTop: 2,
    },
    speakerIndicator: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.success,
        borderWidth: 2,
        borderColor: Colors.card,
    }
});
