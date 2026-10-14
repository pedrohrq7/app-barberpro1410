import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "../context/AppContext";
import ServiceCard from "../components/serviceCard";

export default function Servicos() {
    const router = useRouter();
    const { servicos } = useApp();
    return (
        <View style={styles.wrapper}>
            <Text style={styles.title}>Serviços</Text>
            {servicos.length === 0 ? (
                <Text style={styles.empty}>Nenhum serviço disponível no momento.</Text>
            ) : (
                <ScrollView contentContainerStyle={styles.list}>
                    {servicos.map((service) => (
                        <ServiceCard
                            key={service.id}
                            {...service}
                            onSelect={() => router.push({ pathname: "/agendar", params: { servicoId: service.id } })}
                        />
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: "#111827", padding: 16 },
    title: { color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 14 },
    list: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingBottom: 100 },
    empty: { color: "#9CA3AF", marginTop: 16 },
});
