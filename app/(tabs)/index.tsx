import { Text, View } from "react-native";
import Card from "../src/components/Card";
import { ui } from "../src/theme/styles";

export default function Home() {
  return (
    <View style={ui.screen}>
      <Text style={ui.title}>Home</Text>
      <Text style={ui.muted}>Scaffolding with common UI tokens</Text>

      <View style={ui.stack}>
        <Card title="Actions">
          <Text style={ui.body}>Quick action buttons will go here.</Text>
        </Card>
        <Card title="SplitTime">
          <Text style={ui.body}>A split time schedule will go here.</Text>
        </Card>
        <Card title="Todo">
          <Text style={ui.body}>Today's to-do list will appear here.</Text>
        </Card>
      </View>
    </View>
  );
}
