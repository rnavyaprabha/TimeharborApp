// TimeHarbor Design System
// Modern, clean UI inspired by the reference design

export const colors = {
  // Primary colors
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#3B82F6',
  
  // Background gradients
  backgroundStart: '#EFF6FF',
  backgroundEnd: '#F5F3FF',
  backgroundAlt: '#F8FAFC',
  
  // Surface colors
  surface: '#FFFFFF',
  surfaceSecondary: '#F8FAFC',
  
  // Text colors
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  
  // Border colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderFocus: '#2563EB',
  
  // Status colors
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  
  // Role badge colors
  leaderBadge: '#10B981',
  memberBadge: '#8B5CF6',
  
  // Card colors
  cardJoinTeam: '#EEF2FF',
  cardCreateTeam: '#FFFFFF',
  
  // Accent colors for avatars
  avatarPurple: '#8B5CF6',
  avatarBlue: '#3B82F6',
  avatarGreen: '#10B981',
  avatarOrange: '#F59E0B',
  avatarPink: '#EC4899',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const typography = {
  // Font sizes
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    logo: 28,
  },
  // Font weights
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
};

// React Native Paper theme customization
export const paperTheme = {
  colors: {
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.avatarPurple,
    secondaryContainer: colors.memberBadge,
    surface: colors.surface,
    surfaceVariant: colors.surfaceSecondary,
    background: colors.backgroundStart,
    error: colors.error,
    errorContainer: colors.errorLight,
    onPrimary: colors.textOnPrimary,
    onPrimaryContainer: colors.primary,
    onSecondary: colors.textOnPrimary,
    onSecondaryContainer: colors.textPrimary,
    onSurface: colors.textPrimary,
    onSurfaceVariant: colors.textSecondary,
    onBackground: colors.textPrimary,
    onError: colors.textOnPrimary,
    onErrorContainer: colors.error,
    outline: colors.border,
    outlineVariant: colors.borderLight,
    shadow: '#000',
    scrim: '#000',
    inverseSurface: colors.textPrimary,
    inverseOnSurface: colors.surface,
    inversePrimary: colors.primaryLight,
    elevation: {
      level0: 'transparent',
      level1: colors.surface,
      level2: colors.surface,
      level3: colors.surface,
      level4: colors.surface,
      level5: colors.surface,
    },
  },
  roundness: borderRadius.md,
};

// Common component styles
export const commonStyles = {
  // Gradient background container
  gradientBackground: {
    flex: 1,
    backgroundColor: colors.backgroundStart,
  },
  
  // Card styles
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  
  // Input styles
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  
  // Button styles
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  
  // Label styles
  inputLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  
  // Logo styles
  logo: {
    fontSize: typography.sizes.logo,
    fontWeight: typography.weights.bold,
    fontStyle: 'italic' as const,
    color: colors.primary,
  },
  
  // Badge styles
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
};
