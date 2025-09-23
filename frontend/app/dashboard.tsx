import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import ProtectedRoute from '../components/ProtectedRoute';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Dashboard useEffect - user:', user);
    if (!user) {
      console.log('No user found, redirecting to home...');
      router.replace('/');
      return;
    }
    loadDashboard();
    // Nota: añadimos 'router' a las dependencias para satisfacer la regla react-hooks/exhaustive-deps.
  }, [user, router]);

  const loadDashboard = async () => {
    try {
      // Mock data for now
      setDashboardData({
        total_documents: 0,
        analyzed_documents: 0,
        recent_analyses: []
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, cerrar sesión',
          onPress: async () => {
            try {
              console.log('Iniciando logout...');
              await logout();
              console.log('Logout completado, navegando a inicio...');
              router.replace('/');
            } catch (error) {
              console.error('Error durante logout:', error);
              Alert.alert('Error', 'Hubo un problema al cerrar sesión');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ProtectedRoute>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.welcomeText}>¡Hola!</Text>
              <Text style={styles.userName}>{user?.name}</Text>
            </View>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* API Key Status */}
          {!user?.has_gemini_key && (
            <View style={styles.alertCard}>
              <Ionicons name="warning" size={24} color="#ff9500" />
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>Configuración requerida</Text>
                <Text style={styles.alertText}>
                  Necesitas configurar tu API key de Gemini para comenzar
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.configButton}
                onPress={() => router.push('/settings')}
              >
                <Text style={styles.configButtonText}>Configurar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="document-text" size={32} color="#4c669f" />
              <Text style={styles.statNumber}>{dashboardData?.total_documents || 0}</Text>
              <Text style={styles.statLabel}>Documentos</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="analytics" size={32} color="#4c669f" />
              <Text style={styles.statNumber}>{dashboardData?.analyzed_documents || 0}</Text>
              <Text style={styles.statLabel}>Analizados</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/upload')}
            >
              <Ionicons name="camera" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Subir Foto</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/upload')}
            >
              <Ionicons name="document-text" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Subir PDF</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Analyses */}
          <View style={styles.recentContainer}>
            <Text style={styles.sectionTitle}>Análisis Recientes</Text>
            
            {dashboardData?.recent_analyses?.length > 0 ? (
              dashboardData.recent_analyses.map((analysis: any, index: number) => (
                <View key={index} style={styles.analysisCard}>
                  <Text style={styles.analysisTitle}>{analysis.filename}</Text>
                  <Text style={styles.analysisDate}>{analysis.created_at}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No hay análisis aún</Text>
                <Text style={styles.emptySubtext}>
                  Sube una foto o documento para comenzar
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    margin: 24,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9500',
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: '#856404',
  },
  configButton: {
    backgroundColor: '#ff9500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  configButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4c669f',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 24,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#4c669f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  recentContainer: {
    margin: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  analysisCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  analysisDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});