import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming
} from 'react-native-reanimated';
import { Colors } from '../constants/theme';

interface PreloadScreenProps {
    onFinish: () => void;
}

export const PreloadScreen: React.FC<PreloadScreenProps> = ({ onFinish }) => {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.8);
    const textOpacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 1000 });
        scale.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.back(1.5)) });
        textOpacity.value = withDelay(800, withTiming(1, { duration: 800 }));

        const timer = setTimeout(onFinish, 3000);
        return () => clearTimeout(timer);
    }, [onFinish, opacity, scale, textOpacity]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: interpolate(textOpacity.value, [0, 1], [20, 0]) }]
    }));

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.logoContainer, animatedStyle]}>
                <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name="broadcast" size={80} color={Colors.white} />
                </View>
                <Animated.View style={textStyle}>
                    <Text style={styles.title}>MEDIA<Text style={{ color: Colors.primary }}>COM</Text></Text>
                    <Text style={styles.subtitle}>Unified Media Comms</Text>
                </Animated.View>
            </Animated.View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Optimizing for Live Service...</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
    },
    iconCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
    },
    title: {
        fontSize: 42,
        fontWeight: '900',
        color: Colors.white,
        letterSpacing: -2,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textDim,
        fontWeight: '600',
        letterSpacing: 4,
        textTransform: 'uppercase',
        marginTop: 4,
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 60,
    },
    footerText: {
        color: Colors.textDim,
        fontSize: 12,
        fontWeight: '500',
    }
});
