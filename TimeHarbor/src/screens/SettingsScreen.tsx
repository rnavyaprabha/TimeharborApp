import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { logout } from '../services/authService';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

export const SettingsScreen: React.FC = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logoutStore = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    // Alert.alert doesn't work on web, use window.confirm instead
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (confirmed) {
        performLogout();
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
            onPress: performLogout,
          },
        ]
      );
    }
  };

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      // First clear the store to immediately show login screen
      logoutStore();
      // Then sign out from Firebase
      await logout();
    } catch (error: any) {
      console.error('Logout error:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to sign out. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to sign out. Please try again.');
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Text style={styles.pageTitle}>Settings</Text>

        {/* Profile Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <View style={styles.divider} />

          {/* Full Name */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="account"
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{user?.displayName || 'Not set'}</Text>
            </View>
          </View>

          {/* Email */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="email-outline"
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{user?.email || 'Not set'}</Text>
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="logout"
                size={20}
                color={colors.error}
              />
              <Text style={styles.signOutText}>Sign Out</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundStart,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingTop: spacing.xxxl,
  },
  pageTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    ...shadows.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.xxl,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.md,
  },
  signOutText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.error,
    marginLeft: spacing.sm,
  },
});
