import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { DashboardStats as DashboardStatsType } from '../types';
import { formatDurationShort } from '../services/timeSessionService';

interface DashboardStatsProps {
  stats: DashboardStatsType;
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  color: string;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, color, bgColor }) => (
  <View style={[styles.statCard, { backgroundColor: bgColor }]}>
    <Text style={[styles.statTitle, { color }]}>{title}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statSubtitle}>{subtitle}</Text>
  </View>
);

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Dashboard Overview</Text>
      
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Hours"
          value={formatDurationShort(stats.todayHours)}
          subtitle="Today"
          color={colors.primary}
          bgColor={colors.infoLight}
        />
        <StatCard
          title="This Week"
          value={formatDurationShort(stats.weekHours)}
          subtitle="Total hours"
          color={colors.avatarPurple}
          bgColor="#F3E8FF"
        />
        <StatCard
          title="Open Tickets"
          value={stats.openTickets.toString()}
          subtitle="Assigned to you"
          color={colors.warning}
          bgColor={colors.warningLight}
        />
        <StatCard
          title="Team Members"
          value={stats.teamMembers.toString()}
          subtitle="Online now"
          color={colors.success}
          bgColor={colors.successLight}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  statTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  statSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
});
