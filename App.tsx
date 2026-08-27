import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootApp } from './src/app/RootApp';
import { LanguageProvider } from './src/i18n/LanguageContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <RootApp />
      </LanguageProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
