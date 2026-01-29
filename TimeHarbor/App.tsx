import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/firebase';
import { useAuthStore } from './src/store/authStore';
import { convertFirebaseUser } from './src/services/authService';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { SignUpScreen } from './src/screens/auth/SignUpScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { TicketsScreen } from './src/screens/TicketsScreen';
import { CreateTicketScreen } from './src/screens/CreateTicketScreen';
import { TeamsScreen } from './src/screens/TeamsScreen';
import { CreateTeamScreen } from './src/screens/CreateTeamScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import JoinTeamScreen from './src/screens/JoinTeamScreen';
import { colors, paperTheme } from './src/theme';

const Tab = createBottomTabNavigator();

// Customized paper theme
const customTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...paperTheme.colors,
  },
  roundness: paperTheme.roundness,
};

function MainApp() {
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showJoinTeam, setShowJoinTeam] = useState(false);
  const [refreshTicketsKey, setRefreshTicketsKey] = useState(0);
  const [refreshTeamsKey, setRefreshTeamsKey] = useState(0);
  const [activeTab, setActiveTab] = useState<string>('Home');
  const navigationRef = useRef<any>(null);

  const handleTicketCreated = () => {
    setRefreshTicketsKey((prev) => prev + 1);
    setActiveTab('Tickets');
    setShowCreateTicket(false);
  };

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

  useEffect(() => {
    if (!showCreateTicket && !showCreateTeam && !showJoinTeam && navigationRef.current) {
      navigationRef.current.navigate(activeTab);
    }
  }, [showCreateTicket, showCreateTeam, showJoinTeam, activeTab]);

  if (showCreateTicket) {
    return (
      <CreateTicketScreen
        onBack={() => setShowCreateTicket(false)}
        onTicketCreated={handleTicketCreated}
      />
    );
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

  return (
    <NavigationContainer ref={navigationRef} independent={true}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingTop: 8,
            paddingBottom: Platform.OS === 'ios' ? 24 : 8,
            height: Platform.OS === 'ios' ? 88 : 64,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 4,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'home' : 'home-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Teams"
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'account-group' : 'account-group-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        >
          {() => (
            <TeamsScreen
              key={refreshTeamsKey}
              onCreateTeam={() => {
                setActiveTab('Teams');
                setShowCreateTeam(true);
              }}
              onJoinTeam={() => {
                setActiveTab('Teams');
                setShowJoinTeam(true);
              }}
            />
          )}
        </Tab.Screen>
        <Tab.Screen
          name="Tickets"
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'ticket' : 'ticket-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        >
          {() => (
            <TicketsScreen
              key={refreshTicketsKey}
              onCreateTicket={() => {
                setActiveTab('Tickets');
                setShowCreateTicket(true);
              }}
            />
          )}
        </Tab.Screen>
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'cog' : 'cog-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');
  const { user, isLoading, setUser } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(convertFirebaseUser(firebaseUser));
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <PaperProvider theme={customTheme}>
      <View style={styles.container}>
        <StatusBar style="dark" />

        {user ? (
          <MainApp />
        ) : authScreen === 'login' ? (
          <LoginScreen onNavigateToSignUp={() => setAuthScreen('signup')} />
        ) : (
          <SignUpScreen onNavigateToLogin={() => setAuthScreen('login')} />
        )}
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
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
});
