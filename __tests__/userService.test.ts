// Cikis Yap hatirlanan kullaniciyi gercekten silmeli (21.10.2026): kayit server = 'user' ile yapiliyor, silme de ayni anahtarla.
jest.mock('react-native-keychain', () => {
    const depo = new Map<string, string>();
    return {
        setInternetCredentials: jest.fn(async (server: string, _u: string, sifre: string) => { depo.set(server, sifre); return true; }),
        getInternetCredentials: jest.fn(async (server: string) => (depo.has(server) ? { password: depo.get(server) } : false)),
        resetInternetCredentials: jest.fn(async (o: { server?: string }) => { if (o.server) depo.delete(o.server); }),
    };
});

import { deleteUser, getUser, saveUser } from '../src/services/userService';

test('cikis sonrasi hatirlanan kullanici kalmaz', async () => {
    await saveUser({ id: 'u1', nameSurname: 'Test Mesai' } as any);
    expect(await getUser()).not.toBeNull();
    await deleteUser();
    expect(await getUser()).toBeNull();
});
