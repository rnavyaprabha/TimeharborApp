import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useTeamUiStore } from '../store/teamUiStore';
import {
  addMemberToTeam,
  createTeam,
  deleteTeam,
  getUserTeams,
  joinTeam,
  removeMemberFromTeam,
  updateTeamName,
} from '../services/teamService';
import { Team, TeamMember } from '../types';
import { Modal } from '../components';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { getTeamSessions, updateSessionTimes } from '../services/timeSessionService';

type ActivityRow = {
  id: string;
  date: string;
  startTime: Date;
  endTime: Date | null;
  duration: number;
  member: string;
  email: string;
  hours: string;
  clockIn: string;
  clockOut: string;
  status: string;
  statusRaw: 'active' | 'completed';
  tickets: string[];
};

export const TeamsScreen: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const { teams, activeTeamId, setTeams, setActiveTeamId } = useTeamUiStore();
  const [loading, setLoading] = useState(true);
  const [joinOpen, setJoinOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [removeMemberOpen, setRemoveMemberOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [editTeamName, setEditTeamName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [createdTeamCode, setCreatedTeamCode] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [teamSessions, setTeamSessions] = useState<any[]>([]);
  const [rangePreset, setRangePreset] = useState<'today' | 'yesterday' | 'last7' | 'thisWeek' | 'last14'>('last14');
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [filters, setFilters] = useState({
    date: '',
    member: '',
    email: '',
    hours: '',
    clockIn: '',
    clockOut: '',
    status: '',
    ticket: '',
  });
  const [editRow, setEditRow] = useState<ActivityRow | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editClockIn, setEditClockIn] = useState('');
  const [editClockOut, setEditClockOut] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'completed'>('completed');
  const [savingEdit, setSavingEdit] = useState(false);
  const dateInputRef = useRef<any>(null);
  const clockInRef = useRef<any>(null);
  const clockOutRef = useRef<any>(null);
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;
  const contentMaxWidth = 1180;

  const currentTeam = useMemo(() => {
    return teams.find((t) => t.id === activeTeamId) || teams[0];
  }, [teams, activeTeamId]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const list = await getUserTeams(user.uid);
      setTeams(list);
      if (!activeTeamId && list.length > 0) {
        setActiveTeamId(list[0].id);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const refreshTeams = async () => {
    if (!user) return;
    const list = await getUserTeams(user.uid);
    setTeams(list);
    if (!activeTeamId && list.length > 0) {
      setActiveTeamId(list[0].id);
    }
  };

  const handleCopyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
  };

  const isLeader = currentTeam && user?.uid === currentTeam.ownerId;

  const handleJoin = async () => {
    if (!user) return;
    setBusy(true);
    setActionError(null);
    try {
      const joined = await joinTeam(user.uid, joinCode);
      await refreshTeams();
      setActiveTeamId(joined.id);
      setJoinOpen(false);
      setJoinCode('');
    } catch (e: any) {
      setActionError(e.message || 'Failed to join team');
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    if (!user) return;
    setBusy(true);
    setActionError(null);
    try {
      const created = await createTeam(user.uid, newTeamName);
      setCreatedTeamCode(created.joinCode);
      await refreshTeams();
      setActiveTeamId(created.id);
    } catch (e: any) {
      setActionError(e.message || 'Failed to create team');
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = async () => {
    if (!currentTeam) return;
    setBusy(true);
    setActionError(null);
    try {
      await updateTeamName(currentTeam.id, editTeamName);
      await refreshTeams();
      setEditOpen(false);
    } catch (e: any) {
      setActionError(e.message || 'Failed to update team');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!currentTeam) return;
    setBusy(true);
    setActionError(null);
    try {
      await deleteTeam(currentTeam.id);
      await refreshTeams();
      setDeleteOpen(false);
      setActiveTeamId(teams.find((t) => t.id !== currentTeam.id)?.id);
    } catch (e: any) {
      setActionError(e.message || 'Failed to delete team');
    } finally {
      setBusy(false);
    }
  };

  const handleAddMember = async () => {
    if (!currentTeam) return;
    setBusy(true);
    setActionError(null);
    try {
      await addMemberToTeam(currentTeam.id, newMemberEmail);
      await refreshTeams();
      setAddMemberOpen(false);
      setNewMemberEmail('');
    } catch (e: any) {
      setActionError(e.message || 'Failed to add member');
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!currentTeam || !selectedMember) return;
    setBusy(true);
    setActionError(null);
    try {
      await removeMemberFromTeam(currentTeam.id, selectedMember.id, currentTeam.ownerId);
      await refreshTeams();
      setRemoveMemberOpen(false);
      setSelectedMember(null);
    } catch (e: any) {
      setActionError(e.message || 'Failed to remove member');
    } finally {
      setBusy(false);
    }
  };

  const activityRows: ActivityRow[] = useMemo(() => {
    if (!currentTeam?.members) return [];
    return teamSessions.map((s, idx) => {
      const member = currentTeam.members?.find((m) => m.id === s.userId);
      const start = s.startTime as Date;
      const end = s.endTime as Date | null;
      const hours = Math.floor((s.duration || 0) / 3600);
      const mins = Math.floor(((s.duration || 0) % 3600) / 60);
      const hoursText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      return {
        id: s.id || `act-${idx}`,
        date: start.toISOString().slice(0, 10),
        startTime: start,
        endTime: end,
        duration: s.duration || 0,
        member: member?.name || 'Member',
        email: member?.email || '-',
        hours: hoursText,
        clockIn: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        clockOut: end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
        status: s.status === 'active' ? 'Active' : 'Completed',
        statusRaw: s.status === 'active' ? 'active' : 'completed',
        tickets: s.ticketTitle ? [s.ticketTitle] : [],
      };
    });
  }, [currentTeam?.members, teamSessions]);

  const formatDateInput = (date: Date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const applyPresetRange = (preset: typeof rangePreset) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    if (preset === 'today') {
      setRangeStart(startOfDay);
      setRangeEnd(endOfDay);
      setCustomFrom(formatDateInput(startOfDay));
      setCustomTo(formatDateInput(endOfDay));
      return;
    }
    if (preset === 'yesterday') {
      const y = new Date(startOfDay);
      y.setDate(y.getDate() - 1);
      setRangeStart(y);
      setRangeEnd(new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59));
      setCustomFrom(formatDateInput(y));
      setCustomTo(formatDateInput(y));
      return;
    }
    if (preset === 'last7') {
      const start = new Date(startOfDay);
      start.setDate(start.getDate() - 6);
      setRangeStart(start);
      setRangeEnd(endOfDay);
      setCustomFrom(formatDateInput(start));
      setCustomTo(formatDateInput(endOfDay));
      return;
    }
    if (preset === 'thisWeek') {
      const start = new Date(startOfDay);
      start.setDate(start.getDate() - start.getDay());
      setRangeStart(start);
      setRangeEnd(endOfDay);
      setCustomFrom(formatDateInput(start));
      setCustomTo(formatDateInput(endOfDay));
      return;
    }
    const start = new Date(startOfDay);
    start.setDate(start.getDate() - 13);
    setRangeStart(start);
    setRangeEnd(endOfDay);
    setCustomFrom(formatDateInput(start));
    setCustomTo(formatDateInput(endOfDay));
  };

  useEffect(() => {
    applyPresetRange(rangePreset);
  }, [rangePreset]);

  const parseDate = (value: string): Date | null => {
    const parts = value.split('-');
    if (parts.length !== 3) return null;
    const [y, m, d] = parts.map((p) => Number(p));
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };

  const formatTimeInput = (date: Date | null) => {
    if (!date) return '';
    const hh = date.getHours().toString().padStart(2, '0');
    const mm = date.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const handleApplyCustomRange = () => {
    const from = parseDate(customFrom);
    const to = parseDate(customTo);
    if (from) setRangeStart(from);
    if (to) setRangeEnd(new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59));
  };

  const filteredRows = useMemo(() => {
    return activityRows.filter((row) => {
      if (rangeStart && row.startTime < rangeStart) return false;
      if (rangeEnd && row.startTime > rangeEnd) return false;
      if (filters.date && !row.date.toLowerCase().includes(filters.date.toLowerCase())) return false;
      if (filters.member && !row.member.toLowerCase().includes(filters.member.toLowerCase())) return false;
      if (filters.email && !row.email.toLowerCase().includes(filters.email.toLowerCase())) return false;
      if (filters.hours && !row.hours.toLowerCase().includes(filters.hours.toLowerCase())) return false;
      if (filters.clockIn && !row.clockIn.toLowerCase().includes(filters.clockIn.toLowerCase())) return false;
      if (filters.clockOut && !row.clockOut.toLowerCase().includes(filters.clockOut.toLowerCase())) return false;
      if (filters.status && row.status.toLowerCase() !== filters.status.toLowerCase()) return false;
      if (filters.ticket && !row.tickets.join(' ').toLowerCase().includes(filters.ticket.toLowerCase())) return false;
      return true;
    });
  }, [activityRows, filters, rangeStart, rangeEnd]);

  const openEditRow = (row: ActivityRow) => {
    setEditRow(row);
    setEditDate(row.date);
    setEditClockIn(formatTimeInput(row.startTime));
    setEditClockOut(formatTimeInput(row.endTime));
    setEditStatus(row.statusRaw);
  };

  const saveEditRow = async () => {
    if (!editRow) return;
    setSavingEdit(true);
    try {
      const dateValue = parseDate(editDate) || editRow.startTime;
      const [inH, inM] = editClockIn.split(':').map((n) => Number(n));
      const start = new Date(dateValue);
      if (!Number.isNaN(inH) && !Number.isNaN(inM)) {
        start.setHours(inH, inM, 0, 0);
      }
      let end: Date | null = null;
      if (editClockOut.trim().length > 0) {
        const [outH, outM] = editClockOut.split(':').map((n) => Number(n));
        end = new Date(dateValue);
        if (!Number.isNaN(outH) && !Number.isNaN(outM)) {
          end.setHours(outH, outM, 0, 0);
        }
      }
      await updateSessionTimes(editRow.id, start, end, editStatus);
      const sessions = currentTeam?.id ? await getTeamSessions(currentTeam.id, 50) : [];
      setTeamSessions(sessions);
      setEditRow(null);
    } finally {
      setSavingEdit(false);
    }
  };

  useEffect(() => {
    const loadTeamSessions = async () => {
      if (!currentTeam?.id) return;
      const sessions = await getTeamSessions(currentTeam.id, 50);
      setTeamSessions(sessions);
    };
    loadTeamSessions();
  }, [currentTeam?.id]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.contentWidth, { maxWidth: contentMaxWidth }]}>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>Teams</Text>
        {currentTeam?.joinCode && (
          <Pressable style={styles.codeBadge} onPress={() => handleCopyCode(currentTeam.joinCode)}>
            <Text style={styles.codeBadgeLabel}>Code: </Text>
            <Text style={styles.codeBadgeValue}>{currentTeam.joinCode}</Text>
            <MaterialCommunityIcons name="content-copy" size={14} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <View style={styles.actionCards}>
        <Pressable style={[styles.actionCard, styles.joinCard]} onPress={() => setJoinOpen(true)}>
          <View style={styles.actionIcon}>
            <MaterialCommunityIcons name="account-group-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Join a Team</Text>
            <Text style={styles.actionSubtitle}>Find your team and start collaborating</Text>
          </View>
        </Pressable>

        <Pressable style={[styles.actionCard, styles.createCard]} onPress={() => setCreateOpen(true)}>
          <View style={styles.actionIcon}>
            <MaterialCommunityIcons name="plus" size={24} color="#7C3AED" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Create a Team</Text>
            <Text style={styles.actionSubtitle}>Set up a new workspace for your team</Text>
          </View>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Your Team</Text>
      {!currentTeam ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Please select or join a team to view members.</Text>
        </View>
      ) : (
        <View style={styles.teamCard}>
          <View style={styles.teamHeader}>
            <View style={styles.teamTitleRow}>
              <Text style={styles.teamName}>{currentTeam.name}</Text>
              {isLeader && (
                <View style={styles.leaderBadge}>
                  <Text style={styles.leaderBadgeText}>Leader</Text>
                </View>
              )}
            </View>
            {isLeader && (
              <View style={styles.teamActions}>
                <Pressable onPress={() => {
                  setEditTeamName(currentTeam.name);
                  setEditOpen(true);
                }}>
                  <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.textMuted} />
                </Pressable>
                <Pressable onPress={() => setDeleteOpen(true)}>
                  <MaterialCommunityIcons name="delete-outline" size={18} color={colors.textMuted} />
                </Pressable>
              </View>
            )}
          </View>
          <Text style={styles.memberCount}>{currentTeam.memberIds.length} members</Text>

          <View style={styles.collaboratorsHeader}>
            <Text style={styles.collaboratorsTitle}>Collaborators</Text>
            {isLeader && (
              <Pressable style={styles.addMemberBtn} onPress={() => setAddMemberOpen(true)}>
                <MaterialCommunityIcons name="account-plus-outline" size={16} color={colors.primary} />
                <Text style={styles.addMemberText}>Add Member</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.memberGrid}>
            {currentTeam.members?.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{member.name.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName} numberOfLines={1}>
                    {member.name}
                  </Text>
                  <Text style={styles.memberEmail} numberOfLines={1}>
                    {member.email || '-'}
                  </Text>
                </View>
                {isLeader && member.id !== user?.uid && (
                  <Pressable onPress={() => { setSelectedMember(member); setRemoveMemberOpen(true); }}>
                    <MaterialCommunityIcons name="account-remove-outline" size={18} color={colors.textMuted} />
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {isDesktop && currentTeam && (
        <View style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <View style={styles.reportTitleRow}>
              <View style={styles.reportIcon}>
                <MaterialCommunityIcons name="chart-bar" size={18} color={colors.primary} />
              </View>
              <Text style={styles.reportTitle}>Team Activity Report</Text>
            </View>
            <View style={styles.rangeTabs}>
              {[
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'last7', label: 'Last 7 Days' },
                { id: 'thisWeek', label: 'This Week' },
                { id: 'last14', label: 'Last 14 Days' },
              ].map((tab) => (
                <Pressable
                  key={tab.id}
                  onPress={() => setRangePreset(tab.id as typeof rangePreset)}
                  style={[styles.rangeTab, rangePreset === tab.id && styles.rangeTabActive]}
                >
                  <Text style={[styles.rangeTabText, rangePreset === tab.id && styles.rangeTabTextActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.rangeRow}>
            <Text style={styles.rangeLabel}>Custom Date Range:</Text>
            <TextInput
              value={customFrom}
              onChangeText={setCustomFrom}
              placeholder="YYYY-MM-DD"
              style={styles.rangeInput}
            />
            <Text style={styles.rangeDivider}>to</Text>
            <TextInput
              value={customTo}
              onChangeText={setCustomTo}
              placeholder="YYYY-MM-DD"
              style={styles.rangeInput}
            />
            <Pressable style={styles.rangeApply} onPress={handleApplyCustomRange}>
              <Text style={styles.rangeApplyText}>Apply</Text>
            </Pressable>
          </View>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDate]}>Date</Text>
            <Text style={[styles.tableHeaderCell, styles.colMember]}>Team Member</Text>
            <Text style={[styles.tableHeaderCell, styles.colEmail]}>Email</Text>
            <Text style={[styles.tableHeaderCell, styles.colHours]}>Hours</Text>
            <Text style={[styles.tableHeaderCell, styles.colClockIn]}>Clock-in</Text>
            <Text style={[styles.tableHeaderCell, styles.colClockOut]}>Clock-out</Text>
            <Text style={[styles.tableHeaderCell, styles.colStatus]}>Status</Text>
            <Text style={[styles.tableHeaderCell, styles.colTickets]}>Tickets</Text>
            <Text style={[styles.tableHeaderCell, styles.colActions]}>Actions</Text>
          </View>
          <View style={styles.tableFilters}>
            <TextInput
              value={filters.date}
              onChangeText={(val) => setFilters((prev) => ({ ...prev, date: val }))}
              placeholder="Filter Date"
              style={[styles.filterInput, styles.colDate]}
            />
            <TextInput
              value={filters.member}
              onChangeText={(val) => setFilters((prev) => ({ ...prev, member: val }))}
              placeholder="Filter Member"
              style={[styles.filterInput, styles.colMember]}
            />
            <TextInput
              value={filters.email}
              onChangeText={(val) => setFilters((prev) => ({ ...prev, email: val }))}
              placeholder="Filter Email"
              style={[styles.filterInput, styles.colEmail]}
            />
            <TextInput
              value={filters.hours}
              onChangeText={(val) => setFilters((prev) => ({ ...prev, hours: val }))}
              placeholder="Filter Hours"
              style={[styles.filterInput, styles.colHours]}
            />
            <TextInput
              value={filters.clockIn}
              onChangeText={(val) => setFilters((prev) => ({ ...prev, clockIn: val }))}
              placeholder="Filter In"
              style={[styles.filterInput, styles.colClockIn]}
            />
            <TextInput
              value={filters.clockOut}
              onChangeText={(val) => setFilters((prev) => ({ ...prev, clockOut: val }))}
              placeholder="Filter Out"
              style={[styles.filterInput, styles.colClockOut]}
            />
            <View style={[styles.filterSelectWrap, styles.colStatus]}>
              {/* @ts-ignore - web select */}
              {Platform.OS === 'web' ? (
                // eslint-disable-next-line react/no-unknown-property
                <select
                  value={filters.status}
                  onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                  style={styles.filterSelect as any}
                >
                  <option value="">All</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              ) : (
                <TextInput
                  value={filters.status}
                  onChangeText={(val) => setFilters((prev) => ({ ...prev, status: val }))}
                  placeholder="All"
                  style={styles.filterInput}
                />
              )}
            </View>
            <TextInput
              value={filters.ticket}
              onChangeText={(val) => setFilters((prev) => ({ ...prev, ticket: val }))}
              placeholder="Filter Tickets"
              style={[styles.filterInput, styles.colTickets]}
            />
            <View style={styles.colActions} />
          </View>
          {filteredRows.map((row) => (
            <View key={row.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colDate]}>{row.date}</Text>
              <View style={[styles.memberCell, styles.colMember]}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{row.member.slice(0, 1).toUpperCase()}</Text>
                </View>
                <Text style={styles.memberCellText} numberOfLines={1}>{row.member}</Text>
              </View>
              <Text style={[styles.tableCell, styles.colEmail]}>{row.email}</Text>
              <Text style={[styles.tableCell, styles.colHours]}>{row.hours}</Text>
              <Text style={[styles.tableCell, styles.colClockIn]}>{row.clockIn}</Text>
              <Text style={[styles.tableCell, styles.colClockOut]}>{row.clockOut}</Text>
              <View style={[styles.statusPill, styles.colStatus]}>
                <Text style={styles.statusText}>{row.status}</Text>
              </View>
              <View style={[styles.ticketTags, styles.colTickets]}>
                {row.tickets.map((t) => (
                  <Text key={t} style={styles.ticketTag}>{t}</Text>
                ))}
              </View>
              <Pressable style={[styles.actionIconButton, styles.colActions]} onPress={() => openEditRow(row)}>
                <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.textSecondary} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
      </View>

      {/* Join Modal */}
      <Modal visible={joinOpen} title="Join a Team" onClose={() => setJoinOpen(false)}>
        <View style={styles.modalBody}>
          {!!actionError && <Text style={styles.modalError}>{actionError}</Text>}
          <Text style={styles.modalHelp}>Enter the 6-digit code provided by your team admin.</Text>
          <TextInput
            value={joinCode}
            onChangeText={(val) => setJoinCode(val.toUpperCase())}
            placeholder="e.g. 123456"
            maxLength={6}
            style={styles.modalInput}
          />
          <View style={styles.modalActions}>
            <Pressable style={styles.modalCancel} onPress={() => setJoinOpen(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.modalPrimary, (joinCode.length < 6 || busy) && styles.modalDisabled]}
              disabled={joinCode.length < 6 || busy}
              onPress={handleJoin}
            >
              {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalPrimaryText}>Join Team</Text>}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Create Modal */}
      <Modal visible={createOpen} title="Create a Team" onClose={() => setCreateOpen(false)}>
        {!createdTeamCode ? (
          <View style={styles.modalBody}>
            {!!actionError && <Text style={styles.modalError}>{actionError}</Text>}
            <Text style={styles.modalHelp}>Give your new team a name. You'll get a code to share.</Text>
            <TextInput
              value={newTeamName}
              onChangeText={setNewTeamName}
              placeholder="e.g. Engineering Team"
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setCreateOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalPrimary, (!newTeamName.trim() || busy) && styles.modalDisabled]}
                disabled={!newTeamName.trim() || busy}
                onPress={handleCreate}
              >
                {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalPrimaryText}>Create Team</Text>}
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.createdWrap}>
            <View style={styles.createdIcon}>
              <MaterialCommunityIcons name="check" size={22} color={colors.success} />
            </View>
            <Text style={styles.createdTitle}>Team Created!</Text>
            <Text style={styles.createdSubtitle}>Share this code with your team members.</Text>
            <View style={styles.createdCodeRow}>
              <Text style={styles.createdCode}>{createdTeamCode}</Text>
              <Pressable onPress={() => handleCopyCode(createdTeamCode)}>
                <MaterialCommunityIcons name="content-copy" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Pressable style={styles.createdDone} onPress={() => { setCreateOpen(false); setCreatedTeamCode(null); }}>
              <Text style={styles.createdDoneText}>Done</Text>
            </Pressable>
          </View>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal visible={editOpen} title="Edit Team" onClose={() => setEditOpen(false)}>
        <View style={styles.modalBody}>
          {!!actionError && <Text style={styles.modalError}>{actionError}</Text>}
          <TextInput
            value={editTeamName}
            onChangeText={setEditTeamName}
            placeholder="Team name"
            style={styles.modalInput}
          />
          <View style={styles.modalActions}>
            <Pressable style={styles.modalCancel} onPress={() => setEditOpen(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.modalPrimary, (!editTeamName.trim() || busy) && styles.modalDisabled]}
              disabled={!editTeamName.trim() || busy}
              onPress={handleEdit}
            >
              {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalPrimaryText}>Save Changes</Text>}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Delete Modal */}
      <Modal visible={deleteOpen} title="Delete Team" onClose={() => setDeleteOpen(false)}>
        <View style={styles.modalBody}>
          <Text style={styles.modalHelp}>
            Are you sure you want to delete {currentTeam?.name}? This action cannot be undone.
          </Text>
          <View style={styles.modalActions}>
            <Pressable style={styles.modalCancel} onPress={() => setDeleteOpen(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.modalDanger} onPress={handleDelete}>
              <Text style={styles.modalPrimaryText}>Delete Team</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Add Member Modal */}
      <Modal visible={addMemberOpen} title="Add Team Member" onClose={() => setAddMemberOpen(false)}>
        <View style={styles.modalBody}>
          {!!actionError && <Text style={styles.modalError}>{actionError}</Text>}
          <TextInput
            value={newMemberEmail}
            onChangeText={setNewMemberEmail}
            placeholder="colleague@example.com"
            style={styles.modalInput}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.modalActions}>
            <Pressable style={styles.modalCancel} onPress={() => setAddMemberOpen(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.modalPrimary, (!newMemberEmail.trim() || busy) && styles.modalDisabled]}
              disabled={!newMemberEmail.trim() || busy}
              onPress={handleAddMember}
            >
              {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalPrimaryText}>Add Member</Text>}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Remove Member Modal */}
      <Modal visible={removeMemberOpen} title="Remove Team Member" onClose={() => setRemoveMemberOpen(false)}>
        <View style={styles.modalBody}>
          <Text style={styles.modalHelp}>
            Are you sure you want to remove {selectedMember?.name} from the team?
          </Text>
          <View style={styles.modalActions}>
            <Pressable style={styles.modalCancel} onPress={() => setRemoveMemberOpen(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.modalDanger} onPress={handleRemoveMember}>
              <Text style={styles.modalPrimaryText}>Remove Member</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!editRow}
        title="Edit Time Log"
        onClose={() => setEditRow(null)}
      >
        <View style={styles.modalBody}>
          {editRow && (
            <View style={styles.editMemberCard}>
              <View style={styles.editMemberAvatar}>
                <Text style={styles.editMemberAvatarText}>{editRow.member.slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={styles.editMemberInfo}>
                <Text style={styles.editMemberName}>{editRow.member}</Text>
                <Text style={styles.editMemberEmail}>{editRow.email}</Text>
              </View>
            </View>
          )}
          <View style={styles.editField}>
            <Text style={styles.editLabel}>Date</Text>
            <View style={styles.editInputWrap}>
              {Platform.OS === 'web' ? (
                <>
                  {/* eslint-disable-next-line react/no-unknown-property */}
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    style={styles.editHtmlInput as any}
                  />
                </>
              ) : (
                <>
                  <TextInput
                    value={editDate}
                    onChangeText={setEditDate}
                    placeholder="YYYY-MM-DD"
                    style={styles.editTextInput}
                  />
                  <MaterialCommunityIcons name="calendar-month-outline" size={18} color={colors.textMuted} />
                </>
              )}
            </View>
          </View>
          <View style={styles.editRow}>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Clock In</Text>
              <View style={styles.editInputWrap}>
                {Platform.OS === 'web' ? (
                  <>
                    {/* eslint-disable-next-line react/no-unknown-property */}
                    <input
                      ref={clockInRef}
                      type="time"
                      value={editClockIn}
                      onChange={(e) => setEditClockIn(e.target.value)}
                      style={styles.editHtmlInput as any}
                    />
                  </>
                ) : (
                  <>
                    <TextInput
                      value={editClockIn}
                      onChangeText={setEditClockIn}
                      placeholder="09:00"
                      style={styles.editTextInput}
                    />
                    <MaterialCommunityIcons name="clock-outline" size={18} color={colors.textMuted} />
                  </>
                )}
              </View>
            </View>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Clock Out</Text>
              <View style={styles.editInputWrap}>
                {Platform.OS === 'web' ? (
                  <>
                    {/* eslint-disable-next-line react/no-unknown-property */}
                    <input
                      ref={clockOutRef}
                      type="time"
                      value={editClockOut}
                      onChange={(e) => setEditClockOut(e.target.value)}
                      style={styles.editHtmlInput as any}
                    />
                  </>
                ) : (
                  <>
                    <TextInput
                      value={editClockOut}
                      onChangeText={setEditClockOut}
                      placeholder="05:30"
                      style={styles.editTextInput}
                    />
                    <MaterialCommunityIcons name="clock-outline" size={18} color={colors.textMuted} />
                  </>
                )}
              </View>
            </View>
          </View>
          <View style={styles.modalActionsRight}>
            <Pressable style={styles.modalCancelGhost} onPress={() => setEditRow(null)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.modalPrimary} onPress={saveEditRow} disabled={savingEdit}>
              {savingEdit ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalPrimaryText}>Save Changes</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundStart,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  pageTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fonts.bold,
    color: colors.textPrimary,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  codeBadgeLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  codeBadgeValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  actionCards: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
    flexWrap: 'wrap',
  },
  actionCard: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  joinCard: {
    backgroundColor: '#DBEAFE',
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  createCard: {
    backgroundColor: '#F3E8FF',
    borderWidth: 2,
    borderColor: '#E9D5FF',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fonts.semibold,
    color: colors.textPrimary,
  },
  actionSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontFamily: typography.fonts.medium,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fonts.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.sm,
  },
  emptyText: {
    color: colors.textSecondary,
  },
  teamCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: '#3B82F6',
    ...shadows.sm,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  teamTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  teamName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fonts.bold,
    color: colors.textPrimary,
  },
  leaderBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  leaderBadgeText: {
    fontSize: typography.sizes.xs,
    color: '#7C3AED',
    fontWeight: typography.weights.medium,
  },
  teamActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  memberCount: {
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  collaboratorsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  collaboratorsTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fonts.semibold,
    color: colors.textPrimary,
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  addMemberText: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  memberGrid: {
    gap: spacing.md,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: typography.weights.semibold,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fonts.semibold,
    color: colors.textPrimary,
  },
  memberEmail: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  reportCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    gap: spacing.lg,
    flexWrap: 'wrap',
  },
  reportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reportIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fonts.semibold,
    color: colors.textPrimary,
  },
  rangeTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.full,
    padding: 4,
    gap: 4,
  },
  rangeTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  rangeTabActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  rangeTabText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  rangeTabTextActive: {
    color: colors.textPrimary,
    fontWeight: typography.weights.semibold,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  rangeLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  rangeInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.sm,
    backgroundColor: colors.surface,
    minWidth: 140,
  },
  rangeDivider: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  rangeApply: {
    backgroundColor: '#059669',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  rangeApplyText: {
    color: '#fff',
    fontWeight: typography.weights.semibold,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
    alignItems: 'center',
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  colDate: {
    width: 120,
  },
  colMember: {
    width: 160,
  },
  colEmail: {
    width: 220,
  },
  colHours: {
    width: 90,
  },
  colClockIn: {
    width: 90,
  },
  colClockOut: {
    width: 90,
  },
  colStatus: {
    width: 110,
  },
  colTickets: {
    width: 150,
  },
  colActions: {
    width: 70,
    alignItems: 'center',
  },
  tableFilters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  filterInput: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    fontSize: 11,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  filterSelectWrap: {
    justifyContent: 'center',
  },
  filterSelect: {
    width: '100%',
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderStyle: 'solid',
    paddingLeft: 8,
    paddingRight: 8,
    fontSize: 11,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.md,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  memberCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  memberCellText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  statusPill: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: typography.weights.medium,
  },
  ticketTags: {
    flexDirection: 'row',
    gap: 4,
  },
  ticketTag: {
    backgroundColor: '#DBEAFE',
    color: colors.primary,
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.md,
  },
  actionIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  editRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  editMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSecondary,
  },
  editMemberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editMemberAvatarText: {
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  editMemberInfo: {
    flex: 1,
  },
  editMemberName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  editMemberEmail: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  editField: {
    flex: 1,
    gap: spacing.xs,
  },
  editLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  editInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  editTextInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  editHtmlInput: {
    flex: 1,
    height: 40,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: 14,
    color: colors.textPrimary,
  },
  modalBody: {
    gap: spacing.md,
  },
  modalHelp: {
    color: colors.textSecondary,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  modalActionsRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalCancelGhost: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  modalCancel: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  modalPrimary: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  modalDanger: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.error,
  },
  modalPrimaryText: {
    color: colors.textOnPrimary,
    fontWeight: typography.weights.medium,
  },
  modalDisabled: {
    opacity: 0.6,
  },
  modalError: {
    backgroundColor: colors.errorLight,
    color: colors.error,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  createdWrap: {
    alignItems: 'center',
    gap: spacing.md,
  },
  createdIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createdTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  createdSubtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  createdCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  createdCode: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  createdDone: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  createdDoneText: {
    color: colors.textOnPrimary,
    fontWeight: typography.weights.semibold,
  },
});
