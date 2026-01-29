import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getUserTickets, formatDuration } from '../services/ticketService';
import { useAuthStore } from '../store/authStore';
import { Ticket } from '../types';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

interface TicketsScreenProps {
  onCreateTicket: () => void;
}

export const TicketsScreen: React.FC<TicketsScreenProps> = ({ onCreateTicket }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const user = useAuthStore((state) => state.user);

  const loadTickets = useCallback(async () => {
    if (!user) return;

    try {
      const userTickets = await getUserTickets(user.uid);
      setTickets(userTickets);
    } catch (error: any) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTickets();
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'open':
        return {
          color: colors.info,
          bgColor: colors.infoLight,
          label: 'Open',
          icon: 'checkbox-blank-circle-outline' as const,
        };
      case 'in_progress':
        return {
          color: colors.warning,
          bgColor: colors.warningLight,
          label: 'In Progress',
          icon: 'progress-clock' as const,
        };
      case 'done':
        return {
          color: colors.success,
          bgColor: colors.successLight,
          label: 'Done',
          icon: 'check-circle' as const,
        };
      default:
        return {
          color: colors.textMuted,
          bgColor: colors.surfaceSecondary,
          label: status,
          icon: 'help-circle-outline' as const,
        };
    }
  };

  const renderTicket = ({ item }: { item: Ticket }) => {
    const statusConfig = getStatusConfig(item.status);

    return (
      <TouchableOpacity style={styles.ticketCard} activeOpacity={0.8}>
        <View style={styles.ticketHeader}>
          <View style={styles.ticketTitleRow}>
            <MaterialCommunityIcons
              name="ticket-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.ticketTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}
          >
            <MaterialCommunityIcons
              name={statusConfig.icon}
              size={14}
              color={statusConfig.color}
            />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {item.url && (
          <View style={styles.urlRow}>
            <MaterialCommunityIcons
              name="link"
              size={16}
              color={colors.primary}
            />
            <Text style={styles.urlText} numberOfLines={1}>
              {item.url}
            </Text>
          </View>
        )}

        <View style={styles.ticketFooter}>
          <View style={styles.timeContainer}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.timeText}>{formatDuration(item.totalTimeSpent)}</Text>
          </View>
          <Text style={styles.dateText}>
            {item.createdAt.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.pageTitleRow}>
        <Text style={styles.pageTitle}>Tickets</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={onCreateTicket}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={20} color={colors.textOnPrimary} />
          <Text style={styles.addButtonText}>Add Ticket</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{tickets.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.info }]}>
            {tickets.filter((t) => t.status === 'open').length}
          </Text>
          <Text style={styles.statLabel}>Open</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.warning }]}>
            {tickets.filter((t) => t.status === 'in_progress').length}
          </Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {tickets.filter((t) => t.status === 'done').length}
          </Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <MaterialCommunityIcons
          name="ticket-outline"
          size={64}
          color={colors.textMuted}
        />
      </View>
      <Text style={styles.emptyTitle}>No Tickets Yet</Text>
      <Text style={styles.emptyText}>
        Create your first ticket to start tracking time on your tasks
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={onCreateTicket}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={20} color={colors.textOnPrimary} />
        <Text style={styles.emptyButtonText}>Create Ticket</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={tickets}
        renderItem={renderTicket}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          tickets.length === 0 && styles.emptyList,
        ]}
        ListHeaderComponent={tickets.length > 0 ? renderHeader : null}
        ListEmptyComponent={!loading ? renderEmpty : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundStart,
  },
  list: {
    padding: spacing.xl,
    paddingTop: Platform.OS === 'ios' ? spacing.xxxl + 40 : spacing.xl,
  },
  emptyList: {
    flexGrow: 1,
  },
  headerSection: {
    marginBottom: spacing.xl,
  },
  pageTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  pageTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textOnPrimary,
    marginLeft: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  ticketCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  ticketTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: spacing.md,
  },
  ticketTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 22,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    marginLeft: spacing.xs,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.infoLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  urlText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    fontWeight: typography.weights.medium,
  },
  dateText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
  },
  emptyButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textOnPrimary,
    marginLeft: spacing.sm,
  },
});
