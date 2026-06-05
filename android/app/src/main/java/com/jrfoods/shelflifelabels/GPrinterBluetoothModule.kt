package com.jrfoods.shelflifelabels

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.graphics.Bitmap
import android.content.pm.PackageManager
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.net.Uri
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.gprinter.command.LabelCommand
import com.gprinter.io.BluetoothPort
import java.io.IOException

class GPrinterBluetoothModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
  private var bluetoothPort: BluetoothPort? = null
  private var connectedAddress: String? = null

  override fun getName(): String = "GPrinterBluetooth"

  @ReactMethod
  fun getPairedPrinters(promise: Promise) {
    if (!hasBluetoothConnectPermission()) {
      promise.reject("BLUETOOTH_PERMISSION_MISSING", "Bluetooth permission has not been granted.")
      return
    }

    val adapter = BluetoothAdapter.getDefaultAdapter()
    if (adapter == null) {
      promise.reject("BLUETOOTH_UNAVAILABLE", "This Android device does not support Bluetooth.")
      return
    }

    if (!adapter.isEnabled) {
      promise.reject("BLUETOOTH_DISABLED", "Bluetooth is turned off.")
      return
    }

    val devices = Arguments.createArray()
    adapter.bondedDevices.forEach { device ->
      val item = Arguments.createMap()
      item.putString("id", device.address)
      item.putString("address", device.address)
      item.putString("name", device.name ?: "Bluetooth Printer")
      item.putInt("bluetoothClass", device.bluetoothClass?.deviceClass ?: 0)
      item.putInt("majorDeviceClass", device.bluetoothClass?.majorDeviceClass ?: 0)
      devices.pushMap(item)
    }

    promise.resolve(devices)
  }

  @ReactMethod
  fun connect(address: String, promise: Promise) {
    if (!hasBluetoothConnectPermission()) {
      promise.reject("BLUETOOTH_PERMISSION_MISSING", "Bluetooth permission has not been granted.")
      return
    }

    try {
      closeCurrentPort()
      val port = BluetoothPort(address)
      var opened = port.openPort()
      if (!opened) {
        Thread.sleep(600)
        opened = port.openPort()
      }

      if (!opened) {
        port.closePort()
        promise.reject("PRINTER_CONNECT_FAILED", "Could not connect to Bluetooth printer $address.")
        return
      }

      bluetoothPort = port
      connectedAddress = address
      promise.resolve(true)
    } catch (error: Exception) {
      closeCurrentPort()
      promise.reject("PRINTER_CONNECT_ERROR", error.message ?: "Bluetooth printer connection failed.", error)
    }
  }

  @ReactMethod
  fun disconnect(promise: Promise) {
    try {
      closeCurrentPort()
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("PRINTER_DISCONNECT_ERROR", error.message ?: "Bluetooth printer disconnect failed.", error)
    }
  }

  @ReactMethod
  fun printBitmap(options: ReadableMap, promise: Promise) {
    val port = bluetoothPort
    if (port == null || connectedAddress == null) {
      promise.reject("PRINTER_NOT_CONNECTED", "Connect to a Bluetooth printer before printing.")
      return
    }

    val bitmapUri = options.getString("bitmapUri")
    if (bitmapUri.isNullOrBlank()) {
      promise.reject("BITMAP_URI_MISSING", "Label bitmap URI is missing.")
      return
    }

    val quantity = if (options.hasKey("quantity")) options.getInt("quantity").coerceAtLeast(1) else 1
    val labelWidthMm = if (options.hasKey("labelWidthMm")) options.getInt("labelWidthMm") else 60
    val labelHeightMm = if (options.hasKey("labelHeightMm")) options.getInt("labelHeightMm") else 40
    val bitmapWidthPx = if (options.hasKey("bitmapWidthPx")) options.getInt("bitmapWidthPx") else mmToDots(labelWidthMm)
    val bitmapHeightPx = if (options.hasKey("bitmapHeightPx")) options.getInt("bitmapHeightPx") else mmToDots(labelHeightMm)

    try {
      val decodedBitmap = reactContext.contentResolver.openInputStream(Uri.parse(bitmapUri)).use { inputStream ->
        BitmapFactory.decodeStream(inputStream)
      }

      if (decodedBitmap == null) {
        promise.reject("BITMAP_DECODE_FAILED", "Could not decode label bitmap.")
        return
      }

      val printableBitmap = normalizeBitmapForLabel(decodedBitmap, bitmapWidthPx, bitmapHeightPx)

      val labelCommand = LabelCommand()
      labelCommand.addSize(labelWidthMm, labelHeightMm)
      labelCommand.addGap(2)
      labelCommand.addDirection(LabelCommand.DIRECTION.FORWARD, LabelCommand.MIRROR.NORMAL)
      labelCommand.addCls()
      labelCommand.addBitmap(0, 0, bitmapWidthPx, printableBitmap)
      labelCommand.addPrint(quantity)
      val printedAddress = connectedAddress
      port.writeDataImmediately(labelCommand.command)
      Thread.sleep(800)
      closeCurrentPort()

      val result = Arguments.createMap()
      result.putString("status", "printed")
      result.putString("printerAddress", printedAddress ?: "")
      promise.resolve(result)
    } catch (error: IOException) {
      closeCurrentPort()
      promise.reject("PRINTER_WRITE_ERROR", error.message ?: "Could not send label bitmap to printer.", error)
    } catch (error: Exception) {
      closeCurrentPort()
      promise.reject("PRINTER_PRINT_ERROR", error.message ?: "Could not print label bitmap.", error)
    }
  }

  private fun hasBluetoothConnectPermission(): Boolean {
    return Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
      reactContext.checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED
  }

  private fun mmToDots(mm: Int): Int = ((mm / 25.4f) * 203f).toInt().coerceAtLeast(1)

  private fun normalizeBitmapForLabel(source: Bitmap, widthPx: Int, heightPx: Int): Bitmap {
    val output = Bitmap.createBitmap(widthPx, heightPx, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(output)
    val paint = Paint(Paint.DITHER_FLAG)
    canvas.drawColor(Color.WHITE)
    canvas.drawBitmap(source, null, Rect(0, 0, widthPx, heightPx), paint)
    return toHighContrastBitmap(output)
  }

  private fun toHighContrastBitmap(source: Bitmap): Bitmap {
    val width = source.width
    val height = source.height
    val pixels = IntArray(width * height)
    source.getPixels(pixels, 0, width, 0, 0, width, height)

    for (index in pixels.indices) {
      val color = pixels[index]
      val alpha = Color.alpha(color)
      val red = Color.red(color)
      val green = Color.green(color)
      val blue = Color.blue(color)
      val luminance = ((red * 299) + (green * 587) + (blue * 114)) / 1000
      pixels[index] = if (alpha > 32 && luminance < 145) Color.BLACK else Color.WHITE
    }

    val output = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    output.setPixels(pixels, 0, width, 0, 0, width, height)
    return output
  }

  private fun closeCurrentPort() {
    bluetoothPort?.closePort()
    bluetoothPort = null
    connectedAddress = null
  }
}
