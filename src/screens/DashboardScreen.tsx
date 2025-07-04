import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {useAuth} from '../contexts/AuthContext';
import {useTheme} from '../contexts/ThemeContext';
import {nutritionApi, mealPlansApi} from '../services/api';

const {width} = Dimensions.get('window');

interface DashboardScreenProps {
  navigation: any;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({navigation}) => {
  const {user} = useAuth();
  const {theme} = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [dailyNutrition, setDailyNutrition] = useState<any>(null);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load today's nutrition data
      const nutritionData = await nutritionApi.getDailyNutrition(today);
      setDailyNutrition(nutritionData);

      // Load active meal plans
      const activePlans = await mealPlansApi.getActivePlans();
      if (activePlans && activePlans.length > 0) {
        setActivePlan(activePlans[0]);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const calculateProgress = (consumed: number, target: number) => {
    return target > 0 ? Math.min((consumed / target) * 100, 100) : 0;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      padding: 20,
    },
    header: {
      marginBottom: 30,
    },
    greeting: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 5,
    },
    userName: {
      fontSize: 18,
      color: theme.colors.text,
      opacity: 0.8,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 15,
    },
    nutrientRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    nutrientInfo: {
      flex: 1,
    },
    nutrientLabel: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.8,
      marginBottom: 5,
    },
    nutrientValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    progressContainer: {
      flex: 2,
      marginLeft: 15,
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    progressText: {
      fontSize: 12,
      color: theme.colors.text,
      opacity: 0.6,
      marginTop: 4,
      textAlign: 'right',
    },
    planCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    planTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 10,
    },
    planDescription: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.8,
      marginBottom: 15,
    },
    planButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
    },
    planButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    emptyPlan: {
      textAlign: 'center',
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.6,
      fontStyle: 'italic',
    },
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    actionButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      padding: 15,
      flex: 1,
      marginHorizontal: 5,
      alignItems: 'center',
    },
    actionButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
      marginTop: 5,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}!</Text>
          <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Meals')}
          >
            <Text style={{fontSize: 24}}>🍽️</Text>
            <Text style={styles.actionButtonText}>Refeições</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('AIAssistant')}
          >
            <Text style={{fontSize: 24}}>🤖</Text>
            <Text style={styles.actionButtonText}>IA</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Progress')}
          >
            <Text style={{fontSize: 24}}>📊</Text>
            <Text style={styles.actionButtonText}>Progresso</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Nutrition Progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Progresso de Hoje</Text>
          
          {dailyNutrition ? (
            <>
              {/* Calories */}
              <View style={styles.nutrientRow}>
                <View style={styles.nutrientInfo}>
                  <Text style={styles.nutrientLabel}>Calorias</Text>
                  <Text style={styles.nutrientValue}>
                    {dailyNutrition.calories || 0} / {user?.target_calories || 2000} kcal
                  </Text>
                </View>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        {
                          width: `${calculateProgress(dailyNutrition.calories || 0, user?.target_calories || 2000)}%`,
                          backgroundColor: theme.colors.primary
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {calculateProgress(dailyNutrition.calories || 0, user?.target_calories || 2000).toFixed(0)}%
                  </Text>
                </View>
              </View>

              {/* Protein */}
              <View style={styles.nutrientRow}>
                <View style={styles.nutrientInfo}>
                  <Text style={styles.nutrientLabel}>Proteína</Text>
                  <Text style={styles.nutrientValue}>
                    {dailyNutrition.protein || 0} / {user?.target_protein || 150}g
                  </Text>
                </View>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        {
                          width: `${calculateProgress(dailyNutrition.protein || 0, user?.target_protein || 150)}%`,
                          backgroundColor: '#ef4444'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {calculateProgress(dailyNutrition.protein || 0, user?.target_protein || 150).toFixed(0)}%
                  </Text>
                </View>
              </View>

              {/* Carbs */}
              <View style={styles.nutrientRow}>
                <View style={styles.nutrientInfo}>
                  <Text style={styles.nutrientLabel}>Carboidratos</Text>
                  <Text style={styles.nutrientValue}>
                    {dailyNutrition.carbs || 0} / {user?.target_carbs || 250}g
                  </Text>
                </View>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        {
                          width: `${calculateProgress(dailyNutrition.carbs || 0, user?.target_carbs || 250)}%`,
                          backgroundColor: '#f59e0b'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {calculateProgress(dailyNutrition.carbs || 0, user?.target_carbs || 250).toFixed(0)}%
                  </Text>
                </View>
              </View>

              {/* Fat */}
              <View style={styles.nutrientRow}>
                <View style={styles.nutrientInfo}>
                  <Text style={styles.nutrientLabel}>Gordura</Text>
                  <Text style={styles.nutrientValue}>
                    {dailyNutrition.fat || 0} / {user?.target_fat || 65}g
                  </Text>
                </View>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        {
                          width: `${calculateProgress(dailyNutrition.fat || 0, user?.target_fat || 65)}%`,
                          backgroundColor: '#8b5cf6'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {calculateProgress(dailyNutrition.fat || 0, user?.target_fat || 65).toFixed(0)}%
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.emptyPlan}>
              Nenhum dado nutricional registrado hoje
            </Text>
          )}
        </View>

        {/* Active Plan */}
        <View style={styles.planCard}>
          <Text style={styles.planTitle}>Seu Plano Atual</Text>
          
          {activePlan ? (
            <>
              <Text style={styles.planDescription}>
                {activePlan.description || 'Plano personalizado de nutrição'}
              </Text>
              <TouchableOpacity 
                style={styles.planButton}
                onPress={() => navigation.navigate('MyPlan')}
              >
                <Text style={styles.planButtonText}>Ver Plano Completo</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.emptyPlan}>
                Você ainda não tem um plano ativo
              </Text>
              <TouchableOpacity 
                style={styles.planButton}
                onPress={() => navigation.navigate('AIAssistant')}
              >
                <Text style={styles.planButtonText}>Criar Meu Plano</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default DashboardScreen;