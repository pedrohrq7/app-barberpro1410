// src/components/serviceCard.jsx
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function ServiceCard({ id, nome, preco, duracao, onSelect }) {
    return (
        <View style={styles.serviceCard}>
            <Text style={styles.titleService}>{nome}</Text>
            <Text style={styles.textInfo}>💵 Preço: R$ {preco}</Text>
            <Text style={styles.textInfo}>⏱️ Tempo: {duracao} min</Text>
            <TouchableOpacity style={styles.btn} onPress={onSelect} activeOpacity={0.8}>
                <Text style={styles.btnText}>Agende agora!</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    serviceCard: {
        backgroundColor: "#1F2937",
        padding: 14,
        borderRadius: 14,
        width: 180,
        marginRight: 10,
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "#374151",
        gap: 6,
    },
    titleService: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#fff",
    },
    textInfo: {
        fontSize: 13,
        color: "#9CA3AF",
    },
    btn: {
        backgroundColor: "#F5C518",
        borderRadius: 8,
        paddingVertical: 8,
        alignItems: "center",
        marginTop: 4,
    },
    btnText: {
        color: "#111827",
        fontWeight: "bold",
        fontSize: 13,
    },
});