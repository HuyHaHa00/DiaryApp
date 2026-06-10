import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  Platform,
} from "react-native";

interface Props {
  images: { uri: string }[];
  imageIndex: number;
  visible: boolean;
  onRequestClose: () => void;
}

export default function ImageViewer({
  images,
  imageIndex,
  visible,
  onRequestClose,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(imageIndex);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(imageIndex);
    }
  }, [imageIndex, visible]);

  if (!visible || !images || images.length === 0) return null;

  const currentUri = images[currentIndex]?.uri;

  const showNext = () => {
    if (currentIndex < images.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const showPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={styles.container}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onRequestClose} />
        
        <View style={styles.popup}>
          <TouchableOpacity style={styles.closeBtn} onPress={onRequestClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          <Image
            source={{ uri: currentUri }}
            style={styles.image}
            resizeMode="contain"
          />

          {images.length > 1 && currentIndex > 0 && (
            <TouchableOpacity style={[styles.navBtn, styles.navLeft]} onPress={showPrev}>
              <Text style={styles.navText}>‹</Text>
            </TouchableOpacity>
          )}

          {images.length > 1 && currentIndex < images.length - 1 && (
            <TouchableOpacity style={[styles.navBtn, styles.navRight]} onPress={showNext}>
              <Text style={styles.navText}>›</Text>
            </TouchableOpacity>
          )}
          
          {images.length > 1 && (
            <Text style={styles.counter}>
              {currentIndex + 1} / {images.length}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.9)",
  },
  popup: {
    width: "95%",
    height: "85%",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 20,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    lineHeight: 18,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  navBtn: {
    position: "absolute",
    top: "50%",
    marginTop: -25,
    width: 50,
    height: 50,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  navLeft: {
    left: 10,
  },
  navRight: {
    right: 10,
  },
  navText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 36,
  },
  counter: {
    position: "absolute",
    bottom: -20,
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  }
});
