// src/components/barberCard.jsx
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function BarberCard({ id, nome, especialidade, onPress }) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.avatar}>
                <Ionicons name="person" size={28} color="#F5C518" />
            </View>
            <Text style={styles.nome}>{nome}</Text>
            {especialidade && (
                <Text style={styles.especialidade}>{especialidade}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#1F2937",
        padding: 14,
        borderRadius: 14,
        width: 130,
        marginRight: 10,
        alignItems: "center",
        gap: 6,
        borderWidth: 1,
        borderColor: "#374151",
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#111827",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#F5C518",
    },
    nome: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 14,
        textAlign: "center",
    },
    especialidade: {
        color: "#6B7280",
        fontSize: 11,
        textAlign: "center",
    },
});