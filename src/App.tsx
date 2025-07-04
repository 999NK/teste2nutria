import React, {useState, useEffect} from 'react';
import {View, StyleSheet, StatusBar, TouchableOpacity, Text} from 'react-native';
import {AuthProvider, useAuth} from './contexts/AuthContext';
import {ThemeProvider, useTheme} from './contexts/ThemeContext';

// Import screens
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import MealsScreen from './screens/MealsScreen';
import ProgressScreen from './screens/ProgressScreen';
import MyPlanScreen from './screens/MyPlanScreen';
import AIAssistantScreen from './screens/AIAssistantScreen';
import ProfileScreen from './screens/ProfileScreen';
import OnboardingScreen from './screens/OnboardingScreen';

// Import navigation
import BottomTabNavigator from './navigation/BottomTabNavigator';

// Simple navigation state management
type Screen = 
  | 'Splash'
  | 'Login'
  | 'Register'
  | 'Onboarding'
  | 'Dashboard'
  | 'Meals'
  | 'Progress'
  | 'MyPlan'
  | 'AIAssistant'
  | 'Profile';

const AppContent: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Splash');
  const {user, isLoading} = useAuth();
  const {theme, isDark} = useTheme();

  // Navigation helper
  const navigation = {
    navigate: (screen: Screen) => setCurrentScreen(screen),
    replace: (screen: Screen) => setCurrentScreen(screen),
  };

  // Main tab screens that show bottom navigation
  const mainTabScreens: Screen[] = ['Dashboard', 'Meals', 'Progress', 'MyPlan', 'Profile'];
  const showBottomTabs = mainTabScreens.includes(currentScreen);

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Check if user needs onboarding
        if (!user.isProfileComplete) {
          setCurrentScreen('Onboarding');
        } else {
          setCurrentScreen('Dashboard');
        }
      } else {
        setCurrentScreen('Login');
      }
    }
  }, [user, isLoading]);

  // Handle tab navigation
  const handleTabPress = (tab: string) => {
    setCurrentScreen(tab as Screen);
  };

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'Splash':
        return <SplashScreen navigation={navigation} />;
      case 'Login':
        return <LoginScreen navigation={navigation} />;
      case 'Register':
        return <RegisterScreen navigation={navigation} />;
      case 'Onboarding':
        return <OnboardingScreen navigation={navigation} />;
      case 'Dashboard':
        return <DashboardScreen navigation={navigation} />;
      case 'Meals':
        return <MealsScreen navigation={navigation} />;
      case 'Progress':
        return <ProgressScreen navigation={navigation} />;
      case 'MyPlan':
        return <MyPlanScreen navigation={navigation} />;
      case 'AIAssistant':
        return <AIAssistantScreen navigation={navigation} />;
      case 'Profile':
        return <ProfileScreen navigation={navigation} />;
      default:
        return <DashboardScreen navigation={navigation} />;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    screenContainer: {
      flex: 1,
    },
    floatingButton: {
      position: 'absolute',
      bottom: 90,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
      zIndex: 1000,
    },
    floatingButtonText: {
      color: '#ffffff',
      fontSize: 24,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>
      
      {/* Show bottom tabs only for main screens and authenticated users */}
      {showBottomTabs && user && (
        <BottomTabNavigator
          activeTab={currentScreen}
          onTabPress={handleTabPress}
        />
      )}
      
      {/* AI Assistant floating button for main screens */}
      {showBottomTabs && currentScreen !== 'AIAssistant' && user && (
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={() => setCurrentScreen('AIAssistant')}
        >
          <Text style={styles.floatingButtonText}>🤖</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;