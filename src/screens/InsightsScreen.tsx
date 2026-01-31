import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTeamUiStore } from '../store/teamUiStore';
import { Ticket } from '../types';
import { getTickets } from '../services/ticketService';
import { formatDurationShort } from '../services/timeSessionService';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

type TeamTotal = { id: string; name: string; totalSeconds: number };

export const InsightsScreen: React.FC = () => {
  const { teams, activeTeamId } = useTeamUiStore();
  const [loading, setLoading] = useState(true);
  const [teamTotals, setTeamTotals] = useState<TeamTotal[]>([]);
  const [teamTickets, setTeamTickets] = useState<Ticket[]>([]);

  const activeTeam = useMemo(
    () => teams.find((team) => team.id === activeTeamId) || null,
    [teams, activeTeamId]
  );

  useEffect(() => {
    const loadInsights = async () => {
      if (!teams.length) {
        setTeamTotals([]);
        setTeamTickets([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const results = await Promise.all(
          teams.map(async (team) => {
            const list = await getTickets(team.id);
            const totalSeconds = list.reduce((sum, ticket) => sum + (ticket.totalTimeSpent || 0), 0);
            return { id: team.id, name: team.name, totalSeconds, tickets: list };
          })
        );

        const sorted = [...results]
          .map(({ id, name, totalSeconds }) => ({ id, name, totalSeconds }))
          .sort((a, b) => b.totalSeconds - a.totalSeconds);

        setTeamTotals(sorted);

        const active = results.find((team) => team.id === activeTeamId);
        setTeamTickets(active?.tickets || []);
      } catch (error) {
        console.error('Failed to load insights', error);
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, [teams, activeTeamId]);

  const ticketTotals = useMemo(() => {
    const totals = teamTickets.map((ticket) => ({
      id: ticket.id,
      title: ticket.title,
      totalSeconds: ticket.totalTimeSpent || 0,
    }));
    totals.sort((a, b) => b.totalSeconds - a.totalSeconds);
    return totals;
  }, [teamTickets]);

  const totalSeconds = useMemo(
    () => teamTotals.reduce((sum, team) => sum + team.totalSeconds, 0),
    [teamTotals]
  );

  const activeTicketCount = useMemo(
    () => teamTickets.filter((ticket) => ticket.status !== 'Closed').length,
    [teamTickets]
  );

  const topTickets = ticketTotals.slice(0, 5);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.contentWidth, { maxWidth: 1180 }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Insights</Text>
            <Text style={styles.subtitle}>Understand where your time goes</Text>
          </View>
          <View style={styles.teamPill}>
            <MaterialCommunityIcons name="account-group-outline" size={14} color={colors.primary} />
            <Text style={styles.teamPillText}>{activeTeam?.name || 'All Teams'}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, styles.summaryCardPrimary]}>
                <Text style={styles.summaryLabel}>Total Tracked</Text>
                <Text style={styles.summaryValue}>
                  {totalSeconds ? formatDurationShort(totalSeconds) : '0m'}
                </Text>
                <Text style={styles.summaryHint}>All teams</Text>
              </View>

              <View style={[styles.summaryCard, styles.summaryCardInfo]}>
                <Text style={styles.summaryLabel}>Active Tickets</Text>
                <Text style={styles.summaryValue}>{activeTicketCount}</Text>
                <Text style={styles.summaryHint}>Current team</Text>
              </View>

              <View style={[styles.summaryCard, styles.summaryCardNeutral]}>
                <Text style={styles.summaryLabel}>Teams</Text>
                <Text style={styles.summaryValue}>{teams.length}</Text>
                <Text style={styles.summaryHint}>Joined</Text>
              </View>
            </View>

            <View style={styles.grid}>
              <View style={styles.panel}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelTitle}>Focus by ticket</Text>
                  <Text style={styles.panelSub}>Top work items</Text>
                </View>
                {topTickets.length === 0 ? (
                  <Text style={styles.emptyText}>No tracked time yet.</Text>
                ) : (
                  topTickets.map((ticket) => {
                    const max = topTickets[0]?.totalSeconds || 1;
                    const barWidth = Math.max(6, Math.round((ticket.totalSeconds / max) * 100));
                    const percent = totalSeconds
                      ? Math.round((ticket.totalSeconds / totalSeconds) * 100)
                      : 0;
                    return (
                      <View key={ticket.id} style={styles.barRow}>
                        <View style={styles.barInfo}>
                          <Text style={styles.barTitle} numberOfLines={1}>
                            {ticket.title}
                          </Text>
                          <Text style={styles.barValue}>
                            {formatDurationShort(ticket.totalSeconds)}
                          </Text>
                        </View>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { width: `${barWidth}%` }]} />
                        </View>
                        <Text style={styles.barPercent}>{percent}%</Text>
                      </View>
                    );
                  })
                )}
              </View>

              <View style={styles.panel}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelTitle}>Focus by team</Text>
                  <Text style={styles.panelSub}>Time distribution</Text>
                </View>
                {teamTotals.length === 0 ? (
                  <Text style={styles.emptyText}>Join a team to see breakdowns.</Text>
                ) : (
                  teamTotals.slice(0, 5).map((team) => {
                    const percent = totalSeconds
                      ? Math.round((team.totalSeconds / totalSeconds) * 100)
                      : 0;
                    return (
                      <View key={team.id} style={styles.teamRow}>
                        <View style={styles.teamBadge}>
                          <Text style={styles.teamBadgeText}>
                            {team.name.slice(0, 1).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.teamInfo}>
                          <Text style={styles.teamName} numberOfLines={1}>
                            {team.name}
                          </Text>
                          <View style={styles.teamTrack}>
                            <View style={[styles.teamFill, { width: `${percent}%` }]} />
                          </View>
                        </View>
                        <Text style={styles.teamValue}>
                          {formatDurationShort(team.totalSeconds)}
                        </Text>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundStart,
  },
  content: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  contentWidth: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fonts.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: 4,
    fontFamily: typography.fonts.medium,
  },
  teamPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.infoLight,
  },
  teamPillText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  loading: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  summaryCardPrimary: {
    backgroundColor: '#DBEAFE',
  },
  summaryCardInfo: {
    backgroundColor: '#E0F2FE',
  },
  summaryCardNeutral: {
    backgroundColor: '#EDE9FE',
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  summaryValue: {
    marginTop: spacing.sm,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  summaryHint: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
  grid: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: spacing.lg,
  },
  panel: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  panelHeader: {
    marginBottom: spacing.md,
  },
  panelTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    fontFamily: typography.fonts.medium,
  },
  panelSub: {
    marginTop: 4,
    color: colors.textSecondary,
  },
  emptyText: {
    color: colors.textMuted,
  },
  barRow: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  barInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  barTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  barValue: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  barTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.borderLight,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  barPercent: {
    alignSelf: 'flex-end',
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  teamBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },
  teamBadgeText: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  teamInfo: {
    flex: 1,
    gap: 6,
  },
  teamName: {
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
    fontSize: typography.sizes.sm,
  },
  teamTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.borderLight,
    overflow: 'hidden',
  },
  teamFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#4F46E5',
  },
  teamValue: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
});
