/**
 * Firma ici mesajlasma anlik baglantisi (4.14, 17.11.2026, #615) — web mesajBaglantisi ile ayni olaylar.
 * - Adres: {API}/hubs/mesaj; oturum anahtari access_token sorgu parametresiyle (sunucu yalniz /hubs icin kabul eder).
 * - Uygulama ONDE iken bagli, arka plana gecince baglanti KAPATILIR: sunucu bagli olmayana telefon bildirimi gonderir
 *   (#614). Boylece ekrandayken bildirim gelmez, mesaj ekrana duser; arka planda / kapaliyken bildirim gelir.
 * - Kopunca artan araliklarla yeniden dener; yeniden baglaninca "yenidenBaglandi" → ekranlar kacirilanlari yukler.
 */
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { AppState, AppStateStatus } from 'react-native';
import { API_URL } from '../config';
import { useAuthStore } from '../store/authStore';

type Dinleyici = (veri: any) => void;
const OLAYLAR = ['mesaj', 'okundu', 'geriAlindi', 'konusma', 'yaziyor', 'grubaEklendi'];

let baglanti: HubConnection | null = null;
let baslatiliyor: Promise<void> | null = null;
let denemeSayaci: ReturnType<typeof setTimeout> | null = null;
let denemeAraligi = 5000;
let istenen = false;
const dinleyiciler: Record<string, Set<Dinleyici>> = {};

const yay = (olay: string, veri: any) => dinleyiciler[olay]?.forEach(d => { try { d(veri); } catch { /* ekran hatasi baglantiyi bozmasin */ } });

export const mesajOlayinaAbone = (olay: string, d: Dinleyici) => {
    (dinleyiciler[olay] ??= new Set()).add(d);
    return () => { dinleyiciler[olay]?.delete(d); };
};

const yenidenDene = () => {
    if (!istenen || denemeSayaci || AppState.currentState !== 'active') return;
    denemeSayaci = setTimeout(() => { denemeSayaci = null; baglan(); }, denemeAraligi);
    denemeAraligi = Math.min(denemeAraligi * 2, 60000);
};

const baglan = async () => {
    if (!istenen || !useAuthStore.getState().user?.token) return;
    if (baglanti && baglanti.state !== HubConnectionState.Disconnected) return;
    if (baslatiliyor) return baslatiliyor;
    if (baglanti) { const eski = baglanti; baglanti = null; eski.stop().catch(() => undefined); }
    const b = new HubConnectionBuilder()
        .withUrl(API_URL.replace(/\/$/, '') + '/hubs/mesaj', {
            accessTokenFactory: () => useAuthStore.getState().user?.token ?? '',
            withCredentials: false,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 20000, 30000])
        .configureLogging(LogLevel.None)
        .build();
    baglanti = b;
    OLAYLAR.forEach(o => b.on(o, v => yay(o, v)));
    b.onreconnected(() => yay('yenidenBaglandi', null));
    b.onclose(() => { if (baglanti === b) yenidenDene(); });
    const ilkMi = denemeAraligi === 5000;
    baslatiliyor = b.start()
        .then(() => { denemeAraligi = 5000; if (!ilkMi) yay('yenidenBaglandi', null); yay('baglandi', null); })
        .catch(() => yenidenDene())
        .finally(() => { baslatiliyor = null; });
    return baslatiliyor;
};

const kes = async () => {
    if (denemeSayaci) { clearTimeout(denemeSayaci); denemeSayaci = null; }
    const b = baglanti;
    baglanti = null;
    if (b) await b.stop().catch(() => undefined);
};

let appStateAboneligi: { remove: () => void } | null = null;

/** Mesaj yetkisi olan oturumda cagrilir: onde baglanir, arka planda keser. */
export const mesajBaglantisiniBaslat = () => {
    istenen = true;
    if (!appStateAboneligi)
        appStateAboneligi = AppState.addEventListener('change', (d: AppStateStatus) => {
            if (!istenen) return;
            if (d === 'active') { denemeAraligi = 5000; baglan(); yay('onPlana', null); }
            else kes();
        });
    if (AppState.currentState === 'active') baglan();
};

/** Cikista / yetki yoksa. */
export const mesajBaglantisiniKapat = async () => {
    istenen = false;
    appStateAboneligi?.remove();
    appStateAboneligi = null;
    await kes();
};

/** "Yaziyor…" bildirimi (bagli degilse sessizce gecer). */
export const yaziyorBildir = (konusmaId: string) => {
    if (baglanti?.state === HubConnectionState.Connected) baglanti.invoke('Yaziyor', konusmaId).catch(() => undefined);
};
