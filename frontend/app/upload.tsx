import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

export default function UploadScreen() {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user) {
      router.replace('/');
      return;
    }
    
    loadDocuments();
  }, [user]);

  const loadDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const documents = await response.json();
        setUploadedFiles(documents);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (fileUri: string, fileName: string, fileType: string, documentType: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      
      // Create file object for FormData
      const file = {
        uri: fileUri,
        type: fileType,
        name: fileName,
      } as any;

      formData.append('file', file);
      formData.append('document_type', documentType);

      const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        Alert.alert('Éxito', result.message);
        loadDocuments(); // Reload documents
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.detail || 'Error al subir archivo');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permiso requerido', 'Necesitas dar permisos para acceder a las fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await uploadFile(
          asset.uri,
          asset.fileName || 'image.jpg',
          'image/jpeg',
          'image'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Error al seleccionar imagen');
    }
  };

  const takePhoto = async () => {
    try {
      // Request camera permission
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permiso requerido', 'Necesitas dar permisos para usar la cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await uploadFile(
          asset.uri,
          'camera_photo.jpg',
          'image/jpeg',
          'image'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Error al tomar foto');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await uploadFile(
          asset.uri,
          asset.name,
          'application/pdf',
          'pdf'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Error al seleccionar documento');
    }
  };

  const analyzeDocument = async (documentId: string, analysisType: string) => {
    try {
      setUploading(true);
      const endpoint = analysisType === 'capilar' 
        ? '/api/analysis/hair' 
        : '/api/analysis/document';

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentId,
          analysis_type: analysisType,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        Alert.alert(
          'Análisis Completado',
          'El análisis se ha completado correctamente. Puedes ver los resultados en el dashboard.',
          [
            {
              text: 'Ver Dashboard',
              onPress: () => router.push('/dashboard'),
            },
          ]
        );
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.detail || 'Error en el análisis');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setUploading(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Seleccionar Imagen',
      'Elige una opción',
      [
        { text: 'Cámara', onPress: takePhoto },
        { text: 'Galería', onPress: pickImage },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4c669f" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={pickDocument}
            disabled={uploading}
          >
            <Ionicons name="document-text" size={32} color="#4c669f" />
            <Text style={styles.uploadButtonText}>Subir Documento PDF</Text>
            <Text style={styles.uploadButtonSubtext}>Análisis de resultados médicos</Text>
          </TouchableOpacity>
        </View>

        {/* Uploaded Files */}
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
            uploadedFiles.map((file, index) => (
              <View key={index} style={styles.fileCard}>
                <View style={styles.fileInfo}>
                  <Ionicons 
                    name={file.type === 'image' ? 'image' : 'document-text'} 
                    size={24} 
                    color="#4c669f" 
                  />
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName}>{file.filename}</Text>
                    <Text style={styles.fileType}>
                      {file.type === 'image' ? 'Imagen' : 'PDF'} • 
                      {file.has_analysis ? ' Analizado' : ' Sin analizar'}
                    </Text>
                  </View>
                </View>
                
                {!file.has_analysis && user?.has_gemini_key && (
                  <TouchableOpacity
                    style={styles.analyzeButton}
                    onPress={() => analyzeDocument(
                      file.id, 
                      file.type === 'image' ? 'capilar' : 'general'
                    )}
                    disabled={uploading}
                  >
                    <Text style={styles.analyzeButtonText}>Analizar</Text>
                  </TouchableOpacity>
                )}
                
                {file.has_analysis && (
                  <View style={styles.analyzedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                    <Text style={styles.analyzedText}>Analizado</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {uploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color="#4c669f" />
            <Text style={styles.uploadingText}>Procesando...</Text>
          </View>
        )}
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
});