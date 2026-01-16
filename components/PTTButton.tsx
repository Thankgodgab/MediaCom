import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { Colors } from '../constants/theme';

interface PTTButtonProps {
    onPressIn: () => void;
    onPressOut: () => void;
    isSpeaking: boolean;
    disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const PTTButton: React.FC<PTTButtonProps> = ({ onPressIn, onPressOut, isSpeaking, disabled }) => {
    const scale = useSharedValue(1);
    const pulse = useSharedValue(1);

    React.useEffect(() => {
        if (isSpeaking) {
            pulse.value = withRepeat(
                withTiming(1.2, { duration: 800 }),
                -1,
                true
            );
        } else {
            pulse.value = withTiming(1);
        }
    }, [isSpeaking, pulse]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value * pulse.value }],
        backgroundColor: isSpeaking ? Colors.success : Colors.primary,
        opacity: disabled ? 0.5 : 1,
    }));

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
        opacity: interpolate(pulse.value, [1, 1.2], [0.6, 0]),
        borderColor: isSpeaking ? Colors.success : Colors.primary,
    }));

    const handlePressIn = () => {
        if (disabled) return;
        scale.value = withSpring(0.9);
        onPressIn();
    };

    const handlePressOut = () => {
        if (disabled) return;
        scale.value = withSpring(1);
        onPressOut();
    };

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.ring, ringStyle]} />
            <AnimatedPressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[styles.button, animatedStyle]}
            >
                {isSpeaking ? (
                    <MaterialCommunityIcons name="microphone" color="white" size={40} />
                ) : (
                    <MaterialCommunityIcons name="microphone" color="white" size={40} />
                )}
            </AnimatedPressable>
            <Text style={styles.label}>
                {isSpeaking ? 'TRANSMITTING...' : 'PUSH TO TALK'}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    ring: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        zIndex: 1,
    },
    label: {
        marginTop: 20,
        color: Colors.text,
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 2,
    },
});
