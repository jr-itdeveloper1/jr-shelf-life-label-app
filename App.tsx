import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootApp } from './src/app/RootApp';

export default function App() {
  return (
    <SafeAreaProvider>
      <RootApp />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
