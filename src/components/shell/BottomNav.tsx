import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions, Platform, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
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

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  isSessionActive,
  elapsedSeconds,
  onToggleSession,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = Platform.OS !== 'web' || width < 768;

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

  if (!isMobile) return null;

  return (
    <View style={styles.container}>
      <Pressable style={styles.tab} onPress={() => onTabChange('Home')}>
        <MaterialCommunityIcons
          name="home"
          size={22}
          color={activeTab === 'Home' ? colors.primary : colors.textMuted}
        />
        <Text style={[styles.tabLabel, activeTab === 'Home' && styles.tabLabelActive]}>Home</Text>
      </Pressable>

      <Pressable style={styles.tab} onPress={() => onTabChange('Teams')}>
        <MaterialCommunityIcons
          name="account-group"
          size={22}
          color={activeTab === 'Teams' ? colors.primary : colors.textMuted}
        />
        <Text style={[styles.tabLabel, activeTab === 'Teams' && styles.tabLabelActive]}>Teams</Text>
      </Pressable>

      <Pressable style={styles.tab} onPress={() => onTabChange('Insights')}>
        <MaterialCommunityIcons
          name="chart-box"
          size={22}
          color={activeTab === 'Insights' ? colors.primary : colors.textMuted}
        />
        <Text style={[styles.tabLabel, activeTab === 'Insights' && styles.tabLabelActive]}>Insights</Text>
      </Pressable>

      <View style={styles.centerSlot}>
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
        <Text style={[styles.centerLabel, isSessionActive && styles.centerLabelActive]}>
          {isSessionActive ? 'Clock Out' : 'Clock In'}
        </Text>
      </View>

      <Pressable style={styles.tab} onPress={() => onTabChange('Tickets')}>
        <MaterialCommunityIcons
          name="ticket"
          size={22}
          color={activeTab === 'Tickets' ? colors.primary : colors.textMuted}
        />
        <Text style={[styles.tabLabel, activeTab === 'Tickets' && styles.tabLabelActive]}>Ticket</Text>
      </Pressable>

      <Pressable style={styles.tab} onPress={() => onTabChange('Settings')}>
        <MaterialCommunityIcons
          name="menu"
          size={22}
          color={activeTab === 'Settings' ? colors.primary : colors.textMuted}
        />
        <Text style={[styles.tabLabel, activeTab === 'Settings' && styles.tabLabelActive]}>Menu</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    paddingBottom: Platform.OS === 'ios' ? 18 : 6,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
    fontFamily: typography.fonts.medium,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  centerSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
  },
  clockWrap: {
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  pulseRing: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.95)',
    backgroundColor: 'rgba(255,59,48,0.28)',
    zIndex: 0,
    pointerEvents: 'none',
  },
  pulseRingSoft: {
    position: 'absolute',
    width: 102,
    height: 102,
    borderRadius: 51,
    borderWidth: 2,
    borderColor: 'rgba(255,59,48,0.35)',
    backgroundColor: 'rgba(255,59,48,0.08)',
    zIndex: 0,
    pointerEvents: 'none',
  },
  clockButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    ...shadows.md,
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
  centerLabel: {
    marginTop: 4,
    fontSize: 10,
    color: colors.primary,
    fontWeight: typography.weights.medium,
    fontFamily: typography.fonts.medium,
  },
  centerLabelActive: {
    color: colors.error,
  },
});
