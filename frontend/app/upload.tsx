import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getBackendBaseUrl } from '../constants/api';
import { useAuth } from '../context/AuthContext';

interface UploadedFile {
  id: string;
  filename: string;
  type: 'image' | 'pdf';
  created_at: string;
  has_analysis: boolean;
}

export default function UploadScreen() {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const router = useRouter();
  const { token, user } = useAuth();

  useEffect(() => {
    loadUploadedFiles();
  }, []);

  const loadUploadedFiles = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${getBackendBaseUrl()}/api/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const files = await response.json();
        setUploadedFiles(files);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Se necesitan permisos de galería para subir imágenes.'
        );
        return false;
      }
    }
    return true;
  };

  const showImageOptions = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Subir Imagen del Cabello',
      'Elige una opción:',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cámara',
          onPress: () => pickImageFromCamera(),
        },
        {
          text: 'Galería',
          onPress: () => pickImageFromGallery(),
        },
      ]
    );
  };

  const pickImageFromCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadFile(result.assets[0], 'image');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadFile(result.assets[0], 'image');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const showDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadFile(result.assets[0], 'pdf');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el documento');
    }
  };

  const uploadFile = async (file: any, documentType: 'image' | 'pdf') => {
    if (!token) {
      Alert.alert('Error', 'Debes iniciar sesión para subir archivos');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      
      // Crear objeto File para web o usar directamente para mobile
      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        formData.append('file', blob, file.fileName || `file.${documentType === 'image' ? 'jpg' : 'pdf'}`);
      } else {
        formData.append('file', {
          uri: file.uri,
          type: documentType === 'image' ? 'image/jpeg' : 'application/pdf',
          name: file.fileName || file.name || `file.${documentType === 'image' ? 'jpg' : 'pdf'}`,
        } as any);
      }
      
      formData.append('document_type', documentType);

      const response = await fetch(`${getBackendBaseUrl()}/api/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        Alert.alert('Éxito', 'Archivo subido correctamente');
        await loadUploadedFiles();
        
        // Auto-analizar si el usuario tiene API key configurada
        if (user?.has_gemini_key) {
          setTimeout(() => {
            analyzeFile(result.id, documentType);
          }, 1000);
        }
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Error al subir archivo');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Error al subir archivo');
    } finally {
      setUploading(false);
    }
  };

  const analyzeFile = async (fileId: string, documentType: 'image' | 'pdf') => {
    if (!token) return;

    setAnalyzing(fileId);
    
    try {
      const endpoint = documentType === 'image' ? '/api/analysis/hair' : '/api/analysis/document';
      const analysisType = documentType === 'image' ? 'capilar' : 'general';
      
      const response = await fetch(`${getBackendBaseUrl()}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: fileId,
          analysis_type: analysisType,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        Alert.alert('Análisis Completado', result.message);
        await loadUploadedFiles();
      } else {
        const error = await response.json();
        Alert.alert('Error de Análisis', error.detail || 'Error al analizar archivo');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Error', 'Error al analizar archivo');
    } finally {
      setAnalyzing(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Subir Archivos</Text>
        </View>

        {/* API Key Warning */}
        {!user?.has_gemini_key && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={24} color="#ff9500" />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Configuración requerida</Text>
              <Text style={styles.warningText}>
                Configura tu API key de Gemini para realizar análisis
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

        {/* Upload Options */}
        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Nuevos Archivos</Text>
          
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={showImageOptions}
            disabled={uploading}
          >
            <Ionicons name="camera" size={32} color="#4c669f" />
            <Text style={styles.uploadButtonText}>Subir Foto del Cabello</Text>
            <Text style={styles.uploadButtonSubtext}>Para análisis capilar con IA</Text>
            {uploading && <ActivityIndicator style={{ marginTop: 10 }} />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={showDocumentPicker}
            disabled={uploading}
          >
            <Ionicons name="document-text" size={32} color="#4c669f" />
            <Text style={styles.uploadButtonText}>Subir Documento PDF</Text>
            <Text style={styles.uploadButtonSubtext}>Análisis de resultados médicos</Text>
            {uploading && <ActivityIndicator style={{ marginTop: 10 }} />}
          </TouchableOpacity>
        </View>

        {/* Files Section */}
        <View style={styles.filesSection}>
          <Text style={styles.sectionTitle}>Archivos Subidos</Text>
          
          {uploadedFiles.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No hay archivos subidos</Text>
              <Text style={styles.emptySubtext}>
                Sube una foto o documento para comenzar
              </Text>
            </View>
          ) : (
            uploadedFiles.map((file) => (
              <View key={file.id} style={styles.fileCard}>
                <View style={styles.fileInfo}>
                  <Ionicons 
                    name={file.type === 'image' ? 'image' : 'document-text'} 
                    size={24} 
                    color="#4c669f" 
                  />
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName}>{file.filename}</Text>
                    <Text style={styles.fileType}>
                      {file.type === 'image' ? 'Imagen' : 'PDF'} • {new Date(file.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                
                {file.has_analysis ? (
                  <View style={styles.analyzedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#155724" />
                    <Text style={styles.analyzedText}>Analizado</Text>
                  </View>
                ) : user?.has_gemini_key ? (
                  <TouchableOpacity 
                    style={styles.analyzeButton}
                    onPress={() => analyzeFile(file.id, file.type)}
                    disabled={analyzing === file.id}
                  >
                    {analyzing === file.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.analyzeButtonText}>Analizar</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.needsConfigText}>Configura API</Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    margin: 24,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9500',
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  warningText: {
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
  uploadSection: {
    margin: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  uploadButtonSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  filesSection: {
    margin: 24,
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
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
  fileCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  fileType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  analyzeButton: {
    backgroundColor: '#4c669f',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  analyzeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  analyzedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  analyzedText: {
    color: '#155724',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4c669f',
    fontWeight: '600',
  },
  needsConfigText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});