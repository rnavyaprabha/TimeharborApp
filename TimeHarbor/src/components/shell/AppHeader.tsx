import React from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface AppHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentTeamName: string | null;
  onTeamSwitch: () => void;
  onSignOut: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeTab,
  onTabChange,
  currentTeamName,
  onTeamSwitch,
  onSignOut,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  if (!isDesktop) return null;

  const navItems = [
    { key: 'Home', label: 'Home', icon: 'home-outline' as const, iconActive: 'home' as const },
    { key: 'Teams', label: 'Teams', icon: 'account-group-outline' as const, iconActive: 'account-group' as const },
    { key: 'Tickets', label: 'Tickets', icon: 'ticket-outline' as const, iconActive: 'ticket' as const },
    { key: 'Settings', label: 'Settings', icon: 'cog-outline' as const, iconActive: 'cog' as const },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.logo}>Timeharbor</Text>
        <View style={styles.nav}>
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <Pressable
                key={item.key}
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => onTabChange(item.key)}
              >
                <MaterialCommunityIcons
                  name={isActive ? item.iconActive : item.icon}
                  size={16}
                  color={isActive ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.right}>
        <Pressable style={styles.teamSwitch} onPress={onTeamSwitch}>
          <MaterialCommunityIcons name="swap-horizontal" size={16} color={colors.textSecondary} />
          <Text style={styles.teamSwitchText}>{currentTeamName || 'Switch Team'}</Text>
        </Pressable>
        <Pressable style={styles.signOut} onPress={onSignOut}>
          <MaterialCommunityIcons name="logout" size={16} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    height: 80,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxl,
  },
  logo: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fonts.bold,
    color: colors.primary,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  navItemActive: {
    backgroundColor: colors.infoLight,
  },
  navLabel: {
    marginLeft: spacing.xs,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
    fontFamily: typography.fonts.medium,
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fonts.semibold,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  teamSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  signOutText: {
    fontSize: typography.sizes.sm,
    color: colors.error,
    fontWeight: typography.weights.medium,
    fontFamily: typography.fonts.medium,
  },
});
