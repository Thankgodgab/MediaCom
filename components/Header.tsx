import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/theme';

export const Header = () => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View>
                    <Text style={styles.title}>MEDIA<Text style={{ color: Colors.primary }}>COM</Text></Text>
                    <View style={styles.statusContainer}>
                        <View style={styles.indicator} />
                        <Text style={styles.statusText}>LIVE INTERCOM</Text>
                    </View>
                </View>
                <MaterialCommunityIcons name="broadcast" size={28} color={Colors.primary} />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: Colors.background,
    },
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: -1,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    indicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.success,
        marginRight: 6,
    },
    statusText: {
        fontSize: 10,
        color: Colors.textDim,
        fontWeight: '700',
        letterSpacing: 1,
    },
});
