import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function ServiceButton({ label = "Agende agora!", servicoId, onPress }) {
  const router = useRouter();

  const handlePress = () => {
    // Chama o callback do pai (ex: salvar serviço selecionado)
    if (onPress) onPress();

    // Navega para agendamento passando o id do serviço como parâmetro
    router.push({
      pathname: "/agendamento",
      params: servicoId ? { servicoId } : {},
    });
  };

  return (
    <TouchableOpacity style={styles.btn} onPress={handlePress} activeOpacity={0.8}>
      <Text style={styles.btnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: "#F5C518",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#F5C518",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  btnText: {
    color: "#1a1a2e",
    fontWeight: "bold",
    fontSize: 14,
  },
});