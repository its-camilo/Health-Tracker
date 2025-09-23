import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function UploadScreen() {
  // Eliminamos setUploading porque no se usaba (warning ESLint)
  const [uploading] = useState(false);
  const router = useRouter();

  const showImageOptions = () => {
    Alert.alert(
      'Subir Imagen',
      'Esta funcionalidad estará disponible pronto. Por ahora puedes usar la cámara o galería de tu dispositivo.',
      [
        { text: 'Entendido', style: 'default' },
      ]
    );
  };

  const showDocumentPicker = () => {
    Alert.alert(
      'Subir PDF',
      'Esta funcionalidad estará disponible pronto. Por ahora puedes seleccionar documentos PDF desde tu dispositivo.',
      [
        { text: 'Entendido', style: 'default' },
      ]
    );
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
            onPress={showDocumentPicker}
            disabled={uploading}
          >
            <Ionicons name="document-text" size={32} color="#4c669f" />
            <Text style={styles.uploadButtonText}>Subir Documento PDF</Text>
            <Text style={styles.uploadButtonSubtext}>Análisis de resultados médicos</Text>
          </TouchableOpacity>
        </View>

        {/* Empty State */}
        <View style={styles.filesSection}>
          <Text style={styles.sectionTitle}>Archivos Subidos</Text>
          
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No hay archivos subidos</Text>
            <Text style={styles.emptySubtext}>
              Sube una foto o documento para comenzar
            </Text>
          </View>
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
});