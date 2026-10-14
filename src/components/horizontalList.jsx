// Lista horizontal reutilizável
// Recebe qualquer tipo de card via renderCard
// Para mudar a altura máxima da lista, ajuste maxHeight

import { FlatList, View, StyleSheet } from "react-native";

export default function HorizontalList({data, renderCard}) {


    return (
        <FlatList
            style = {styles.HorizontalList}
            data={data}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 10}}
            renderItem={ ({item}) => (
                <View>{renderCard(item)}</View>
            ) }
        />
    )
}

const styles = StyleSheet.create({
    HorizontalList: {
        width: "100%",
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
        maxHeight: 195
    }
})