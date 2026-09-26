import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { notificationService } from '../services/notificationService';
import { COLORS } from '../constants/theme';

export default function RootLayout() {
  useEffect(() => {
    // Request notification permissions on initial app mount
    notificationService.requestPermissions();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.surface,
          },
          headerTintColor: COLORS.textPrimary,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="students/add"
          options={{
            title: 'Add New Student',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="students/[id]"
          options={{
            title: 'Student Details',
          }}
        />
        <Stack.Screen
          name="students/edit"
          options={{
            title: 'Edit Student',
          }}
        />
        <Stack.Screen
          name="settings/index"
          options={{
            title: 'Settings',
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
