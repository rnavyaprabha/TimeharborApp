import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
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
  <View style={[styles.statCard, { backgroundColor: bgColor, borderColor: bgColor }]}>
    <Text style={[styles.statTitle, { color }]} numberOfLines={1}>
      {title}
    </Text>
    <Text style={[styles.statValue, { color }]} numberOfLines={1}>
      {value}
    </Text>
    <Text style={styles.statSubtitle} numberOfLines={1}>
      {subtitle}
    </Text>
  </View>
);

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <View style={styles.container}>
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
          color="#4F46E5"
          bgColor="#EEF2FF"
        />
        <StatCard
          title="Open Tickets"
          value={stats.openTickets.toString()}
          subtitle="Assigned to you"
          color="#7C3AED"
          bgColor="#F3E8FF"
        />
        <StatCard
          title="Team Members"
          value={stats.teamMembers.toString()}
          subtitle="Online now"
          color="#16A34A"
          bgColor="#DCFCE7"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
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
    borderWidth: 1,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fonts.semibold,
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fonts.bold,
    marginBottom: spacing.xs,
  },
  statSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: typography.fonts.medium,
  },
});
