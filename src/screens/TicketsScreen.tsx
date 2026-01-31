import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Menu, Portal } from 'react-native-paper';
import { useAuthStore } from '../store/authStore';
import { useTeamUiStore } from '../store/teamUiStore';
import { useSessionStore } from '../store/sessionStore';
import { Ticket } from '../types';
import {
  createTicketForTeam,
  deleteTicket,
  getTickets,
  updateTicket,
} from '../services/ticketService';
import {
  clockIn,
  getActiveSession,
  startTicketTracking,
  stopTicketTracking,
  updateSessionNote,
} from '../services/timeSessionService';
import { Modal } from '../components';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

interface TicketsScreenProps {
  openAdd?: boolean;
  onAddOpened?: () => void;
}

export const TicketsScreen: React.FC<TicketsScreenProps> = ({ openAdd, onAddOpened }) => {
  const user = useAuthStore((s) => s.user);
  const { activeTeamId, teams } = useTeamUiStore();
  const contentMaxWidth = 1180;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Open' | 'In Progress' | 'Closed'>('All');
  const { activeSession, setActiveSession } = useSessionStore();
  const activeSessionId = activeSession?.id ?? null;
  const activeTicketId = activeSession?.ticketId ?? null;

  const [addOpen, setAddOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentFocused, setCommentFocused] = useState(false);
  const [pendingTicket, setPendingTicket] = useState<Ticket | null>(null);
  const [commentMode, setCommentMode] = useState<'stop' | 'switch'>('stop');
  const [searchFocused, setSearchFocused] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [focusedField, setFocusedField] = useState<
    'title' | 'description' | 'reference' | 'status' | 'priority' | null
  >(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);

  const WebSelect: React.ElementType = Platform.OS === 'web' ? 'select' : View;
  const WebOption: React.ElementType = Platform.OS === 'web' ? 'option' : View;

  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    status: 'Open' as Ticket['status'],
    priority: 'Medium' as Ticket['priority'],
    reference: '',
  });

  const currentTeam = useMemo(() => {
    return teams.find((t) => t.id === activeTeamId);
  }, [teams, activeTeamId]);

  useEffect(() => {
    const load = async () => {
      if (!activeTeamId) {
        setTickets([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const list = await getTickets(activeTeamId);
      setTickets(list);
      if (user && !activeSession) {
        const session = await getActiveSession(user.uid);
        if (session) setActiveSession(session);
      }
      setLoading(false);
    };
    load();
  }, [activeTeamId, user, activeSession, setActiveSession]);


  useEffect(() => {
    if (openAdd) {
      setEditing(false);
      setSelectedTicket(null);
      setAddOpen(true);
      onAddOpened?.();
    }
  }, [openAdd, onAddOpened]);

  const statusColors = (status: Ticket['status']) => {
    switch (status) {
      case 'Closed':
        return { bg: '#DCFCE7', text: '#15803D' };
      case 'In Progress':
        return { bg: '#DBEAFE', text: '#2563EB' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const priorityColors = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'High':
        return { bg: '#FEE2E2', text: '#DC2626' };
      case 'Low':
        return { bg: '#E0E7FF', text: '#4F46E5' };
      default:
        return { bg: '#EDE9FE', text: '#6D28D9' };
    }
  };

  const filteredTickets = useMemo(() => {
    const bySearch = tickets.filter((t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase())
    );
    if (activeTab === 'All') return bySearch;
    return bySearch.filter((t) => t.status === activeTab);
  }, [tickets, search, activeTab]);

  const handleSaveTicket = async () => {
    if (!user || !activeTeamId) return;
    if (!newTicket.title.trim()) return;
    if (editing && selectedTicket) {
      await updateTicket(activeTeamId, selectedTicket.id, {
        title: newTicket.title,
        description: newTicket.description,
        status: newTicket.status,
        priority: newTicket.priority,
        link: newTicket.reference,
      });
    } else {
      await createTicketForTeam(activeTeamId, {
        title: newTicket.title,
        description: newTicket.description,
        status: newTicket.status,
        priority: newTicket.priority,
        link: newTicket.reference,
      }, user.uid);
    }
    const list = await getTickets(activeTeamId);
    setTickets(list);
    setAddOpen(false);
    setEditing(false);
    setSelectedTicket(null);
    setNewTicket({ title: '', description: '', status: 'Open', priority: 'Medium', reference: '' });
  };

  const handleStatusChange = async (status: Ticket['status']) => {
    if (!activeTeamId || !selectedTicket) return;
    await updateTicket(activeTeamId, selectedTicket.id, { status });
    const list = await getTickets(activeTeamId);
    setTickets(list);
    setStatusOpen(false);
  };

  const handleAssign = async (memberId: string) => {
    if (!activeTeamId || !selectedTicket) return;
    await updateTicket(activeTeamId, selectedTicket.id, { assignedTo: memberId });
    const list = await getTickets(activeTeamId);
    setTickets(list);
    setAssignOpen(false);
  };

  const handleDelete = async () => {
    if (!activeTeamId || !selectedTicket) return;
    await deleteTicket(activeTeamId, selectedTicket.id);
    const list = await getTickets(activeTeamId);
    setTickets(list);
    setDeleteOpen(false);
  };

  const handleStartStop = async (ticket: Ticket) => {
    if (!user) return;
    if (activeSessionId) {
      if (activeTicketId === ticket.id) {
        setPendingTicket(ticket);
        setCommentMode('stop');
        setCommentText('');
        setCommentOpen(true);
        return;
      }
      if (activeTicketId) {
        setPendingTicket(ticket);
        setCommentMode('switch');
        setCommentText('');
        setCommentOpen(true);
        return;
      }
      await startTicketTracking(activeSessionId, ticket.id, ticket.title);
      if (activeSession) {
        setActiveSession({
          ...activeSession,
          ticketId: ticket.id,
          ticketTitle: ticket.title,
          ticketStartTime: new Date(),
        });
      }
    } else {
      const session = await clockIn(user.uid, ticket.id, ticket.title, activeTeamId || undefined);
      setActiveSession(session);
    }
  };

  const handleConfirmComment = async () => {
    if (!activeSessionId || !pendingTicket) return;
    await updateSessionNote(activeSessionId, commentText.trim() || undefined);
    if (commentMode === 'stop') {
      await stopTicketTracking(activeSessionId);
      if (activeSession) {
        setActiveSession({
          ...activeSession,
          ticketId: undefined,
          ticketTitle: undefined,
          ticketStartTime: null,
        });
      }
    } else {
      await stopTicketTracking(activeSessionId);
      await startTicketTracking(activeSessionId, pendingTicket.id, pendingTicket.title);
      if (activeSession) {
        setActiveSession({
          ...activeSession,
          ticketId: pendingTicket.id,
          ticketTitle: pendingTicket.title,
          ticketStartTime: new Date(),
        });
      }
    }
    setCommentOpen(false);
    setPendingTicket(null);
    setCommentText('');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.contentWidth, { maxWidth: contentMaxWidth }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tickets</Text>
          <Text style={styles.subtitle}>Manage and track your tasks</Text>
        </View>
        <Pressable style={styles.newButton} onPress={() => setAddOpen(true)}>
          <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          <Text style={styles.newButtonText}>New Ticket</Text>
        </Pressable>
      </View>

      <View style={styles.filterCard}>
        <View style={styles.filterHeader}>
          <View style={styles.tabs}>
            {(['All', 'Open', 'In Progress', 'Closed'] as const).map((tab) => (
              <Pressable
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.searchGroup}>
            <View style={[styles.searchRow, searchFocused && styles.searchRowFocused]}>
              <MaterialCommunityIcons name="magnify" size={16} color={colors.textMuted} style={styles.searchIcon} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search tickets..."
                style={styles.searchInput}
              />
            </View>
            <Pressable style={styles.filterButton}>
              <MaterialCommunityIcons name="filter-variant" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.listCard}>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredTickets.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="ticket-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No tickets found matching your criteria</Text>
          </View>
        ) : (
          filteredTickets.map((ticket) => {
            const isActive = activeTicketId === ticket.id;
            const assigneeName =
              currentTeam?.members?.find((m) => m.id === ticket.assignedTo)?.name ||
              ticket.assignee?.full_name ||
              'UN';
            const assigneeInitials = assigneeName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase();
            return (
              <Pressable
                key={ticket.id}
                style={[styles.ticketRow, isActive && styles.ticketRowActive]}
                onPress={() => {
                  setSelectedTicket(ticket);
                  setDetailOpen(true);
                }}
              >
                <Pressable style={[styles.playButton, isActive && styles.stopButton]} onPress={() => handleStartStop(ticket)}>
                  <MaterialCommunityIcons name={isActive ? 'stop' : 'play'} size={14} color={isActive ? '#fff' : colors.primary} />
                </Pressable>
                <View style={styles.ticketInfo}>
                  <View style={styles.ticketMetaRow}>
                    <Text style={styles.ticketId}>{ticket.id.slice(0, 8)}</Text>
                    <Pressable
                      style={[
                        styles.statusPill,
                        { backgroundColor: statusColors(ticket.status).bg },
                      ]}
                      onPress={() => {
                        setSelectedTicket(ticket);
                        setStatusOpen(true);
                      }}
                    >
                      <Text style={[styles.statusText, { color: statusColors(ticket.status).text }]}>
                        {ticket.status}
                      </Text>
                    </Pressable>
                    <View
                      style={[
                        styles.priorityPill,
                        { backgroundColor: priorityColors(ticket.priority || 'Medium').bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityText,
                          { color: priorityColors(ticket.priority || 'Medium').text },
                        ]}
                      >
                        {ticket.priority || 'Medium'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.ticketTitle} numberOfLines={1}>{ticket.title}</Text>
                </View>
                <View style={styles.rowRight}>
                  <View style={styles.assigneeBubble}>
                    <Text style={styles.assigneeText}>{assigneeInitials}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </View>
      </View>

      {/* Add / Edit */}
      <Modal
        visible={addOpen}
        title={editing ? 'Edit Ticket' : 'Add Ticket'}
        onClose={() => setAddOpen(false)}
        maxWidth={520}
      >
        <View style={styles.modalBody}>
          <View style={styles.modalIntro}>
            <View style={styles.modalIntroIcon}>
              <MaterialCommunityIcons name="ticket-outline" size={16} color={colors.success} />
            </View>
            <Text style={styles.modalIntroText}>
              {editing
                ? 'Update the ticket details below.'
                : 'Create a new ticket to track your work.'}
            </Text>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Title</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedField === 'title' && styles.inputWrapperFocused,
              ]}
            >
              <TextInput
                value={newTicket.title}
                onChangeText={(val) => setNewTicket((p) => ({ ...p, title: val }))}
                placeholder="Enter ticket title"
                style={styles.inputField}
                onFocus={() => setFocusedField('title')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Description (optional)</Text>
            <View
              style={[
                styles.inputWrapper,
                styles.textareaWrapper,
                focusedField === 'description' && styles.inputWrapperFocused,
              ]}
            >
              <TextInput
                value={newTicket.description}
                onChangeText={(val) => setNewTicket((p) => ({ ...p, description: val }))}
                placeholder="Add more details..."
                style={[styles.inputField, styles.modalTextarea]}
                multiline
                onFocus={() => setFocusedField('description')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Reference Link (optional)</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedField === 'reference' && styles.inputWrapperFocused,
              ]}
            >
              <TextInput
                value={newTicket.reference}
                onChangeText={(val) => setNewTicket((p) => ({ ...p, reference: val }))}
                placeholder="https://..."
                style={styles.inputField}
                onFocus={() => setFocusedField('reference')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>
          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <Text style={styles.fieldLabel}>Status</Text>
              {Platform.OS === 'web' ? (
                <View
                  style={[
                    styles.webSelectWrapper,
                    focusedField === 'status' && styles.inputWrapperFocused,
                  ]}
                >
                  <WebSelect
                    value={newTicket.status}
                    onChange={(e: any) => setNewTicket((p) => ({ ...p, status: e.target.value }))}
                    onFocus={() => setFocusedField('status')}
                    onBlur={() => setFocusedField(null)}
                    style={styles.webSelect}
                  >
                    {(['Open', 'In Progress', 'Closed'] as const).map((s) => (
                      <WebOption key={s} value={s}>
                        {s}
                      </WebOption>
                    ))}
                  </WebSelect>
                </View>
              ) : (
                <View style={[styles.selectWrapper, statusDropdownOpen && styles.selectWrapperOpen]}>
                  <Portal>
                    <Menu
                      visible={statusDropdownOpen}
                      onDismiss={() => setStatusDropdownOpen(false)}
                      anchor={
                        <View collapsable={false}>
                          <Pressable
                            style={[
                              styles.selectControl,
                              statusDropdownOpen && styles.selectControlFocused,
                            ]}
                            onPress={() => {
                              setStatusDropdownOpen((prev) => !prev);
                              setPriorityDropdownOpen(false);
                            }}
                          >
                            <Text style={styles.selectText}>{newTicket.status}</Text>
                            <MaterialCommunityIcons
                              name="chevron-down"
                              size={18}
                              color={colors.textMuted}
                            />
                          </Pressable>
                        </View>
                      }
                      anchorPosition="bottom"
                      contentStyle={styles.menuContent}
                      style={styles.menuContainer}
                    >
                      {(['Open', 'In Progress', 'Closed'] as const).map((s) => (
                        <Menu.Item
                          key={s}
                          onPress={() => {
                            setNewTicket((p) => ({ ...p, status: s }));
                            setStatusDropdownOpen(false);
                          }}
                          title={s}
                          titleStyle={styles.menuItemText}
                        />
                      ))}
                    </Menu>
                  </Portal>
                </View>
              )}
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.fieldLabel}>Priority</Text>
              {Platform.OS === 'web' ? (
                <View
                  style={[
                    styles.webSelectWrapper,
                    focusedField === 'priority' && styles.inputWrapperFocused,
                  ]}
                >
                  <WebSelect
                    value={newTicket.priority}
                    onChange={(e: any) =>
                      setNewTicket((p) => ({ ...p, priority: e.target.value }))
                    }
                    onFocus={() => setFocusedField('priority')}
                    onBlur={() => setFocusedField(null)}
                    style={styles.webSelect}
                  >
                    {(['Low', 'Medium', 'High'] as const).map((p) => (
                      <WebOption key={p} value={p}>
                        {p}
                      </WebOption>
                    ))}
                  </WebSelect>
                </View>
              ) : (
                <View style={[styles.selectWrapper, priorityDropdownOpen && styles.selectWrapperOpen]}>
                  <Portal>
                    <Menu
                      visible={priorityDropdownOpen}
                      onDismiss={() => setPriorityDropdownOpen(false)}
                      anchor={
                        <View collapsable={false}>
                          <Pressable
                            style={[
                              styles.selectControl,
                              priorityDropdownOpen && styles.selectControlFocused,
                            ]}
                            onPress={() => {
                              setPriorityDropdownOpen((prev) => !prev);
                              setStatusDropdownOpen(false);
                            }}
                          >
                            <Text style={styles.selectText}>{newTicket.priority}</Text>
                            <MaterialCommunityIcons
                              name="chevron-down"
                              size={18}
                              color={colors.textMuted}
                            />
                          </Pressable>
                        </View>
                      }
                      anchorPosition="bottom"
                      contentStyle={styles.menuContent}
                      style={styles.menuContainer}
                    >
                      {(['Low', 'Medium', 'High'] as const).map((p) => (
                        <Menu.Item
                          key={p}
                          onPress={() => {
                            setNewTicket((prev) => ({ ...prev, priority: p }));
                            setPriorityDropdownOpen(false);
                          }}
                          title={p}
                          titleStyle={styles.menuItemText}
                        />
                      ))}
                    </Menu>
                  </Portal>
                </View>
              )}
            </View>
          </View>
          <View style={styles.modalActionsStack}>
            <Pressable
              style={[styles.modalPrimaryFull, editing ? styles.modalPrimary : styles.modalPrimarySuccess]}
              onPress={handleSaveTicket}
            >
              <Text style={styles.modalPrimaryText}>{editing ? 'Update Ticket' : 'Create Ticket'}</Text>
            </Pressable>
            <Pressable style={styles.modalCancelOutline} onPress={() => setAddOpen(false)}>
              <Text style={styles.modalCancelOutlineText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Status */}
      <Modal visible={statusOpen} title="Change Status" onClose={() => setStatusOpen(false)}>
        <View style={styles.modalBody}>
          <Text style={styles.modalHelp}>Select a new status for this ticket.</Text>
          {(['Open', 'In Progress', 'Closed'] as const).map((s) => {
            const isSelected = selectedTicket?.status === s;
            const dotColor =
              s === 'Closed' ? '#22C55E' : s === 'In Progress' ? '#3B82F6' : '#9CA3AF';
            return (
              <Pressable
                key={s}
                style={[
                  styles.statusOption,
                  isSelected && styles.statusOptionSelected,
                ]}
                onPress={() => handleStatusChange(s)}
              >
                <View style={styles.statusOptionLeft}>
                  <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
                  <Text style={styles.statusOptionText}>{s}</Text>
                </View>
                {isSelected && (
                  <MaterialCommunityIcons name="check" size={16} color={colors.primary} />
                )}
              </Pressable>
            );
          })}
          <View style={styles.modalActions}>
            <Pressable style={styles.modalCancel} onPress={() => setStatusOpen(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Detail */}
      <Modal
        visible={detailOpen}
        title="Ticket Details"
        onClose={() => setDetailOpen(false)}
        maxWidth={520}
      >
        {selectedTicket && (
          <View style={styles.detailBody}>
            <View style={styles.detailMetaRow}>
              <Text style={styles.detailId}>{selectedTicket.id.slice(0, 8)}</Text>
              <View style={styles.detailPillRow}>
                <View style={[styles.detailPill, styles.detailStatusPill]}>
                  <Text style={styles.detailStatusText}>{selectedTicket.status}</Text>
                </View>
                <View style={[styles.detailPill, styles.detailPriorityPill]}>
                  <Text style={styles.detailPriorityText}>
                    {selectedTicket.priority || 'Medium'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailCardLabel}>DESCRIPTION</Text>
              <Text style={styles.detailDesc}>
                {selectedTicket.description || 'No description provided.'}
              </Text>
            </View>

            <Pressable
              style={styles.detailAssignRow}
              onPress={() => {
                setDetailOpen(false);
                setAssignOpen(true);
              }}
            >
              <View style={styles.detailAssignAvatar}>
                <Text style={styles.detailAssignAvatarText}>
                  {selectedTicket.assignedTo
                    ? (currentTeam?.members?.find((m) => m.id === selectedTicket.assignedTo)?.name ||
                        'U')[0]
                    : 'UN'}
                </Text>
              </View>
              <View style={styles.detailAssignInfo}>
                <Text style={styles.detailAssignName}>
                  {selectedTicket.assignedTo
                    ? currentTeam?.members?.find((m) => m.id === selectedTicket.assignedTo)?.name ||
                      'Unassigned'
                    : 'Unassigned'}
                </Text>
                <Text style={styles.detailAssignSub}>Currently assigned</Text>
              </View>
              <MaterialCommunityIcons name="account-plus-outline" size={18} color={colors.primary} />
            </Pressable>

            <View style={styles.detailActionsRow}>
              <Pressable
                style={styles.detailActionGhost}
                onPress={() => {
                  setDetailOpen(false);
                  setStatusOpen(true);
                }}
              >
                <MaterialCommunityIcons name="swap-horizontal" size={16} color={colors.textPrimary} />
                <Text style={styles.detailActionText}>Change Status</Text>
              </Pressable>
              <Pressable
                style={styles.detailActionGhost}
                onPress={() => {
                  setEditing(true);
                  setAddOpen(true);
                  setDetailOpen(false);
                  setNewTicket({
                    title: selectedTicket.title,
                    description: selectedTicket.description || '',
                    status: selectedTicket.status,
                    priority: selectedTicket.priority || 'Medium',
                    reference: selectedTicket.url || '',
                  });
                }}
              >
                <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.textPrimary} />
                <Text style={styles.detailActionText}>Edit Ticket</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.detailDeleteRow}
              onPress={() => {
                setDetailOpen(false);
                setDeleteOpen(true);
              }}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.error} />
              <Text style={styles.detailDeleteText}>Delete Ticket</Text>
            </Pressable>
          </View>
        )}
      </Modal>

      {/* Assign */}
      <Modal visible={assignOpen} title="Assign Ticket" onClose={() => setAssignOpen(false)}>
        <View style={styles.modalBody}>
          <Text style={styles.modalHelp}>
            Select a team member to assign {selectedTicket?.title}.
          </Text>
          <View style={styles.assignList}>
            {currentTeam?.members?.map((member) => (
              <Pressable
                key={member.id}
                style={styles.assignRow}
                onPress={() => handleAssign(member.id)}
              >
                <View style={styles.assignAvatar}>
                  <Text style={styles.assignAvatarText}>{member.name.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={styles.assignInfo}>
                  <Text style={styles.assignName}>{member.name}</Text>
                  <Text style={styles.assignRole}>{member.role}</Text>
                </View>
                {member.status === 'online' && <View style={styles.assignOnlineDot} />}
              </Pressable>
            ))}
          </View>
          <View style={styles.modalActions}>
            <Pressable style={styles.modalCancel} onPress={() => setAssignOpen(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Comment Modal */}
      <Modal
        visible={commentOpen}
        title={commentMode === 'stop' ? 'Stop Working' : 'Switch Ticket'}
        onClose={() => setCommentOpen(false)}
      >
        <View style={styles.modalBody}>
          <Text style={styles.modalHelp}>
            {commentMode === 'stop'
              ? 'Are you sure you want to stop working on this ticket?'
              : 'You are currently working on another ticket. Do you want to switch?'}
          </Text>
          <Text style={styles.modalLabel}>Work Description (Optional)</Text>
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="What did you work on?"
            onFocus={() => setCommentFocused(true)}
            onBlur={() => setCommentFocused(false)}
            style={[styles.modalInput, commentFocused && styles.modalInputFocused, styles.modalTextarea]}
            multiline
          />
          <View style={styles.modalActions}>
            <Pressable style={styles.modalCancel} onPress={() => setCommentOpen(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.modalPrimary}
              onPress={handleConfirmComment}
            >
              <Text style={styles.modalPrimaryText}>
                {commentMode === 'stop' ? 'Stop Timer' : 'Switch & Start'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Delete */}
      <Modal visible={deleteOpen} title="Delete Ticket" onClose={() => setDeleteOpen(false)}>
        <View style={styles.modalBody}>
          <Text style={styles.modalHelp}>
            Are you sure you want to delete {selectedTicket?.title}? This action cannot be undone.
          </Text>
          <View style={styles.modalActions}>
            <Pressable style={styles.modalCancel} onPress={() => setDeleteOpen(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.modalDanger} onPress={handleDelete}>
              <Text style={styles.modalPrimaryText}>Delete Ticket</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
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
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  newButtonText: {
    color: '#fff',
    fontWeight: typography.weights.medium,
    fontFamily: typography.fonts.medium,
  },
  filterCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
    marginBottom: spacing.lg,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    flexWrap: 'wrap',
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: colors.infoLight,
  },
  tabText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontFamily: typography.fonts.medium,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fonts.semibold,
  },
  searchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minWidth: 260,
    maxWidth: 340,
    height: 40,
  },
  searchRowFocused: {
    borderColor: colors.primary,
    boxShadow: `0 0 0 2px rgba(37, 99, 235, 0.2)`,
  },
  searchIcon: {
    position: 'absolute',
    left: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingLeft: 20,
    color: colors.textPrimary,
    backgroundColor: 'transparent',
    outlineStyle: 'none',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    position: 'relative',
  },
  ticketRowActive: {
    backgroundColor: colors.infoLight,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stopButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  ticketId: {
    fontSize: 11,
    color: colors.textMuted,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
  priorityPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
  ticketTitle: {
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fonts.semibold,
    color: colors.textPrimary,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  assigneeBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  assigneeText: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  loading: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  modalBody: {
    gap: spacing.md,
    overflow: 'visible',
  },
  modalIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  modalIntroIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIntroText: {
    color: colors.textSecondary,
    fontFamily: typography.fonts.medium,
  },
  modalHelp: {
    color: colors.textSecondary,
  },
  modalLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
    fontFamily: typography.fonts.medium,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    outlineStyle: 'none',
  },
  modalInputFocused: {
    borderColor: colors.primary,
    outlineColor: colors.primary,
    outlineWidth: 2,
    outlineStyle: 'solid',
    outlineOffset: 0,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  fieldHalf: {
    flex: 1,
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
    fontFamily: typography.fonts.medium,
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  inputWrapperFocused: {
    borderColor: colors.success,
    outlineColor: colors.success,
    outlineWidth: 2,
    outlineStyle: 'solid',
    outlineOffset: 0,
  },
  inputField: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    borderWidth: 0,
    outlineStyle: 'none',
  },
  textareaWrapper: {
    minHeight: 100,
  },
  modalTextarea: {
    height: 100,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
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
    fontFamily: typography.fonts.medium,
  },
  modalPrimary: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  modalPrimarySuccess: {
    backgroundColor: colors.success,
  },
  modalDanger: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.error,
  },
  modalActionsStack: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  modalPrimaryFull: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
  },
  modalCancelOutline: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  modalCancelOutlineText: {
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
    fontFamily: typography.fonts.medium,
  },
  modalPrimaryText: {
    color: colors.textOnPrimary,
    fontWeight: typography.weights.medium,
    fontFamily: typography.fonts.medium,
  },
  detailBody: {
    gap: spacing.md,
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailId: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: typography.fonts.medium,
  },
  detailPillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  detailPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  detailStatusPill: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  detailStatusText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: typography.weights.semibold,
  },
  detailPriorityPill: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  detailPriorityText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: typography.weights.semibold,
  },
  detailCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  detailCardLabel: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1,
    fontFamily: typography.fonts.medium,
    marginBottom: spacing.xs,
  },
  detailDesc: {
    color: colors.textSecondary,
  },
  detailAssignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  detailAssignAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailAssignAvatarText: {
    color: colors.textMuted,
    fontWeight: typography.weights.semibold,
  },
  detailAssignInfo: {
    flex: 1,
  },
  detailAssignName: {
    color: colors.textPrimary,
    fontWeight: typography.weights.semibold,
  },
  detailAssignSub: {
    color: colors.textMuted,
    fontSize: 12,
  },
  detailActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  detailActionGhost: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
  },
  detailActionText: {
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
    fontFamily: typography.fonts.medium,
  },
  detailDeleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    justifyContent: 'center',
  },
  detailDeleteText: {
    color: colors.error,
    fontWeight: typography.weights.medium,
    fontFamily: typography.fonts.medium,
  },
  statusOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
  },
  statusOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
  },
  statusOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusOptionText: {
    color: colors.textPrimary,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  selectWrapper: {
    position: 'relative',
    zIndex: 1,
  },
  selectWrapperOpen: {
    zIndex: 20,
  },
  selectControl: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectControlFocused: {
    borderColor: colors.success,
    outlineColor: colors.success,
    outlineWidth: 2,
    outlineStyle: 'solid',
  },
  selectText: {
    color: colors.textPrimary,
  },
  menuContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  menuItemText: {
    color: colors.textPrimary,
  },
  menuContainer: {
    zIndex: 999,
  },
  webSelectWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  webSelect: {
    width: '100%',
    padding: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: 'transparent',
    borderWidth: 0,
    outlineStyle: 'none',
  },
  choicePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surfaceSecondary,
  },
  choicePillActive: {
    backgroundColor: colors.infoLight,
    borderColor: colors.primary,
  },
  choiceText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  choiceTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  assignList: {
    maxHeight: 300,
    gap: spacing.sm,
  },
  assignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surfaceSecondary,
  },
  assignAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignAvatarText: {
    color: '#fff',
    fontWeight: typography.weights.semibold,
  },
  assignInfo: {
    flex: 1,
  },
  assignName: {
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  assignRole: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  assignOnlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
});
