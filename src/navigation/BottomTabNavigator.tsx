import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';

const {width} = Dimensions.get('window');

interface BottomTabNavigatorProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

const BottomTabNavigator: React.FC<BottomTabNavigatorProps> = ({
  activeTab,
  onTabPress,
}) => {
  const {theme} = useTheme();

  const tabs = [
    {id: 'Dashboard', label: 'Início', icon: '🏠'},
    {id: 'Meals', label: 'Refeições', icon: '🍽️'},
    {id: 'Progress', label: 'Progresso', icon: '📊'},
    {id: 'MyPlan', label: 'Meu Plano', icon: '📋'},
    {id: 'Profile', label: 'Perfil', icon: '👤'},
  ];

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: theme.colors.card,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingBottom: 20,
      paddingTop: 10,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
    },
    tabIcon: {
      fontSize: 20,
      marginBottom: 4,
    },
    tabLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.text,
      opacity: 0.6,
    },
    activeTabLabel: {
      color: theme.colors.primary,
      opacity: 1,
      fontWeight: '600',
    },
    indicator: {
      position: 'absolute',
      top: 0,
      height: 3,
      backgroundColor: theme.colors.primary,
      borderRadius: 2,
    },
  });

  return (
    <View style={styles.container}>
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        const indicatorWidth = width / tabs.length * 0.6;
        const indicatorLeft = (width / tabs.length) * index + (width / tabs.length - indicatorWidth) / 2;

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onTabPress(tab.id)}
          >
            {isActive && (
              <View
                style={[
                  styles.indicator,
                  {
                    width: indicatorWidth,
                    left: indicatorLeft,
                  },
                ]}
              />
            )}
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default BottomTabNavigator;