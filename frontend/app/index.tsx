import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#C8B6FF" />
      </View>
    );
  }

  // Redirecionar baseado no estado de autenticação
  if (user) {
    return <Redirect href="/(tabs)/" />;
  }

  return <Redirect href="/auth/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0E1A2B',
  },
});
