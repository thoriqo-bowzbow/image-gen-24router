import type { Metadata } from 'next';
import { SettingsView } from '@/components/settings/SettingsView';

export const metadata: Metadata = {
  title: 'Settings • ImageGen',
  description: 'Kelola AI provider dan daftar model',
};

export default function SettingsPage() {
  return <SettingsView />;
}
