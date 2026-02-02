import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator, useColorScheme } from 'react-native';
import { Provider as PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/firebase';
import { useAuthStore } from './src/store/authStore';
import { convertFirebaseUser, logout } from './src/services/authService';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { SignUpScreen } from './src/screens/auth/SignUpScreen';
import { ForgotPasswordScreen } from './src/screens/auth/ForgotPasswordScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { TicketsScreen } from './src/screens/TicketsScreen';
import { InsightsScreen } from './src/screens/InsightsScreen';
import { TeamsScreen } from './src/screens/TeamsScreen';
import { CreateTeamScreen } from './src/screens/CreateTeamScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ActivityScreen } from './src/screens/ActivityScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import JoinTeamScreen from './src/screens/JoinTeamScreen';
import { colors, getPaperTheme } from './src/theme';
import { AppHeader, BottomNav, DesktopFooter, MobileHeader, TeamSelectionModal } from './src/components';
import { getActiveSession, clockIn, clockOut } from './src/services/timeSessionService';
import { getUserTeams } from './src/services/teamService';
import { useTeamUiStore } from './src/store/teamUiStore';
import { useSessionStore } from './src/store/sessionStore';
import {
  registerForPushNotificationsAsync,
  registerNotificationListeners,
  upsertUserPushToken,
} from './src/services/notificationService';
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  useFonts,
} from '@expo-google-fonts/geist';

const Tab = createBottomTabNavigator();

function MainApp() {
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showJoinTeam, setShowJoinTeam] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [openAddTicket, setOpenAddTicket] = useState(false);
  const [refreshTicketsKey, setRefreshTicketsKey] = useState(0);
  const [refreshTeamsKey, setRefreshTeamsKey] = useState(0);
  const [activeTab, setActiveTab] = useState<string>('Home');
  const navigationRef = useRef<any>(null);
  const { activeSession: footerSession, setActiveSession, setLastCompletedSession } =
    useSessionStore();
  const [footerElapsed, setFooterElapsed] = useState(0);
  const footerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const { teams, activeTeamId, setTeams, setActiveTeamId } = useTeamUiStore();


  const handleTeamCreated = () => {
    setRefreshTeamsKey((prev) => prev + 1);
    setActiveTab('Teams');
    setShowCreateTeam(false);
  };

  const handleTeamJoined = () => {
    setRefreshTeamsKey((prev) => prev + 1);
    setActiveTab('Teams');
    setShowJoinTeam(false);
  };

  // Footer session load
  useEffect(() => {
    const loadSession = async () => {
      const session = await getActiveSession(useAuthStore.getState().user?.uid || '');
      setActiveSession(session);
      if (session) {
        setFooterElapsed(Math.floor((Date.now() - session.startTime.getTime()) / 1000));
      } else {
        setFooterElapsed(0);
      }
    };
    loadSession();
  }, []);

  // Load teams once user is present
  useEffect(() => {
    const loadTeams = async () => {
      const uid = useAuthStore.getState().user?.uid;
      if (!uid) return;
      try {
        const fetched = await getUserTeams(uid);
        setTeams(fetched);
        if (!activeTeamId && fetched.length > 0) {
          setActiveTeamId(fetched[0].id);
        }
      } catch (e) {
        console.error('Error loading teams in app shell', e);
      }
    };
    loadTeams();
  }, [activeTeamId, setActiveTeamId, setTeams]);

  // Footer timer
  useEffect(() => {
    if (footerSession) {
      if (footerTimerRef.current) clearInterval(footerTimerRef.current);
      footerTimerRef.current = setInterval(() => {
        setFooterElapsed(Math.floor((Date.now() - footerSession.startTime.getTime()) / 1000));
      }, 1000);
    } else if (footerTimerRef.current) {
      clearInterval(footerTimerRef.current);
      footerTimerRef.current = null;
    }
    return () => {
      if (footerTimerRef.current) clearInterval(footerTimerRef.current);
    };
  }, [footerSession]);

  const handleFooterClockInOut = async () => {
    const uid = useAuthStore.getState().user?.uid;
    if (!uid) return;
    try {
      if (footerSession) {
        const completed = await clockOut(footerSession.id);
        setActiveSession(null);
        setLastCompletedSession(completed);
        setFooterElapsed(0);
      } else {
        const teamId = activeTeamId || (teams.length > 0 ? teams[0].id : undefined);
        const session = await clockIn(uid, undefined, undefined, teamId);
        setActiveSession(session);
        setFooterElapsed(0);
      }
    } catch (e) {
      console.error(e);
    } finally {
    }
  };

  useEffect(() => {
    if (!showCreateTeam && !showJoinTeam && !showActivity && !showProfile && navigationRef.current) {
      navigationRef.current.navigate(activeTab);
    }
  }, [showCreateTeam, showJoinTeam, showActivity, showProfile, activeTab]);

  if (showActivity) {
    return <ActivityScreen onBack={() => setShowActivity(false)} />;
  }

  if (showProfile) {
    return <ProfileScreen onBack={() => setShowProfile(false)} />;
  }

  if (showCreateTeam) {
    return (
      <CreateTeamScreen
        onBack={() => setShowCreateTeam(false)}
        onTeamCreated={handleTeamCreated}
      />
    );
  }

  if (showJoinTeam) {
    return (
      <JoinTeamScreen
        onBack={() => setShowJoinTeam(false)}
        onTeamJoined={handleTeamJoined}
      />
    );
  }

  const handleSignOut = async () => {
    try {
      await logout();
      useAuthStore.getState().logout();
    } catch (e) {
      console.error('Sign out failed', e);
    }
  };

  return (
    <View style={styles.shell}>
      <AppHeader
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          navigationRef.current?.navigate(tab);
        }}
        currentTeamName={teams.find((t) => t.id === activeTeamId)?.name || null}
        onTeamSwitch={() => setShowTeamModal(true)}
        onSignOut={handleSignOut}
      />

      <MobileHeader
        currentTeamName={teams.find((t) => t.id === activeTeamId)?.name || null}
        onTeamSwitch={() => setShowTeamModal(true)}
      />

      <View style={styles.contentArea}>
        <NavigationContainer ref={navigationRef} independent={true}>
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: 'none' },
            }}
          >
            <Tab.Screen name="Home">
              {() => (
                <HomeScreen
                  onOpenActivity={() => setShowActivity(true)}
                  onOpenAddTicket={() => {
                    setActiveTab('Tickets');
                    navigationRef.current?.navigate('Tickets');
                    setOpenAddTicket(true);
                  }}
                  onOpenTickets={() => {
                    setActiveTab('Tickets');
                    navigationRef.current?.navigate('Tickets');
                  }}
                />
              )}
            </Tab.Screen>
            <Tab.Screen name="Teams">
              {() => <TeamsScreen key={refreshTeamsKey} />}
            </Tab.Screen>
            <Tab.Screen name="Insights">
              {() => <InsightsScreen />}
            </Tab.Screen>
            <Tab.Screen name="Tickets">
              {() => (
                <TicketsScreen
                  key={refreshTicketsKey}
                  openAdd={openAddTicket}
                  onAddOpened={() => setOpenAddTicket(false)}
                />
              )}
            </Tab.Screen>
            <Tab.Screen name="Settings">
              {() => (
                <SettingsScreen
                  onOpenActivity={() => setShowActivity(true)}
                  onOpenProfile={() => setShowProfile(true)}
                />
              )}
            </Tab.Screen>
          </Tab.Navigator>
        </NavigationContainer>
      </View>

      <DesktopFooter
        isSessionActive={!!footerSession}
        elapsedSeconds={footerElapsed}
        onToggleSession={handleFooterClockInOut}
      />

      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          navigationRef.current?.navigate(tab);
        }}
        isSessionActive={!!footerSession}
        elapsedSeconds={footerElapsed}
        onToggleSession={handleFooterClockInOut}
      />

      <TeamSelectionModal
        visible={showTeamModal}
        teams={teams}
        activeTeamId={activeTeamId}
        onSelect={(team) => setActiveTeamId(team.id)}
        onClose={() => setShowTeamModal(false)}
      />
    </View>
  );
}

export default function App() {
  const [authScreen, setAuthScreen] = useState<'login' | 'signup' | 'forgot'>('login');
  const { user, isLoading, setUser } = useAuthStore();
  const scheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(convertFirebaseUser(firebaseUser));
      } else {
        setUser(null);
        useSessionStore.getState().resetSessionState();
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const cleanup = registerNotificationListeners();
    return cleanup;
  }, []);

  useEffect(() => {
    if (!user) return;
    let isActive = true;
    const syncToken = async () => {
      const token = await registerForPushNotificationsAsync();
      if (!token || !isActive) return;
      await upsertUserPushToken(user.uid, token);
    };
    syncToken();
    return () => {
      isActive = false;
    };
  }, [user?.uid]);


  if (isLoading || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const baseTheme = scheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
  const paper = getPaperTheme(scheme);
  const customTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      ...paper.colors,
    },
    roundness: paper.roundness,
  };

  return (
    <PaperProvider theme={customTheme}>
      <View style={styles.container}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

        {user ? (
          <MainApp />
        ) : authScreen === 'login' ? (
          <LoginScreen
            onNavigateToSignUp={() => setAuthScreen('signup')}
            onNavigateToForgot={() => setAuthScreen('forgot')}
          />
        ) : authScreen === 'forgot' ? (
          <ForgotPasswordScreen onBackToLogin={() => setAuthScreen('login')} />
        ) : (
          <SignUpScreen onNavigateToLogin={() => setAuthScreen('login')} />
        )}
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.backgroundStart,
  },
  contentArea: {
    flex: 1,
    paddingTop: 90,
    paddingBottom: 90,
  },
  container: {
    flex: 1,
    backgroundColor: colors.backgroundStart,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundStart,
  },
  footer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
});
