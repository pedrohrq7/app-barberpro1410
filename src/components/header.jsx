// Cabeçalho fixo do app exibido em todas as telas via _layout.jsx
// Para adicionar ícones (ex: notificações, menu), use flexDirection: "row"
// e adicione Ionicons ao lado do título


import {View, Text, StyleSheet} from "react-native"

export default function Header(){
    return (
        <View style= {styles.container}>
            <Text style= {[styles.text, styles.textTitle]}>BarberPro</Text>
        </View>
    )
}

const styles = StyleSheet.create({


    container: {
        backgroundColor: "#1E3A8A",
        width: "100%",
        paddingTop: 40,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        gap: 50
    },

    textTitle: {
        fontSize: 26,

    },
    text: {
        color: "#FFFFFF",
        fontSize: 14,
        
    }

})