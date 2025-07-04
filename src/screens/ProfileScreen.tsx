import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';
import {useAuth} from '../contexts/AuthContext';

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({navigation}) => {
  const {theme, isDark, toggleTheme} = useTheme();
  const {user, logout} = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.replace('Login');
            } catch (error) {
              console.error('Logout failed:', error);
            }
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: 20,
      paddingBottom: 10,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 5,
    },
    scrollContainer: {
      padding: 20,
      paddingTop: 10,
    },
    profileCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      alignItems: 'center',
    },
    profileName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 5,
    },
    profileEmail: {
      fontSize: 16,
      color: theme.colors.text,
      opacity: 0.7,
    },
    section: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 15,
    },
    optionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    optionLabel: {
      fontSize: 16,
      color: theme.colors.text,
    },
    goalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    goalLabel: {
      fontSize: 16,
      color: theme.colors.text,
    },
    goalValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    actionButton: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    actionButtonText: {
      fontSize: 16,
      color: theme.colors.text,
      textAlign: 'center',
    },
    logoutButton: {
      backgroundColor: '#ef4444',
      borderRadius: 12,
      padding: 16,
      marginTop: 20,
    },
    logoutButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileCard}>
          <Text style={styles.profileName}>{user?.name || 'Usuário'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'email@exemplo.com'}</Text>
        </View>

        {/* Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suas Metas</Text>
          
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>Calorias Diárias:</Text>
            <Text style={styles.goalValue}>{user?.target_calories || 2000} kcal</Text>
          </View>
          
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>Proteína:</Text>
            <Text style={styles.goalValue}>{user?.target_protein || 150}g</Text>
          </View>
          
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>Carboidratos:</Text>
            <Text style={styles.goalValue}>{user?.target_carbs || 250}g</Text>
          </View>
          
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>Gordura:</Text>
            <Text style={styles.goalValue}>{user?.target_fat || 65}g</Text>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>
          
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Modo Escuro</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{false: theme.colors.border, true: theme.colors.primary}}
              thumbColor={isDark ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Notificações</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{false: theme.colors.border, true: theme.colors.primary}}
              thumbColor={notificationsEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {}}
        >
          <Text style={styles.actionButtonText}>Editar Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {}}
        >
          <Text style={styles.actionButtonText}>Alterar Metas</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {}}
        >
          <Text style={styles.actionButtonText}>Sobre o App</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Sair da Conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;