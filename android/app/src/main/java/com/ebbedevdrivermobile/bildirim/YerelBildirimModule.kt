package com.ebbedevdrivermobile.bildirim

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Uygulama acikken gelen bildirimi telefonun bildirim alanina sesli dusurur (30.10.2026, #505).
 * Android, uygulama on plandayken FCM bildirimini kendisi gostermez; sunucunun "mesai_hatirlatma" kanaliyla ayni kanal kullanilir.
 */
class YerelBildirimModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val KANAL = "mesai_hatirlatma"
        private var sayac = 1000

        /** Kanal uygulama acilisinda bir kez olusturulur; arka planda gelen FCM bildirimi de bu kanalla sesli gelir. */
        fun kanalOlustur(context: Context) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
            val yonetici = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            if (yonetici.getNotificationChannel(KANAL) != null) return
            val kanal = NotificationChannel(KANAL, "Mesai Hatırlatma", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Mesai başlatma / kapatma hatırlatmaları ve yük bildirimleri"
                enableVibration(true)
                setSound(
                    RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
                    AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).build()
                )
            }
            yonetici.createNotificationChannel(kanal)
        }
    }

    override fun getName() = "YerelBildirim"

    @ReactMethod
    fun goster(baslik: String, metin: String) {
        kanalOlustur(reactContext)
        val acilis = reactContext.packageManager.getLaunchIntentForPackage(reactContext.packageName)
        val dokunma = acilis?.let {
            PendingIntent.getActivity(reactContext, 0, it, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        }
        val bildirim = NotificationCompat.Builder(reactContext, KANAL)
            .setSmallIcon(reactContext.applicationInfo.icon)
            .setContentTitle(baslik)
            .setContentText(metin)
            .setStyle(NotificationCompat.BigTextStyle().bigText(metin))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setAutoCancel(true)
            .apply { if (dokunma != null) setContentIntent(dokunma) }
            .build()
        try {
            NotificationManagerCompat.from(reactContext).notify(sayac++, bildirim)
        } catch (e: SecurityException) {
            // Bildirim izni verilmemis: uygulama ekranindaki yazili bildirim yeterli.
        }
    }
}
