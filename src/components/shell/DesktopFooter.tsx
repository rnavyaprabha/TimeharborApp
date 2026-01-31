import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';

interface DesktopFooterProps {
  isSessionActive: boolean;
  elapsedSeconds: number;
  onToggleSession: () => void;
}

const formatSession = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const hours = Math.floor(mins / 60);
  const mm = (mins % 60).toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');
  if (hours > 0) {
    const hh = hours.toString().padStart(2, '0');
    return { value: `${hh}:${mm}`, label: 'hh:mm' };
  }
  return { value: `${mm}:${ss}`, label: 'mm:ss' };
};

export const DesktopFooter: React.FC<DesktopFooterProps> = ({
  isSessionActive,
  elapsedSeconds,
  onToggleSession,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const timer = useMemo(() => formatSession(elapsedSeconds), [elapsedSeconds]);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isSessionActive) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [isSessionActive, pulse]);

  if (!isDesktop) return null;

  return (
    <View style={styles.container}>
      <View style={styles.clockWrap}>
        {isSessionActive && (
          <>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }),
                  transform: [
                    {
                      scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.pulseRingSoft,
                {
                  opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
                  transform: [
                    {
                      scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }),
                    },
                  ],
                },
              ]}
            />
          </>
        )}
        <Pressable
          style={[styles.clockButton, isSessionActive ? styles.clockButtonActive : styles.clockButtonIdle]}
          onPress={onToggleSession}
        >
          {isSessionActive ? (
            <View style={styles.clockActiveText}>
              <Text style={styles.clockTime}>{timer.value}</Text>
              <Text style={styles.clockLabel}>{timer.label}</Text>
            </View>
          ) : (
            <MaterialCommunityIcons name="clock-outline" size={26} color="#fff" />
          )}
        </Pressable>
      </View>
      <View style={styles.copy}>
        <Text style={styles.copyTitle}>{isSessionActive ? 'Session Active' : 'Ready to Work?'}</Text>
        <Text style={[styles.copySubtitle, isSessionActive && styles.copySubtitleActive]}>
          {isSessionActive ? 'Click to Clock Out' : 'Click to Clock In'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    ...shadows.md,
  },
  clockWrap: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  pulseRing: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.95)',
    backgroundColor: 'rgba(255,59,48,0.28)',
    zIndex: 0,
    pointerEvents: 'none',
  },
  pulseRingSoft: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: 'rgba(255,59,48,0.35)',
    backgroundColor: 'rgba(255,59,48,0.08)',
    zIndex: 0,
    pointerEvents: 'none',
  },
  clockButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  clockButtonIdle: {
    backgroundColor: colors.primary,
  },
  clockButtonActive: {
    backgroundColor: colors.error,
  },
  clockActiveText: {
    alignItems: 'center',
  },
  clockTime: {
    color: '#fff',
    fontSize: 12,
    fontWeight: typography.weights.bold,
  },
  clockLabel: {
    color: '#fff',
    fontSize: 9,
    opacity: 0.8,
  },
  copy: {
    flexDirection: 'column',
  },
  copyTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fonts.semibold,
    color: colors.textPrimary,
  },
  copySubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    marginTop: 2,
    fontWeight: typography.weights.medium,
    fontFamily: typography.fonts.medium,
  },
  copySubtitleActive: {
    color: colors.error,
  },
});
