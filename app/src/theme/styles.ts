import { StyleSheet } from "react-native";
import { colors, font, spacing } from "./tokens";

export const ui = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  title: {
    fontSize: font.title,
    fontWeight: "700",
    color: colors.text,
  },
  body: {
    fontSize: font.body,
    color: colors.text,
  },
  muted: {
    fontSize: font.caption,
    color: colors.muted,
  },
  stack: {
    gap: spacing.md,
  },
});
