// src/components/navbar.jsx
// Navbar adaptativa — muda os botões conforme o tipo do usuário logado
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import NavButton from "./navButton";
import { useApp } from "../context/AppContext";

export default function Navbar() {
    const router   = useRouter();
    const pathname = usePathname();
    const { usuario } = useApp();

    const go = (path) => {
        if (pathname === path) return;
        router.replace(path);
    };

    // ── Navbar do BARBEIRO ──
    if (usuario?.tipo === "barbeiro") {
        return (
            <View style={styles.navbar}>
                <NavButton
                    icon={<Ionicons name="grid" size={26} color="white" />}
                    title="Dashboard"
                    isActive={pathname === "/barbeiro/dashboard"}
                    onPress={() => go("/barbeiro/dashboard")}
                />
                <NavButton
                    icon={<Ionicons name="calendar" size={26} color="white" />}
                    title="Agenda"
                    isActive={pathname === "/barbeiro/agenda"}
                    onPress={() => go("/barbeiro/agenda")}
                />
                <NavButton
                    icon={<Ionicons name="settings" size={26} color="white" />}
                    title="Gerenciar"
                    isActive={pathname === "/barbeiro/gerenciar"}
                    onPress={() => go("/barbeiro/gerenciar")}
                />
            </View>
        );
    }

    // ── Navbar do CLIENTE ──
    return (
        <View style={styles.navbar}>
            <NavButton
                icon={<Ionicons name="home" size={26} color="white" />}
                title="Home"
                isActive={pathname === "/"}
                onPress={() => go("/")}
            />
            <NavButton
                icon={<Ionicons name="calendar" size={26} color="white" />}
                title="Meus Agend."
                isActive={pathname === "/agendamentos"}
                onPress={() => go("/agendamentos")}
            />
            <NavButton
                icon={<Ionicons name="cut" size={26} color="white" />}
                title="Agendar"
                isActive={pathname === "/agendar"}
                onPress={() => go("/agendar")}
            />
            <NavButton
                icon={<Ionicons name="person" size={26} color="white" />}
                title="Perfil"
                isActive={pathname === "/perfil"}
                onPress={() => go("/perfil")}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    navbar: {
        justifyContent: "space-around",
        alignItems: "center",
        flexDirection: "row",
        backgroundColor: "#1F2937",
        width: "100%",
        padding: 8,
        position: "absolute",
        bottom: 0,
        height: 70,
        borderTopWidth: 1,
        borderTopColor: "#374151",
    },
});