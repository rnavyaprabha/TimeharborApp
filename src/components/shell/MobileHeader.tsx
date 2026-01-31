import React from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface MobileHeaderProps {
  currentTeamName: string | null;
  onTeamSwitch: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ currentTeamName, onTeamSwitch }) => {
  const { width } = useWindowDimensions();
  const isMobile = Platform.OS !== 'web' || width < 768;

  if (!isMobile) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Timeharbor</Text>
      <Pressable style={styles.teamSwitch} onPress={onTeamSwitch}>
        <MaterialCommunityIcons name="swap-horizontal" size={16} color={colors.textSecondary} />
        <Text style={styles.teamSwitchText}>{currentTeamName || 'Switch Team'}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    height: 70,
    paddingTop: Platform.OS === 'ios' ? 30 : 16,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fonts.bold,
    color: colors.primary,
  },
  teamSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  teamSwitchText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
    fontFamily: typography.fonts.medium,
  },
});
