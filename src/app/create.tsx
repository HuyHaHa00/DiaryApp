import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { router, useLocalSearchParams } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image as RNImage,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import ImageViewer from "../components/ImageViewer";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./config/firebase";
import { ImageItem } from "../components/DiaryCard";
import MoodSelector, { Mood } from "../components/MoodSelector";
import { auth, db } from "./config/firebase";

export default function CreateScreen() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<Mood | null>(null);
  const [saving, setSaving] = useState(false);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'changed' | 'saving' | 'saved' | 'error'>('idle');
  const [images, setImages] = useState<ImageItem[]>([]);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSavedId = useRef<string | null>(null);
  const entryDate = useRef<string | null>(null);

  if (!entryDate.current) {
    if (date) {
      const [y, m, d] = date.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        entryDate.current = new Date(y, m - 1, d, 12, 0, 0).toISOString();
      } else {
        entryDate.current = new Date().toISOString();
      }
    } else {
      entryDate.current = new Date().toISOString();
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  // Auto-save draft to Firestore 3s after user stops typing
  useEffect(() => {
    if (!user) return;
    if (!title.trim() && !content.trim()) {
      setSaveStatus("idle");
      return;
    }
    setSaveStatus("changed");
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => autoSave(), 3000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [title, content, mood, user, images]);

  const autoSave = async () => {
    if (!user || (!title.trim() && !content.trim())) return;
    setSaveStatus("saving");
    try {
      const { setDoc, doc } = await import("firebase/firestore");
      if (!autoSavedId.current) {
        const ref = await addDoc(collection(db, "users", user.uid, "entries"), {
          title: title.trim() || "(Không có tiêu đề)",
          content: content.trim(),
          mood,
          images,
          createdAt: entryDate.current,
          draft: true,
        });
        autoSavedId.current = ref.id;
      } else {
        await setDoc(
          doc(db, "users", user.uid, "entries", autoSavedId.current),
          { title: title.trim() || "(Không có tiêu đề)", content: content.trim(), mood, images, draft: true },
          { merge: true }
        );
      }
      setSaveStatus("saved");
    } catch (_) {
      setSaveStatus("error");
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!title.trim() && !content.trim()) {
      Alert.alert("Trống rỗng", "Hãy viết gì đó trước khi lưu nhé!");
      return;
    }
    setSaving(true);
    try {
      const { setDoc, doc } = await import("firebase/firestore");
      const data = {
        title: title.trim() || "(Không có tiêu đề)",
        content: content.trim(),
        mood,
        images,
        createdAt: entryDate.current,
        draft: false,
        updatedAt: serverTimestamp(),
      };
      if (autoSavedId.current) {
        await setDoc(
          doc(db, "users", user.uid, "entries", autoSavedId.current),
          data,
          { merge: true }
        );
      } else {
        await addDoc(collection(db, "users", user.uid, "entries"), data);
      }
      
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/");
      }
    } catch (e: any) {
      Alert.alert("Lỗi", e.message);
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    if (images.length >= 3) {
      Alert.alert("Giới hạn", "Bạn chỉ có thể đính kèm tối đa 3 ảnh.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 3 - images.length,
      quality: 1,
    });

    if (!result.canceled) {
      const newImages: ImageItem[] = result.assets.map((asset) => ({
        id: Math.random().toString(36).substring(7),
        uri: asset.uri,
        status: 'uploading' as const,
      }));
      
      setImages((prev) => [...prev, ...newImages]);

      for (const img of newImages) {
        uploadImage(img);
      }
    }
  };

  const uploadImage = async (imageItem: ImageItem) => {
    try {
      if (!user) return;
      
      const manipResult = await ImageManipulator.manipulateAsync(
        imageItem.uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      const response = await fetch(manipResult.uri);
      const blob = await response.blob();
      
      const storageRef = ref(storage, `users/${user.uid}/entries/temp_${imageItem.id}.jpg`);
      const uploadTask = uploadBytesResumable(storageRef, blob);

      uploadTask.on(
        "state_changed",
        null,
        (_error) => {
          setImages((prev) => prev.map((img) => img.id === imageItem.id ? { ...img, status: 'error' } : img));
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setImages((prev) => prev.map((img) => img.id === imageItem.id ? { ...img, status: 'done', url: downloadURL } : img));
        }
      );
    } catch (error) {
      setImages((prev) => prev.map((img) => img.id === imageItem.id ? { ...img, status: 'error' } : img));
    }
  };

  const removeImage = async (id: string) => {
    const imgToRemove = images.find(img => img.id === id);
    setImages((prev) => prev.filter((img) => img.id !== id));
    if (imgToRemove?.url && user) {
      try {
         const imageRef = ref(storage, `users/${user.uid}/entries/temp_${id}.jpg`);
         await deleteObject(imageRef);
      } catch (_e) {}
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/");
            }
          }} 
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← Quay lại</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.saveBtn}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Mood selector */}
        <Text style={styles.sectionLabel}>Tâm trạng hôm nay</Text>
        <MoodSelector selected={mood} onChange={setMood} />

        {/* Title */}
        <TextInput
          style={styles.titleInput}
          placeholder="Tiêu đề..."
          placeholderTextColor="#ccc"
          value={title}
          onChangeText={setTitle}
          maxLength={120}
        />

        {/* Content */}
        <TextInput
          style={styles.contentInput}
          placeholder="Hôm nay bạn muốn kể gì nào..."
          placeholderTextColor="#ccc"
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        {/* Gallery */}
        {images.length > 0 && (
          <View style={styles.imageGallery}>
            {images.map((img, index) => (
              <View key={img.id} style={styles.imageContainer}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setCurrentImageIndex(index);
                    setIsViewerVisible(true);
                  }}
                  style={{ width: "100%", height: "100%" }}
                >
                  <RNImage source={{ uri: img.uri }} style={styles.attachedImage} />
                </TouchableOpacity>
                {img.status === 'uploading' && (
                  <View style={styles.imageOverlay}>
                    <ActivityIndicator color="#fff" />
                  </View>
                )}
                {img.status === 'error' && (
                  <View style={styles.imageOverlay}>
                    <Text style={{color: 'red'}}>Lỗi</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(img.id)}>
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            <ImageViewer
              images={images.map(img => ({ uri: img.url || img.uri }))}
              imageIndex={currentImageIndex}
              visible={isViewerVisible}
              onRequestClose={() => setIsViewerVisible(false)}
            />
          </View>
        )}
      </ScrollView>

      {/* Bottom toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.toolbarContent}>
          <TouchableOpacity onPress={pickImage} style={styles.attachBtn}>
            <Text style={styles.attachText}>📷 Thêm ảnh</Text>
          </TouchableOpacity>
          {saveStatus === "idle" && (
          <Text style={[styles.autoSaveHint, styles.statusIdle]}>
            📝 Bắt đầu viết để tự động lưu nháp
          </Text>
        )}
        {saveStatus === "changed" && (
          <Text style={[styles.autoSaveHint, styles.statusChanged]}>
            ⏳ Đang chờ lưu nháp...
          </Text>
        )}
        {saveStatus === "saving" && (
          <Text style={[styles.autoSaveHint, styles.statusSaving]}>
            🔄 Đang lưu bản nháp lên đám mây...
          </Text>
        )}
        {saveStatus === "saved" && (
          <Text style={[styles.autoSaveHint, styles.statusSaved]}>
            ☁️ Bản nháp đã được lưu tự động
          </Text>
        )}
        {saveStatus === "error" && (
          <Text style={[styles.autoSaveHint, styles.statusError]}>
            ⚠️ Không thể lưu nháp.
          </Text>
        )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f3ee",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
  },
  backBtn: {
    padding: 8,
  },
  backText: {
    fontSize: 15,
    color: "#4A90E2",
  },
  saveBtn: {
    backgroundColor: "#4A90E2",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 64,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
    marginTop: 16,
    marginBottom: 12,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#ebe6df",
  },
  contentInput: {
    fontSize: 15,
    color: "#444",
    lineHeight: 24,
    minHeight: 240,
  },
  toolbar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#ebe6df",
    backgroundColor: "#f7f3ee",
    alignItems: "center",
  },
  autoSaveHint: {
    fontSize: 12,
    color: "#bbb",
  },
  statusIdle: {
    color: "#aaa",
  },
  statusChanged: {
    color: "#E67E22",
    fontWeight: "500",
  },
  statusSaving: {
    color: "#2980B9",
    fontWeight: "500",
  },
  statusSaved: {
    color: "#27AE60",
    fontWeight: "600",
  },
  statusError: {
    color: "#C0392B",
    fontWeight: "600",
  },
  toolbarContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  attachBtn: {
    padding: 8,
    backgroundColor: "#eee",
    borderRadius: 8,
  },
  attachText: {
    fontSize: 14,
    color: "#333",
  },
  imageGallery: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  imageContainer: {
    position: "relative",
    width: 100,
    height: 100,
  },
  attachedImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  removeBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#ff4757",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  removeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});
