import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { useAuthStore } from '../store/authStore';
import { logout } from '../services/authService';
import { Alert } from 'react-native';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  teams?: { id: string; name: string }[];
  activeTeamId?: string;
  onSelectTeam?: (teamId?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, teams = [], activeTeamId, onSelectTeam }) => {
  const user = useAuthStore((state) => state.user);
  const logoutStore = useAuthStore((state) => state.logout);

  const tabs = [
    { key: 'Home', label: 'Home', icon: 'home-outline' as const },
    { key: 'Teams', label: 'Teams', icon: 'account-group-outline' as const },
    { key: 'Tickets', label: 'Tickets', icon: 'ticket-outline' as const },
    { key: 'Settings', label: 'Settings', icon: 'cog-outline' as const },
  ];

  const handleSignOut = async () => {
    const confirm = () => {
      if (Platform.OS === 'web') {
        return window.confirm('Are you sure you want to sign out?');
      }
      return true;
    };

    const doLogout = async () => {
      try {
        await logout();
        logoutStore();
      } catch (error: any) {
        if (Platform.OS === 'web') {
          window.alert(error.message || 'Failed to sign out');
        } else {
          Alert.alert('Error', error.message);
        }
      }
    };

    if (Platform.OS === 'web') {
      if (confirm()) {
        await doLogout();
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: doLogout,
          },
        ]
      );
    }
  };

  const getDisplayName = () => {
    if (!user?.displayName) return 'User';
    const firstName = user.displayName.split(' ')[0];
    return firstName.length > 10 ? firstName.substring(0, 10) + '...' : firstName;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContent}>
        {/* Logo */}
        <Text style={styles.logo}>Timeharbor</Text>

        {/* Navigation Tabs - Only show on larger screens */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => onTabChange(tab.key)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={activeTab === tab.key ? tab.icon.replace('-outline', '') as any : tab.icon}
                size={18}
                color={activeTab === tab.key ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Right Section - User & Sign Out */}
        <View style={styles.rightSection}>
          {onSelectTeam && teams.length > 0 && (
            <TouchableOpacity
              style={styles.teamPill}
              onPress={() => {
                const idx = teams.findIndex((t) => t.id === activeTeamId);
                const next = teams[(idx + 1 + teams.length) % teams.length];
                onSelectTeam(next?.id);
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="account-group" size={16} color={colors.primary} />
              <Text style={styles.teamPillText}>
                {teams.find((t) => t.id === activeTeamId)?.name || 'Team'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          <View style={styles.userBadge}>
            <MaterialCommunityIcons
              name="swap-horizontal"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.userName}>{getDisplayName()}</Text>
          </View>

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <MaterialCommunityIcons
              name="logout"
              size={18}
              color={colors.error}
            />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    ...shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  logo: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    display: Platform.OS === 'web' ? 'flex' : 'none',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: colors.infoLight,
  },
  tabText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    fontWeight: typography.weights.medium,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  teamPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  teamPillText: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    display: Platform.OS === 'web' ? 'flex' : 'none',
  },
  userName: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    fontWeight: typography.weights.medium,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    display: Platform.OS === 'web' ? 'flex' : 'none',
  },
  signOutText: {
    fontSize: typography.sizes.sm,
    color: colors.error,
    marginLeft: spacing.xs,
    fontWeight: typography.weights.medium,
  },
});
