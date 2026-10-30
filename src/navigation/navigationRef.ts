import { createNavigationContainerRef } from '@react-navigation/native';
import { AppStackParamList } from './types';

/** Ekran disindan gezinti (bildirime tiklama). */
export const navigationRef = createNavigationContainerRef<AppStackParamList>();
