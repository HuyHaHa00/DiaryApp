import { doc, getDoc, serverTimestamp, setDoc, deleteDoc } from "firebase/firestore";
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
import { formatDate } from "../utils/formatDate";
import { auth, db } from "./config/firebase";

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<Mood | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [createdAt, setCreatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'changed' | 'saving' | 'saved' | 'error'>('idle');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "users", user.uid, "entries", id));
        if (snap.exists()) {
          const data = snap.data();
          setTitle(data.title ?? "");
          setContent(data.content ?? "");
          setMood(data.mood ?? null);
          setImages(data.images ?? []);
          setCreatedAt(data.createdAt ?? "");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user, id]);

  // Auto-save while editing
  useEffect(() => {
    if (!editing || !user || !id) return;
    setSaveStatus("changed");
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => autoSave(), 3000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [title, content, mood, images, editing]);

  const autoSave = async () => {
    if (!user || !id) return;
    setSaveStatus("saving");
    try {
      await setDoc(
        doc(db, "users", user.uid, "entries", id),
        { title, content, mood, images, updatedAt: serverTimestamp() },
        { merge: true }
      );
      setSaveStatus("saved");
    } catch (_) {
      setSaveStatus("error");
    }
  };

  const handleSave = async () => {
    if (!user || !id) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", user.uid, "entries", id),
        {
          title: title.trim() || "(Không có tiêu đề)",
          content: content.trim(),
          mood,
          images,
          updatedAt: serverTimestamp(),
          draft: false,
        },
        { merge: true }
      );
      setSaveStatus("saved");
      setEditing(false);
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
      
      const storageRef = ref(storage, `users/${user.uid}/entries/${id}_${imageItem.id}.jpg`);
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

  const removeImage = async (imageId: string) => {
    const imgToRemove = images.find(img => img.id === imageId);
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    if (imgToRemove?.url && user) {
      try {
         const imageRef = ref(storage, `users/${user.uid}/entries/${id}_${imageId}.jpg`);
         await deleteObject(imageRef);
      } catch (_e) {}
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Xoá nhật ký",
      "Bạn có chắc muốn xoá bài viết này không? Hành động này không thể hoàn tác.",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: async () => {
            if (!user || !id) return;
            await deleteDoc(doc(db, "users", user.uid, "entries", id));
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

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
        <View style={styles.headerActions}>
          {editing ? (
            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveBtn}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Lưu</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setEditing(true)}
              style={styles.editBtn}
            >
              <Text style={styles.editBtnText}>Chỉnh sửa</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {createdAt ? (
          <Text style={styles.dateText}>{formatDate(createdAt)}</Text>
        ) : null}

        <Text style={styles.sectionLabel}>Tâm trạng</Text>
        <MoodSelector
          selected={mood}
          onChange={(m) => {
            if (editing) setMood(m);
          }}
        />

        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          editable={editing}
          placeholder="Tiêu đề..."
          placeholderTextColor="#ccc"
          maxLength={120}
        />

        <TextInput
          style={styles.contentInput}
          value={content}
          onChangeText={setContent}
          editable={editing}
          multiline
          textAlignVertical="top"
          placeholder="Nội dung nhật ký..."
          placeholderTextColor="#ccc"
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
                  <RNImage source={{ uri: img.url || img.uri }} style={styles.attachedImage} />
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
                {editing && (
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(img.id)}>
                    <Text style={styles.removeText}>✕</Text>
                  </TouchableOpacity>
                )}
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

      {editing && (
        <View style={styles.toolbar}>
          <View style={styles.toolbarContent}>
            <TouchableOpacity onPress={pickImage} style={styles.attachBtn}>
              <Text style={styles.attachText}>📷 Thêm ảnh</Text>
            </TouchableOpacity>
            {saveStatus === "idle" && (
              <Text style={[styles.autoSaveHint, styles.statusIdle]}>
                📝 Bắt đầu sửa để tự động lưu nháp
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
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f3ee",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#EAF4FF",
  },
  editBtnText: {
    color: "#4A90E2",
    fontWeight: "600",
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: "#4A90E2",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 64,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  deleteBtn: {
    padding: 8,
  },
  deleteBtnText: {
    fontSize: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  dateText: {
    fontSize: 12,
    color: "#aaa",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
