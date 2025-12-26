import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";

type CardProps = {
  title?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
};

export default function Card({ title, children, style }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontWeight: "700",
    marginBottom: spacing.sm,
    color: colors.text,
  },
});
