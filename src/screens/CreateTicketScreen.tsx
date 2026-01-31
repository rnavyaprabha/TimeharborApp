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
import { createTicket } from '../services/ticketService';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

interface CreateTicketScreenProps {
  onBack: () => void;
  onTicketCreated: () => void;
}

export const CreateTicketScreen: React.FC<CreateTicketScreenProps> = ({
  onBack,
  onTicketCreated,
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const user = useAuthStore((state) => state.user);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a ticket name');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a ticket');
      return;
    }

    setLoading(true);

    try {
      await createTicket(user.uid, title, url);
      Alert.alert('Success', 'Ticket created successfully!');
      onTicketCreated();
    } catch (error: any) {
      Alert.alert('Error', error.message);
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
        <Text style={styles.headerTitle}>Create Ticket</Text>
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
                name="ticket-plus"
                size={48}
                color={colors.avatarPurple}
              />
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ticket Details</Text>
            <Text style={styles.sectionSubtitle}>
              Create a new ticket to track your work
            </Text>

            {/* Ticket Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ticket Name *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Fix login bug"
                placeholderTextColor={colors.textMuted}
                editable={!loading}
              />
            </View>

            {/* URL Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>URL (Optional)</Text>
              <View style={styles.urlInputContainer}>
                <MaterialCommunityIcons
                  name="link"
                  size={20}
                  color={colors.textMuted}
                  style={styles.urlIcon}
                />
                <TextInput
                  style={styles.urlInput}
                  value={url}
                  onChangeText={setUrl}
                  placeholder="https://github.com/user/repo/issues/123"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="url"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
              <Text style={styles.helperText}>
                Link to a GitHub issue, Jira ticket, or any related URL
              </Text>
            </View>

            <View style={styles.infoBox}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={20}
                color={colors.warning}
              />
              <Text style={styles.infoText}>
                Once created, you can clock in and out on this ticket to track your
                time spent.
              </Text>
            </View>

            {/* Create Button */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleCreate}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.textOnPrimary} size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="plus"
                    size={20}
                    color={colors.textOnPrimary}
                  />
                  <Text style={styles.buttonText}>Create Ticket</Text>
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
};

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
    backgroundColor: '#F3E8FF',
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
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  urlInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  urlIcon: {
    paddingLeft: spacing.lg,
  },
  urlInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md + 2,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  helperText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.warningLight,
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
    backgroundColor: colors.primary,
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
