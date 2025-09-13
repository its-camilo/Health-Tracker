import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

export default function SettingsScreen() {
  const [geminiKey, setGeminiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  
  const router = useRouter();
  const { user, token, updateUser } = useAuth();

  useEffect(() => {
    if (!user) {
      router.replace('/');
      return;
    }
  }, [user]);

  const handleSaveKey = async () => {
    if (!geminiKey.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu API key de Gemini');
      return;
    }

    if (!geminiKey.startsWith('AIza')) {
      Alert.alert('Error', 'La API key de Gemini debe comenzar con "AIza"');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/gemini-key`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gemini_api_key: geminiKey }),
      });

      if (response.ok) {
        updateUser({ has_gemini_key: true });
        Alert.alert(
          'Éxito',
          'API key de Gemini configurada correctamente',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.detail || 'Error al guardar la API key');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Configuración</Text>
          </View>

          {/* API Key Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>API Key de Gemini</Text>
            <Text style={styles.sectionDescription}>
              Necesitas una API key de Google Gemini para usar las funciones de análisis.
            </Text>

            <TextInput
              label="API Key de Gemini"
              value={geminiKey}
              onChangeText={setGeminiKey}
              mode="outlined"
              placeholder="AIzaSy..."
              secureTextEntry={!showKey}
              style={styles.input}
              theme={{
                colors: {
                  primary: '#4c669f',
                  background: '#fff',
                },
              }}
              right={
                <TextInput.Icon
                  icon={showKey ? 'eye-off' : 'eye'}
                  onPress={() => setShowKey(!showKey)}
                />
              }
            />

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.buttonDisabled]}
              onPress={handleSaveKey}
              disabled={loading}
            >
              <Ionicons name="save" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>
                {loading ? 'Guardando...' : 'Guardar API Key'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Instructions Section */}
          <View style={styles.instructionsSection}>
            <Text style={styles.instructionsTitle}>¿Cómo obtener tu API Key?</Text>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Ve a Google AI Studio (ai.google.dev)
              </Text>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Inicia sesión con tu cuenta de Google
              </Text>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Haz clic en "Get API Key" y crear una nueva clave
              </Text>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepText}>
                Copia la API key y pégala aquí
              </Text>
            </View>
          </View>

          {/* Status Section */}
          {user?.has_gemini_key && (
            <View style={styles.statusSection}>
              <View style={styles.statusCard}>
                <Ionicons name="checkmark-circle" size={32} color="#28a745" />
                <Text style={styles.statusText}>
                  ✅ API Key configurada correctamente
                </Text>
                <Text style={styles.statusSubtext}>
                  Ya puedes realizar análisis con IA
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 24,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4c669f',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsSection: {
    backgroundColor: '#fff',
    marginTop: 24,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4c669f',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  statusSection: {
    marginTop: 24,
    marginBottom: 40,
  },
  statusCard: {
    backgroundColor: '#d4edda',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#155724',
    marginTop: 8,
    textAlign: 'center',
  },
  statusSubtext: {
    fontSize: 14,
    color: '#155724',
    marginTop: 4,
    textAlign: 'center',
  },
});