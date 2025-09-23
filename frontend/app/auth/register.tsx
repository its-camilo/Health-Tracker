import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    // Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Snackbar, TextInput } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const router = useRouter();
  const { register } = useAuth();

  // Snackbar state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

  const showSnack = (msg: string, type: 'success' | 'error') => {
    setSnackbarMsg(msg);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      showSnack('Por favor completa todos los campos', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showSnack('Las contraseñas no coinciden', 'error');
      return;
    }
    if (password.length < 6) {
      showSnack('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, name);
      showSnack('Cuenta creada correctamente', 'success');
      setTimeout(() => {
        router.replace('/dashboard');
      }, 400);
    } catch (error: any) {
      console.error('Error de registro:', error);
      // Mejor manejo de errores
      let errorMessage = 'Error al registrarse';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.toString && typeof error.toString === 'function') {
        errorMessage = error.toString();
      }
      showSnack(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#4c669f', '#3b5998', '#192f6a']}
        style={styles.gradient}
      >
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
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.title}>Crear Cuenta</Text>
              <Text style={styles.subtitle}>
                Únete al análisis de salud capilar
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <TextInput
                label="Nombre completo"
                value={name}
                onChangeText={setName}
                mode="outlined"
                autoCapitalize="words"
                style={styles.input}
                theme={{
                  colors: {
                    primary: '#3b5998',
                    background: '#fff',
                  },
                }}
              />

              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                theme={{
                  colors: {
                    primary: '#3b5998',
                    background: '#fff',
                  },
                }}
              />

              <TextInput
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={!showPassword}
                style={styles.input}
                theme={{
                  colors: {
                    primary: '#3b5998',
                    background: '#fff',
                  },
                }}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />

              <TextInput
                label="Confirmar contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                secureTextEntry={!showConfirmPassword}
                style={styles.input}
                theme={{
                  colors: {
                    primary: '#3b5998',
                    background: '#fff',
                  },
                }}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
              />

              <TouchableOpacity
                style={[styles.registerButton, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Botón de crear cuenta"
              >
                <Text style={styles.registerButtonText}>
                  {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                </Text>
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>
                  ¿Ya tienes cuenta?{' '}
                </Text>
                <TouchableOpacity onPress={() => router.push('/auth/login')}>
                  <Text style={styles.loginLink}>Inicia sesión aquí</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2500}
        style={{
          backgroundColor: snackbarType === 'success' ? '#2e7d32' : '#c62828',
        }}
      >
        {snackbarMsg}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#e1e8f0',
    textAlign: 'center',
  },
  form: {
    flex: 1,
    gap: 16,
  },
  input: {
    backgroundColor: '#fff',
  },
  registerButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3b5998',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#e1e8f0',
    fontSize: 16,
  },
  loginLink: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});