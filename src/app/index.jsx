// src/app/index.jsx  —  Home do Cliente
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import HorizontalList from "@/components/horizontalList";
import ServiceCard from "@/components/serviceCard";
import BarberCard from "@/components/barberCard";

export default function Homepage() {
    const router  = useRouter();
    const { usuario, barbeiros, servicos } = useApp();

    return (
        <View style={styles.wrapper}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

                {/* Saudação */}
                <View style={styles.saudacao}>
                    <View>
                        <Text style={styles.ola}>Olá, {usuario?.nome?.split(" ")[0]} 👋</Text>
                        <Text style={styles.sub}>Que tal um corte hoje?</Text>
                    </View>
                    <TouchableOpacity style={styles.agendaBtn} onPress={() => router.push("/agendamentos")}>
                        <Ionicons name="calendar" size={18} color="#111827" />
                        <Text style={styles.agendaBtnText}>Meus agendamentos</Text>
                    </TouchableOpacity>
                </View>

                {/* Promoção */}
                <View style={styles.promoCard}>
                    <Text style={styles.promoTitle}>🔥 Promoção da Semana!</Text>
                    <View style={styles.promoDivider} />
                    <Text style={styles.promoSub}>✂️ Combo Corte + Barba ✂️</Text>
                    <Text style={styles.promoPreco}>Por apenas R$ 50,00!</Text>
                    <TouchableOpacity
                        style={styles.promoBtn}
                        onPress={() => router.push({ pathname: "/agendar", params: { servicoId: "s1" } })}
                    >
                        <Text style={styles.promoBtnText}>Aproveitar agora</Text>
                    </TouchableOpacity>
                </View>

                {/* Serviços */}
                <Text style={styles.sectionTitle}>Serviços Populares:</Text>
                <HorizontalList
                    data={servicos}
                    renderCard={(item) => (
                        <ServiceCard
                            key={item.id}
                            {...item}
                            onSelect={() => router.push({ pathname: "/agendar", params: { servicoId: item.id } })}
                        />
                    )}
                />

                {/* Barbeiros */}
                <Text style={styles.sectionTitle}>Nossos Cabelereiros:</Text>
                <HorizontalList
                    data={barbeiros}
                    renderCard={(item) => (
                        <BarberCard
                            key={item.id}
                            {...item}
                            onPress={() => router.push({ pathname: "/agendar", params: { barbeiroId: item.id } })}
                        />
                    )}
                />

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: "#111827" },
    scroll: { padding: 16, paddingBottom: 100, gap: 16 },

    saudacao: {
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", marginBottom: 4,
    },
    ola:  { fontSize: 22, fontWeight: "bold", color: "#fff" },
    sub:  { color: "#6B7280", fontSize: 13, marginTop: 2 },
    agendaBtn: {
        flexDirection: "row", alignItems: "center", gap: 6,
        backgroundColor: "#F5C518", borderRadius: 20,
        paddingVertical: 7, paddingHorizontal: 12,
    },
    agendaBtnText: { color: "#111827", fontWeight: "bold", fontSize: 12 },

    promoCard: {
        backgroundColor: "#F5C518", borderRadius: 16,
        padding: 20, alignItems: "center",
        shadowColor: "#F5C518", shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
    },
    promoTitle:   { fontSize: 22, fontWeight: "bold", color: "#111827" },
    promoDivider: { width: "100%", height: 1, backgroundColor: "#00000020", marginVertical: 8 },
    promoSub:     { fontSize: 16, fontWeight: "600", color: "#111827" },
    promoPreco:   { fontSize: 14, color: "#374151", marginTop: 4 },
    promoBtn: {
        marginTop: 12, backgroundColor: "#111827",
        borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24,
    },
    promoBtnText: { color: "#F5C518", fontWeight: "bold", fontSize: 14 },

    sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
});
