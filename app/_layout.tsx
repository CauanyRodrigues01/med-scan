import { Stack } from 'expo-router/stack';
import { StatusBar } from "expo-status-bar";

export default function Layout() {
  return (
    <Stack>

      <Stack.Screen name="index" options={{ headerShown: false }}/>
    </Stack>
  );
}