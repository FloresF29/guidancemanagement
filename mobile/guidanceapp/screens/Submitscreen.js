import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Platform,
  ScrollView, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard,
  Modal, Alert, ActivityIndicator
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function SubmitScreen() {
  const navigation = useNavigation();
  const [description, setDescription] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState("");
  const [incidentType, setIncidentType] = useState("");
  const [incidentDate, setIncidentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [images, setImages] = useState([]);
  const [contactInfo, setContactInfo] = useState('');
  const [loading, setLoading] = useState(false);

  // Fullscreen modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Rate limiting
  const [cooldown, setCooldown] = useState(0);
  const [dailyCount, setDailyCount] = useState(0);

  const maxChars = 100;

  useEffect(() => {
    loadSubmissionData();
  }, []);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const loadSubmissionData = async () => {
    try {
      const data = await AsyncStorage.getItem("submissionData");
      if (data) {
        const { date, count, lastSubmit } = JSON.parse(data);
        const today = new Date().toDateString();

        if (date === today) {
          setDailyCount(count);
        } else {
          setDailyCount(0);
        }

        if (lastSubmit) {
          const elapsed = Math.floor((Date.now() - lastSubmit) / 1000);
          if (elapsed < 60) setCooldown(60 - elapsed);
        }
      }
    } catch (err) {
      console.error("Error loading submission data", err);
    }
  };

  const saveSubmissionData = async () => {
    const today = new Date().toDateString();
    const newData = {
      date: today,
      count: dailyCount + 1,
      lastSubmit: Date.now(),
    };
    await AsyncStorage.setItem("submissionData", JSON.stringify(newData));
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || incidentDate;
    setShowDatePicker(Platform.OS === "ios");
    setIncidentDate(currentDate);
  };

  const pickImage = () => {
    Alert.alert(
      "Add Attachment",
      "Choose an option",
      [
        {
          text: "Take Photo",
          onPress: async () => {
            let result = await ImagePicker.launchCameraAsync({
              mediaTypes: images,
              quality: 0.7,
            });
            if (!result.canceled) {
              if (images.length >= 5) {
                Alert.alert("Limit reached", "You can only upload up to 5 images.");
                return;
              }
              setImages([...images, result.assets[0].uri]);
            }
          },
        },
        {
          text: "Choose from Gallery",
          onPress: async () => {
            let result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: images,
              quality: 0.7,
              allowsMultipleSelection: true,
              selectionLimit: 5,
            });
            if (!result.canceled) {
              const uris = result.assets.map((asset) => asset.uri);
              if (uris.length + images.length > 5) {
                Alert.alert("Limit reached", "You can only upload up to 5 images total.");
                return;
              }
              setImages([...images, ...uris]);
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const removeImage = (uri) => {
    setImages(images.filter(img => img !== uri));
  };

  const uploadImagesToCloudinary = async () => {
    try {
      const uploadedUrls = [];
      for (let uri of images) {
        let data = new FormData();
        data.append("file", {
          uri,
          type: "image/jpeg",
          name: "upload.jpg",
        });
        data.append("upload_preset", "reporttest1");

        const res = await fetch(
          "https://api.cloudinary.com/v1_1/dd3yfkuux/image/upload",
          { method: "POST", body: data }
        );
        const file = await res.json();
        if (file.secure_url) uploadedUrls.push(file.secure_url);
      }
      return uploadedUrls;
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      return [];
    }
  };

  const handleSubmit = async () => {
    if (loading) return;

    if (cooldown > 0) {
      Alert.alert(`Please wait ${cooldown} seconds before submitting again.`);
      return;
    }

    if (dailyCount >= 5) {
      Alert.alert("Daily limit reached.");
      return;
    }

    if (!incidentType || !location || !description || !urgencyLevel) {
      Alert.alert("Please complete all required fields.");
      return;
    }

    try {
      setLoading(true);

      let imageUrls = [];
      if (images.length > 0) {
        imageUrls = await uploadImagesToCloudinary();
      }

      await addDoc(collection(db, "incidents"), {
        incidentType,
        location,
        incidentDate: incidentDate.toISOString(),
        description,
        urgencyLevel,
        attachments: imageUrls,
        contactInfo,
        timestamp: serverTimestamp(),
      });

      await saveSubmissionData();
      setDailyCount((c) => c + 1);
      setCooldown(60);

      Alert.alert("Incident submitted successfully.");
      navigation.navigate("Home");

      setIncidentType("");
      setLocation("");
      setDescription("");
      setUrgencyLevel("");
      setImages([]);
      setContactInfo("");
      setIncidentDate(new Date());
    } catch (error) {
      console.error("Error submitting incident:", error);
      Alert.alert("Failed to submit incident.");
    } finally {
      setLoading(false);
    }
  };

  const openImage = (uri) => {
    setSelectedImage(uri);
    setModalVisible(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <Image
            source={require('../assets/shieldcheck.png')}
            style={styles.image}
          />

          <View style={styles.formBox}>
            <Text style={styles.label}>TYPE OF INCIDENT</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={incidentType}
                onValueChange={(itemValue) => setIncidentType(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="-- Choose Type of Incident --" value="" enabled={false} />
                <Picker.Item label="Theft" value="Theft" />
                <Picker.Item label="Vandalism" value="Vandalism" />
                <Picker.Item label="Fighting" value="Fighting" />
                <Picker.Item label="Bullying" value="Bullying" />
                <Picker.Item label="Disruptive Behavior" value="Disruptive Behavior" />
              </Picker>
            </View>

            <Text style={styles.label}>LOCATION OF THE INCIDENT</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter place"
              value={location}
              onChangeText={setLocation}
            />

            <Text style={styles.label}>DATE OF THE INCIDENT</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
              <Text style={styles.dateText}>{incidentDate.toDateString()}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={incidentDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}

            <Text style={styles.label}>DETAILS OF THE INCIDENT</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Enter description"
              multiline
              numberOfLines={4}
              maxLength={maxChars}
              value={description}
              onChangeText={text => setDescription(text)}
            />
            <Text style={styles.counter}>{description.length} / {maxChars}</Text>

            <Text style={styles.label}>URGENCY LEVEL</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={urgencyLevel}
                onValueChange={(itemValue) => setUrgencyLevel(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="-- Choose Urgency Level --" value="" enabled={false} />
                <Picker.Item label="Level 1" value="1" />
                <Picker.Item label="Level 2" value="2" />
                <Picker.Item label="Level 3" value="3" />
                <Picker.Item label="Level 4" value="4" />
                <Picker.Item label="Level 5" value="5" />
              </Picker>
            </View>

            <Text style={styles.label}>ATTACHMENTS (Optional)</Text>
            <TouchableOpacity style={styles.pickButton} onPress={pickImage}>
              <Text style={styles.pickText}>Pick Images / Take Photo</Text>
            </TouchableOpacity>
            <View style={styles.previewRow}>
              {images.map((uri, idx) => (
                <View key={idx} style={styles.imageWrapper}>
                  <TouchableOpacity onPress={() => openImage(uri)}>
                    <Image source={{ uri }} style={styles.preview} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeImage(uri)}
                  >
                    <Text style={styles.removeText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <Text style={styles.label}>WOULD YOU LIKE TO BE CONTACTED (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="If yes, please enter your phone number here"
              value={contactInfo}
              onChangeText={setContactInfo}
            />

            {/* Rate limit feedback */}
            <Text style={{ color: 'white', marginVertical: 5, textAlign: "center" }}>
              {cooldown > 0
                ? `Please wait ${cooldown}s before next submission`
                : `Submissions today: ${dailyCount}/5`}
            </Text>
          </View>

          <View style={styles.buttonBox}>
            <TouchableOpacity style={styles.cancelbutton} onPress={() => navigation.navigate("Home")}>
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
            {loading ? (
              <ActivityIndicator size="large" color="#FFD54F" style={{ marginLeft: 20 }} />
            ) : (
              <TouchableOpacity style={styles.submitbutton} onPress={handleSubmit}>
                <Text style={styles.submitText}>SUBMIT</Text>
              </TouchableOpacity>
            )}
          </View>

          <Modal visible={modalVisible} transparent={true}>
            <View style={styles.modalContainer}>
              <Image source={{ uri: selectedImage }} style={styles.fullscreenImage} />
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeText}>CLOSE</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#800000' },
  scrollContainer: { alignItems: 'center', paddingBottom: 50 },
  image: { width: 120, height: 120, resizeMode: 'contain', marginVertical: 10 },
  formBox: { width: '85%', marginBottom: 20 },
  label: { fontWeight: 'bold', marginTop: 10, marginBottom: 5, color: '#ffffff' },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 5,
    paddingHorizontal: 10, paddingVertical: 8,
    backgroundColor: '#ffffff', fontSize: 16, color: '#000',
  },
  multilineInput: { height: 80, textAlignVertical: 'top' },
  dateText: { fontSize: 16, color: '#000' },
  pickerWrapper: {
    borderRadius: 5, backgroundColor: '#f9f9f9',
    marginBottom: 10, borderWidth: 1, borderColor: '#ccc',
  },
  picker: { height: 55, width: '100%', color: '#000', fontSize: 16 },
  pickButton: {
    backgroundColor: "#FFD54F", padding: 10, borderRadius: 5,
    alignItems: "center", marginVertical: 10,
  },
  pickText: { fontWeight: "bold", color: "#000" },
  previewRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
  imageWrapper: { position: "relative" },
  preview: { width: 100, height: 100, margin: 5, borderRadius: 5 },
  removeButton: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  removeText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  buttonBox: {
    flexDirection: "row", justifyContent: "space-between",
    width: '75%', paddingHorizontal: 20,
  },
  cancelbutton: {
    backgroundColor: '#C40410', alignItems: "center",
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5,
  },
  submitbutton: {
    backgroundColor: '#FFD54F', alignItems: "center",
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5,
  },
  cancelText: {
    color: "white", fontSize: 18, fontWeight: "bold",
    paddingVertical: 10, paddingHorizontal: 20,
  },
  submitText: {
    color: "black", fontSize: 18, fontWeight: "bold",
    paddingVertical: 10, paddingHorizontal: 20,
  },
  counter: { alignSelf: 'flex-end', marginTop: 5, color: '#ffffff', fontSize: 12 },
  modalContainer: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center", alignItems: "center",
  },
  fullscreenImage: { width: "90%", height: "80%", resizeMode: "contain" },
  closeButton: {
    marginTop: 20, padding: 10, backgroundColor: "#FFD54F", borderRadius: 5,
  },
  closeText: { fontWeight: "bold", color: "#000" },
});
