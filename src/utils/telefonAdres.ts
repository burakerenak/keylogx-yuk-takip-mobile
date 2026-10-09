/**
 * Telefon numarasından arama adresi (tel:) üretir (09.10.2026). Boşluk, parantez ve tireler atılır;
 * başında 0 olmayan 10 haneli yurt içi numaraya 0 eklenir ("(505) 120-70-80" → "tel:05051207080").
 * "+" ile başlayan uluslararası numara olduğu gibi kalır. Numara yoksa undefined.
 */
export const telefonAramaAdresi = (telefon?: string | null): string | undefined => {
    if (!telefon)
        return undefined;

    const arti = telefon.trim().startsWith('+');
    let rakamlar = telefon.replace(/\D/g, '');

    if (rakamlar.length < 7)
        return undefined;

    if (!arti && rakamlar.length == 10 && !rakamlar.startsWith('0'))
        rakamlar = '0' + rakamlar;

    return 'tel:' + (arti ? '+' : '') + rakamlar;
};
