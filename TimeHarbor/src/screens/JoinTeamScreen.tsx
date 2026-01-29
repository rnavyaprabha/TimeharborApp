import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { joinTeam } from '../services/teamService';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

interface JoinTeamScreenProps {
  onBack: () => void;
  onTeamJoined: () => void;
}

export default function JoinTeamScreen({ onBack, onTeamJoined }: JoinTeamScreenProps) {
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((state) => state.user);

  const handleJoinTeam = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to join a team');
      return;
    }

    if (!joinCode.trim()) {
      Alert.alert('Validation Error', 'Please enter a join code');
      return;
    }

    try {
      setLoading(true);
      await joinTeam(user.uid, joinCode);
      onTeamJoined();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Join Team</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name="account-multiple-plus"
                size={48}
                color={colors.success}
              />
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Enter Join Code</Text>
            <Text style={styles.sectionSubtitle}>
              Ask your team leader for the 6-character code
            </Text>

            {/* Join Code Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Join Code</Text>
              <TextInput
                style={styles.codeInput}
                value={joinCode}
                onChangeText={(text) => setJoinCode(text.toUpperCase())}
                placeholder="ABC123"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                maxLength={6}
                editable={!loading}
                autoFocus
              />
            </View>

            <View style={styles.infoBox}>
              <MaterialCommunityIcons
                name="information-outline"
                size={20}
                color={colors.info}
              />
              <Text style={styles.infoText}>
                The join code is case-insensitive. Your team leader can find it in
                their team settings.
              </Text>
            </View>

            {/* Join Button */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (loading || !joinCode.trim()) && styles.buttonDisabled,
              ]}
              onPress={handleJoinTeam}
              disabled={loading || !joinCode.trim()}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.textOnPrimary} size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="account-multiple-plus"
                    size={20}
                    color={colors.textOnPrimary}
                  />
                  <Text style={styles.buttonText}>Join Team</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onBack}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundStart,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    marginTop: spacing.xl,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    ...shadows.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  codeInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 8,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.infoLight,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  infoText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: colors.success,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textOnPrimary,
    marginLeft: spacing.sm,
  },
  secondaryButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
});
