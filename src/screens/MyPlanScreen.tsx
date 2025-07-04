import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';
import {mealPlansApi} from '../services/api';

interface MyPlanScreenProps {
  navigation: any;
}

const MyPlanScreen: React.FC<MyPlanScreenProps> = ({navigation}) => {
  const {theme} = useTheme();
  const [activePlans, setActivePlans] = useState<any[]>([]);
  const [planHistory, setPlanHistory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      
      const [active, history] = await Promise.all([
        mealPlansApi.getActivePlans(),
        mealPlansApi.getPlanHistory()
      ]);
      
      setActivePlans(active || []);
      setPlanHistory(history || []);
    } catch (error) {
      console.error('Failed to load plans:', error);
      setActivePlans([]);
      setPlanHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlans();
    setRefreshing(false);
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
    headerSubtitle: {
      fontSize: 16,
      color: theme.colors.text,
      opacity: 0.7,
    },
    scrollContainer: {
      padding: 20,
      paddingTop: 10,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 15,
      marginTop: 10,
    },
    planCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 15,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    activePlanCard: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    planTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    planDescription: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.8,
      marginBottom: 12,
    },
    planMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    planDate: {
      fontSize: 12,
      color: theme.colors.text,
      opacity: 0.6,
    },
    planStatus: {
      fontSize: 12,
      fontWeight: '600',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      overflow: 'hidden',
    },
    activeStatus: {
      backgroundColor: theme.colors.primary + '20',
      color: theme.colors.primary,
    },
    inactiveStatus: {
      backgroundColor: theme.colors.border,
      color: theme.colors.text,
    },
    planActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    actionButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      marginHorizontal: 5,
    },
    secondaryButton: {
      backgroundColor: theme.colors.border,
    },
    actionButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
    },
    secondaryButtonText: {
      color: theme.colors.text,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.text,
      opacity: 0.6,
      textAlign: 'center',
      marginBottom: 20,
    },
    createButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      margin: 20,
    },
    createButtonText: {
      color: '#ffffff',
      fontSize: 18,
      fontWeight: '600',
    },
    mealsPreview: {
      marginTop: 10,
    },
    mealItem: {
      fontSize: 12,
      color: theme.colors.text,
      opacity: 0.7,
      marginBottom: 3,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meu Plano</Text>
        <Text style={styles.headerSubtitle}>Planos de nutrição personalizados</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Active Plans */}
        {activePlans.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Plano Ativo</Text>
            {activePlans.map((plan, index) => (
              <View key={index} style={[styles.planCard, styles.activePlanCard]}>
                <Text style={styles.planTitle}>
                  {plan.name || 'Plano Personalizado'}
                </Text>
                <Text style={styles.planDescription}>
                  {plan.description || 'Plano de nutrição personalizado baseado nos seus objetivos'}
                </Text>
                
                <View style={styles.planMeta}>
                  <Text style={styles.planDate}>
                    Criado em {new Date(plan.created_at).toLocaleDateString('pt-BR')}
                  </Text>
                  <Text style={[styles.planStatus, styles.activeStatus]}>
                    ATIVO
                  </Text>
                </View>

                {plan.meals && plan.meals.length > 0 && (
                  <View style={styles.mealsPreview}>
                    <Text style={[styles.sectionTitle, {fontSize: 14, marginBottom: 8, marginTop: 0}]}>
                      Refeições de Hoje:
                    </Text>
                    {plan.meals.slice(0, 3).map((meal: any, mealIndex: number) => (
                      <Text key={mealIndex} style={styles.mealItem}>
                        • {meal.name || `Refeição ${mealIndex + 1}`} - {meal.calories || 0} kcal
                      </Text>
                    ))}
                    {plan.meals.length > 3 && (
                      <Text style={styles.mealItem}>
                        ... e mais {plan.meals.length - 3} refeições
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.planActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.secondaryButton]}
                    onPress={() => {}}
                  >
                    <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                      Exportar PDF
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('AIAssistant')}
                  >
                    <Text style={styles.actionButtonText}>Modificar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Plan History */}
        {planHistory.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Histórico de Planos</Text>
            {planHistory.map((plan, index) => (
              <View key={index} style={styles.planCard}>
                <Text style={styles.planTitle}>
                  {plan.name || 'Plano Personalizado'}
                </Text>
                <Text style={styles.planDescription}>
                  {plan.description || 'Plano de nutrição personalizado'}
                </Text>
                
                <View style={styles.planMeta}>
                  <Text style={styles.planDate}>
                    Criado em {new Date(plan.created_at).toLocaleDateString('pt-BR')}
                  </Text>
                  <Text style={[styles.planStatus, styles.inactiveStatus]}>
                    INATIVO
                  </Text>
                </View>

                <View style={styles.planActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.secondaryButton]}
                    onPress={() => {}}
                  >
                    <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                      Reativar
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.secondaryButton]}
                    onPress={() => {}}
                  >
                    <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                      Exportar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Empty State */}
        {activePlans.length === 0 && planHistory.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Você ainda não possui{'\n'}nenhum plano de nutrição
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Create Plan Button */}
      {activePlans.length === 0 && (
        <TouchableOpacity 
          style={styles.createButton} 
          onPress={() => navigation.navigate('AIAssistant')}
        >
          <Text style={styles.createButtonText}>+ Criar Meu Plano</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default MyPlanScreen;