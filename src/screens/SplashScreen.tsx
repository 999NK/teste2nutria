import React, {useEffect} from 'react';
import {View, Text, StyleSheet, Image, ActivityIndicator} from 'react-native';
import {useAuth} from '../contexts/AuthContext';
import {useTheme} from '../contexts/ThemeContext';

interface SplashScreenProps {
  navigation: any;
}

const SplashScreen: React.FC<SplashScreenProps> = ({navigation}) => {
  const {isLoading, isAuthenticated, user} = useAuth();
  const {theme} = useTheme();

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        if (isAuthenticated) {
          // Check if user needs onboarding
          if (!user?.weight || !user?.height || !user?.target_calories) {
            navigation.replace('Onboarding');
          } else {
            navigation.replace('Main');
          }
        } else {
          navigation.replace('Login');
        }
      }, 2000); // Show splash for 2 seconds
    }
  }, [isLoading, isAuthenticated, user, navigation]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
    },
    logo: {
      width: 120,
      height: 120,
      marginBottom: 30,
      borderRadius: 30,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: '#ffffff',
      opacity: 0.8,
      marginBottom: 40,
    },
    loader: {
      marginTop: 20,
    },
  });

  return (
    <View style={styles.container}>
      {/* Logo placeholder - you can replace with actual logo */}
      <View style={[styles.logo, {backgroundColor: 'rgba(255,255,255,0.2)'}]}>
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Text style={{fontSize: 40, color: '#ffffff', fontWeight: 'bold'}}>
            🥗
          </Text>
        </View>
      </View>
      
      <Text style={styles.title}>NutrIA</Text>
      <Text style={styles.subtitle}>Seu Assistente Nutricional</Text>
      
      <ActivityIndicator 
        size="large" 
        color="#ffffff" 
        style={styles.loader}
      />
    </View>
  );
};

export default SplashScreen;