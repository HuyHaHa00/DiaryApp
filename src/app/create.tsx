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
import { useTheme } from "../context/ThemeContext";

export default function CreateScreen() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const { colors, isDark } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<Mood | null>(null);
  
  // Tags state
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

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

  const handleTagInput = (text: string) => {
    if (text.endsWith(' ') || text.endsWith(',')) {
      const newTag = text.replace(/[, ]/g, '').trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput("");
    } else {
      setTagInput(text);
    }
  };

  const removeTag = (t: string) => {
    setTags(tags.filter(tag => tag !== t));
  };

  // Auto-save
  useEffect(() => {
    if (!user) return;
    if (!title.trim() && !content.trim() && images.length === 0 && tags.length === 0) {
      setSaveStatus("idle");
      return;
    }
    setSaveStatus("changed");
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => autoSave(), 3000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [title, content, mood, user, images, tags]);

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
          tags,
          createdAt: entryDate.current,
          draft: true,
        });
        autoSavedId.current = ref.id;
      } else {
        await setDoc(
          doc(db, "users", user.uid, "entries", autoSavedId.current),
          { title: title.trim() || "(Không có tiêu đề)", content: content.trim(), mood, images, tags, draft: true },
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
    
    // Nếu có tag đang gõ dở, hãy add nốt vào
    let finalTags = [...tags];
    if (tagInput.trim()) {
       finalTags.push(tagInput.trim());
       setTags(finalTags);
       setTagInput("");
    }

    setSaving(true);
    try {
      const { setDoc, doc } = await import("firebase/firestore");
      const data = {
        title: title.trim() || "(Không có tiêu đề)",
        content: content.trim(),
        mood,
        images,
        tags: finalTags,
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
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
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
          <Text style={[styles.backText, { color: colors.primary }]}>← Quay lại</Text>
        </TouchableOpacity>
        
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveText}>Lưu</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Mood selector */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Tâm trạng hôm nay</Text>
        <MoodSelector selected={mood} onChange={setMood} />

        {/* Title */}
        <TextInput
          style={[styles.titleInput, { color: colors.text, borderBottomColor: colors.border }]}
          placeholder="Tiêu đề..."
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
          maxLength={120}
        />

        {/* Tags */}
        <View style={styles.tagsContainer}>
          {tags.map(t => (
            <TouchableOpacity key={t} style={[styles.tagChip, { backgroundColor: colors.primary + "20" }]} onPress={() => removeTag(t)}>
              <Text style={[styles.tagChipText, { color: colors.primary }]}>#{t} ✕</Text>
            </TouchableOpacity>
          ))}
          <TextInput
            style={[styles.tagInput, { color: colors.text }]}
            placeholder={tags.length === 0 ? "Thêm thẻ (cách bằng dấu phẩy)..." : "Thêm thẻ..."}
            placeholderTextColor={colors.textSecondary}
            value={tagInput}
            onChangeText={handleTagInput}
            onSubmitEditing={() => handleTagInput(tagInput + ",")}
          />
        </View>

        {/* Content */}
        <TextInput
          style={[styles.contentInput, { color: colors.text }]}
          placeholder="Hôm nay bạn muốn kể gì nào..."
          placeholderTextColor={colors.textSecondary}
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
                    <Text style={{color: '#ff4757'}}>Lỗi</Text>
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
      <View style={[styles.toolbar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <View style={styles.toolbarContent}>
          <TouchableOpacity onPress={pickImage} style={[styles.attachBtn, { backgroundColor: colors.surface }]}>
            <Text style={[styles.attachText, { color: colors.text }]}>📷 Thêm ảnh</Text>
          </TouchableOpacity>
          {saveStatus === "idle" && (
            <Text style={[styles.autoSaveHint, { color: colors.textSecondary }]}>
              📝 Bắt đầu viết để tự động lưu nháp
            </Text>
          )}
          {saveStatus === "changed" && (
            <Text style={[styles.autoSaveHint, { color: colors.danger }]}>
              ⏳ Đang chờ lưu nháp...
            </Text>
          )}
          {saveStatus === "saving" && (
            <Text style={[styles.autoSaveHint, { color: colors.primary }]}>
              🔄 Đang lưu lên mây...
            </Text>
          )}
          {saveStatus === "saved" && (
            <Text style={[styles.autoSaveHint, { color: colors.success }]}>
              ☁️ Đã lưu tự động
            </Text>
          )}
          {saveStatus === "error" && (
            <Text style={[styles.autoSaveHint, { color: colors.danger }]}>
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    padding: 8,
  },
  backText: {
    fontSize: 15,
  },
  saveBtn: {
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
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 12,
    paddingVertical: 4,
    borderBottomWidth: 1,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  tagInput: {
    flex: 1,
    minWidth: 120,
    fontSize: 14,
    paddingVertical: 6,
  },
  contentInput: {
    fontSize: 15,
    lineHeight: 24,
    minHeight: 240,
  },
  toolbar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    alignItems: "center",
  },
  autoSaveHint: {
    fontSize: 12,
  },
  toolbarContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  attachBtn: {
    padding: 8,
    borderRadius: 8,
  },
  attachText: {
    fontSize: 14,
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
