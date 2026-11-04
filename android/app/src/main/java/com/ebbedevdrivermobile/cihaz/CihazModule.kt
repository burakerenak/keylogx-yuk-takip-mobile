package com.ebbedevdrivermobile.cihaz

import android.content.Context
import android.location.LocationManager
import androidx.core.location.LocationManagerCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.play.core.appupdate.AppUpdateInfo
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.UpdateAvailability

/**
 * Cihaz durumu ve magaza guncellemesi (04.11.2026).
 * - #542 konumAcikMi: telefonun konum servisi (GPS / ag konumu) acik mi; izin degil, servisin kendisi.
 * - #545 guncellemeBaslat: Google Play uygulama ici guncelleme, IMMEDIATE (tam ekran, beklemeli) akisi.
 *   Sonuc: "baslatildi" (Play ekrani acildi), "yok" (Play guncelleme gormuyor / izin vermiyor), "hata".
 *   "yok" / "hata" durumunda JS "Yeni sürüm mevcut" penceresini gosterir.
 */
class CihazModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val GUNCELLEME_ISTEK_KODU = 4512
    }

    override fun getName() = "Cihaz"

    @ReactMethod
    fun konumAcikMi(promise: Promise) {
        try {
            val yonetici = reactContext.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
            if (yonetici == null) {
                // Konum donanimi yok: servis kapali sayilmaz (kullanicinin acabilecegi bir ayar yok).
                promise.resolve(true)
                return
            }
            promise.resolve(LocationManagerCompat.isLocationEnabled(yonetici))
        } catch (e: Exception) {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun guncellemeBaslat(promise: Promise) {
        try {
            val yonetici = AppUpdateManagerFactory.create(reactContext)
            yonetici.appUpdateInfo
                .addOnSuccessListener { bilgi -> akisiBaslat(yonetici, bilgi, promise) }
                .addOnFailureListener { promise.resolve("hata") }
        } catch (e: Exception) {
            promise.resolve("hata")
        }
    }

    private fun akisiBaslat(yonetici: AppUpdateManager, bilgi: AppUpdateInfo, promise: Promise) {
        try {
            val durum = bilgi.updateAvailability()
            // Yarim kalan IMMEDIATE guncelleme (uygulama one gelince) ayni akisla surdurulur.
            val surdur = durum == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS
            val yeni = durum == UpdateAvailability.UPDATE_AVAILABLE && bilgi.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)
            if (!surdur && !yeni) {
                promise.resolve("yok")
                return
            }
            val aktivite = reactContext.currentActivity
            if (aktivite == null) {
                promise.resolve("hata")
                return
            }
            val basladi = yonetici.startUpdateFlowForResult(
                bilgi,
                aktivite,
                AppUpdateOptions.newBuilder(AppUpdateType.IMMEDIATE).build(),
                GUNCELLEME_ISTEK_KODU
            )
            promise.resolve(if (basladi) "baslatildi" else "yok")
        } catch (e: Exception) {
            promise.resolve("hata")
        }
    }
}
