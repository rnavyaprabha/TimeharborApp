import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Pressable,
  Platform,
  useWindowDimensions,
  Modal as RNModal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { logout } from '../services/authService';
import { RecentActivityList } from '../components';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { getRecentSessions } from '../services/timeSessionService';
import { useSessionStore } from '../store/sessionStore';

interface SettingsScreenProps {
  onOpenProfile: () => void;
  onOpenActivity: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onOpenProfile }) => {
  const user = useAuthStore((s) => s.user);
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;
  const contentMaxWidth = 820;
  const [timesheetOpen, setTimesheetOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleSignOut = async () => {
    await logout();
    useAuthStore.getState().logout();
  };

  const SettingsModal = ({
    visible,
    title,
    onClose,
    children,
  }: {
    visible: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
  }) => {
    return (
      <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable
          style={[styles.modalBackdrop, isDesktop ? styles.modalBackdropDesktop : styles.modalBackdropMobile]}
          onPress={onClose}
        >
          <Pressable
            style={[styles.modalCard, isDesktop ? styles.modalCardDesktop : styles.modalCardMobile]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <Pressable onPress={onClose} style={styles.modalClose}>
                <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <View style={styles.modalContent}>{children}</View>
          </Pressable>
        </Pressable>
      </RNModal>
    );
  };

  return (
    <View style={styles.container}>
      {isDesktop ? (
        <ScrollView contentContainerStyle={styles.desktopContent}>
          <View style={[styles.desktopContentWidth, { maxWidth: contentMaxWidth }]}>
          <Text style={styles.desktopTitle}>Settings</Text>
          <View style={styles.profileCard}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
                <MaterialCommunityIcons name="account" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{user?.displayName || 'Not set'}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#EDE9FE' }]}>
                <MaterialCommunityIcons name="email-outline" size={22} color="#7C3AED" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{user?.email || 'Not set'}</Text>
              </View>
            </View>
          </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.mobileContent}>
          <Text style={styles.mobileTitle}>Menu</Text>
          <View style={styles.menuCard}>
            <Pressable style={styles.menuRow} onPress={onOpenProfile}>
              <View style={[styles.menuIcon, { backgroundColor: '#DBEAFE' }]}>
                <MaterialCommunityIcons name="account" size={20} color={colors.primary} />
              </View>
              <Text style={styles.menuText}>My Profile</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
            </Pressable>

            <Pressable style={styles.menuRow} onPress={() => setTimesheetOpen(true)}>
              <View style={[styles.menuIcon, { backgroundColor: '#DCFCE7' }]}>
                <MaterialCommunityIcons name="file-document-outline" size={20} color="#16A34A" />
              </View>
              <Text style={styles.menuText}>My Timesheet</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
            </Pressable>

            <Pressable style={styles.menuRow} onPress={() => setCalendarOpen(true)}>
              <View style={[styles.menuIcon, { backgroundColor: '#F3E8FF' }]}>
                <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#7C3AED" />
              </View>
              <Text style={styles.menuText}>Calendar</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
            </Pressable>

            <Pressable style={[styles.menuRow, styles.menuRowDanger]} onPress={handleSignOut}>
              <View style={[styles.menuIcon, { backgroundColor: '#FEE2E2' }]}>
                <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
              </View>
              <Text style={[styles.menuText, { color: colors.error }]}>Log Out</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      <SettingsModal visible={timesheetOpen} title="My Timesheet" onClose={() => setTimesheetOpen(false)}>
        <TimesheetModal />
      </SettingsModal>

      <SettingsModal visible={calendarOpen} title="Calendar" onClose={() => setCalendarOpen(false)}>
        <View style={styles.calendarPlaceholder}>
          <View style={styles.calendarIcon}>
            <MaterialCommunityIcons name="calendar-month-outline" size={24} color="#7C3AED" />
          </View>
          <Text style={styles.calendarTitle}>Calendar Coming Soon</Text>
          <Text style={styles.calendarText}>
            We're working on a new calendar view to help you manage your schedule better.
          </Text>
        </View>
      </SettingsModal>
    </View>
  );
};

const TimesheetModal = () => {
  const user = useAuthStore((s) => s.user);
  const [sessions, setSessions] = useState<any[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = React.useRef<any>(null);
  const { activeSession, lastCompletedSession, setLastCompletedSession } = useSessionStore();

  React.useEffect(() => {
    const load = async () => {
      if (!user) return;
      const recent = await getRecentSessions(user.uid, 10);
      setSessions(recent);
    };
    load();
  }, [user]);

  React.useEffect(() => {
    if (activeSession) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - activeSession.startTime.getTime()) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setElapsed(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession]);

  React.useEffect(() => {
    if (!lastCompletedSession) return;
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== lastCompletedSession.id);
      return [lastCompletedSession, ...filtered];
    });
    setLastCompletedSession(null);
  }, [lastCompletedSession, setLastCompletedSession]);

  return (
    <RecentActivityList
      sessions={sessions}
      activeSession={activeSession}
      elapsedSeconds={elapsed}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundStart,
  },
  mobileContent: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
  },
  mobileTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.md,
  },
  menuRowDanger: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    fontFamily: typography.fonts.medium,
    color: colors.textPrimary,
  },
  desktopContent: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  desktopContentWidth: {
    width: '100%',
  },
  desktopTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fonts.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fonts.semibold,
    color: colors.textPrimary,
  },
  calendarPlaceholder: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  calendarIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fonts.semibold,
    color: colors.textPrimary,
  },
  calendarText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: spacing.lg,
  },
  modalBackdropMobile: {
    justifyContent: 'flex-end',
  },
  modalBackdropDesktop: {
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
    maxHeight: '90%',
  },
  modalCardMobile: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  modalCardDesktop: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 520,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  modalHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fonts.bold,
    color: colors.textPrimary,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: spacing.lg,
  },
});
