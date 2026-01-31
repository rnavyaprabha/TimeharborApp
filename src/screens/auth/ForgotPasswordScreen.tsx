import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { sendPasswordReset } from '../../services/authService';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';

interface ForgotPasswordScreenProps {
  onBackToLogin: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      await sendPasswordReset(email.trim().toLowerCase());
      setIsSubmitted(true);
    } catch (e) {
      setError('Failed to send reset link. Please try again.');
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentWidth}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Text style={styles.logo}>TimeHarbor</Text>
            <Text style={styles.subtitle}>Reset your password</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {isSubmitted ? (
              <View style={styles.successWrap}>
                <View style={styles.successIcon}>
                  <MaterialCommunityIcons name="check" size={24} color={colors.success} />
                </View>
                <Text style={styles.successTitle}>Check your email</Text>
                <Text style={styles.successText}>
                  We&apos;ve sent a password reset link to {email}
                </Text>
                <TouchableOpacity style={styles.primaryButton} onPress={onBackToLogin}>
                  <Text style={styles.buttonText}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {error && (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={[styles.input, focused && styles.inputFocused]}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                  <Text style={styles.helperText}>
                    Enter your email address and we&apos;ll send you a link to reset your password.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.textOnPrimary} size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Remember your password? </Text>
                  <TouchableOpacity onPress={onBackToLogin} disabled={isLoading}>
                    <Text style={styles.linkText}>Sign in</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  contentWidth: {
    width: '100%',
    maxWidth: 520,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logo: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    fontStyle: 'italic',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    width: '100%',
    ...shadows.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
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
    outlineStyle: 'none',
  },
  inputFocused: {
    borderColor: colors.primary,
    outlineColor: colors.primary,
    outlineWidth: 2,
    outlineStyle: 'solid',
    outlineOffset: 0,
  },
  helperText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textOnPrimary,
  },
  errorBanner: {
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  linkText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  successWrap: {
    alignItems: 'center',
    gap: spacing.md,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  successText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
