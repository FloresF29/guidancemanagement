import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Image,
} from "react-native";
import { db } from "../firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

export default function TestingScreen() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const q = query(collection(db, "incidents"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setIncidents(data);
      } catch (error) {
        console.error("Error fetching incidents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFD54F" />
      </View>
    );
  }

  if (incidents.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>No incidents submitted yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal style={styles.tableWrapper}>
      <View>
        {/* Header Row */}
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.cell, styles.headerCell]}>Type</Text>
          <Text style={[styles.cell, styles.headerCell]}>Location</Text>
          <Text style={[styles.cell, styles.headerCell]}>Date</Text>
          <Text style={[styles.cell, styles.headerCell]}>Urgency</Text>
          <Text style={[styles.cell, styles.headerCell]}>Contact</Text>
        </View>

        {/* Data Rows */}
        <FlatList
          data={incidents}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => setSelectedIncident(item)}
              style={[
                styles.row,
                index % 2 === 0 ? styles.rowEven : styles.rowOdd,
              ]}
            >
              <Text style={styles.cell}>{item.incidentType}</Text>
              <Text style={styles.cell}>{item.location}</Text>
              <Text style={styles.cell}>
                {new Date(item.incidentDate).toLocaleDateString()}
              </Text>
              <Text style={styles.cell}>{item.urgencyLevel}</Text>
              <Text style={styles.cell}>{item.contactInfo || "-"}</Text>
            </TouchableOpacity>
          )}
        />

        {/* Details Modal */}
        {selectedIncident && (
          <Modal
            visible={true}
            animationType="slide"
            transparent={false}
            onRequestClose={() => setSelectedIncident(null)}
          >
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>Incident Details</Text>

              <Text style={styles.field}>
                <Text style={styles.bold}>Type: </Text>
                {selectedIncident.incidentType}
              </Text>
              <Text style={styles.field}>
                <Text style={styles.bold}>Location: </Text>
                {selectedIncident.location}
              </Text>
              <Text style={styles.field}>
                <Text style={styles.bold}>Date: </Text>
                {new Date(selectedIncident.incidentDate).toLocaleString()}
              </Text>
              <Text style={styles.field}>
                <Text style={styles.bold}>Description: </Text>
                {selectedIncident.description}
              </Text>
              <Text style={styles.field}>
                <Text style={styles.bold}>Urgency Level: </Text>
                {selectedIncident.urgencyLevel}
              </Text>
              <Text style={styles.field}>
                <Text style={styles.bold}>Contact Info: </Text>
                {selectedIncident.contactInfo || "N/A"}
              </Text>

              {/* Show Images */}
              {selectedIncident.attachments &&
                selectedIncident.attachments.length > 0 && (
                  <View style={styles.imageGallery}>
                    <Text style={styles.bold}>Attachments:</Text>
                    <ScrollView horizontal>
                      {selectedIncident.attachments.map((uri, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => setFullscreenImage(uri)}
                        >
                          <Image source={{ uri }} style={styles.attachment} />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedIncident(null)}
              >
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </Modal>
        )}

        {/* Fullscreen Image Modal */}
        {fullscreenImage && (
          <Modal visible={true} transparent={true}>
            <View style={styles.fullscreenContainer}>
              <Image
                source={{ uri: fullscreenImage }}
                style={styles.fullscreenImage}
              />
              <TouchableOpacity
                style={styles.fullscreenClose}
                onPress={() => setFullscreenImage(null)}
              >
                <Text style={styles.fullscreenCloseText}>CLOSE</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tableWrapper: {
    flex: 1,
    backgroundColor: "#fff", // white background for table
    margin: 10,
    borderRadius: 8,
    overflow: "hidden",
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 8,
  },
  rowEven: {
    backgroundColor: "#f9f9f9", // light gray
  },
  rowOdd: {
    backgroundColor: "#ffffff", // pure white
  },
  headerRow: {
    backgroundColor: "#800000", // dark red header
  },
  cell: {
    minWidth: 120,
    paddingHorizontal: 8,
    color: "#000",
  },
  headerCell: {
    fontWeight: "bold",
    color: "#fff",
  },
  modalContent: {
    padding: 20,
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#800000",
  },
  field: {
    marginBottom: 10,
    fontSize: 16,
    color: "#000",
  },
  bold: {
    fontWeight: "bold",
    color: "#333",
  },
  imageGallery: {
    marginVertical: 15,
  },
  attachment: {
    width: 150,
    height: 150,
    marginRight: 10,
    borderRadius: 8,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#800000",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  closeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImage: {
    width: "90%",
    height: "80%",
    resizeMode: "contain",
  },
  fullscreenClose: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#FFD54F",
    borderRadius: 5,
  },
  fullscreenCloseText: {
    fontWeight: "bold",
    color: "#000",
    fontSize: 16,
  },
});
