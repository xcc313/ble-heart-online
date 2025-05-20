
# https://developer.aliyun.com/article/1662587

import asyncio

from bleak import BleakScanner, BleakClient, BleakError

# 标准蓝牙心率服务和特征 UUID
HEART_RATE_SERVICE_UUID = "0000180d-0000-1000-8000-00805f9b34fb"
HEART_RATE_MEASUREMENT_CHAR_UUID = "00002a37-0000-1000-8000-00805f9b34fb"


# 数据处理回调
def handle_heart_rate_notification(sender,data: bytearray):
    """
    回调函数，解析来自 0x2A37 特征的通知数据.
    sender: 在 Windows 上是特征句柄 (handle), 其他平台可能是 0.
    data: 原始字节数据 (bytearray).
    """
    try:
        flags = data[0]
        hr_format_is_uint16 = (flags & 0x01)

        # 根据 Flag bit 0 解析心率值
        if hr_format_is_uint16:
            # UINT16 format, bytes 1 and 2, Little-Endian
            heart_rate_value = int.from_bytes(data[1:3], byteorder='little')
        else:
            # UINT8 format, byte 1
            heart_rate_value = data[1]

        print(f"Heart Rate: {heart_rate_value} bpm")

        # 可选: 解析 RR-Intervals (如果 Flag bit 4 被设置)
        # rr_interval_present = (flags >> 4) & 0x01
        # if rr_interval_present:
        #     offset = 3 if hr_format_is_uint16 else 2
        #     rr_intervals_ms = []
        #     while offset < len(data):
        #         rr_raw = int.from_bytes(data[offset:offset+2], byteorder='little')
        #         rr_intervals_ms.append(round((rr_raw / 1024.0) * 1000.0)) # Convert to ms
        #         offset += 2
        #     if rr_intervals_ms:
        #         print(f"  RR Intervals (ms): {rr_intervals_ms}")

    except IndexError:
        print(f"Error: Received incomplete data: {data.hex()}")
    except Exception as e:
        print(f"Error parsing HR data: {e}, Raw: {data.hex()}")


# 主异步任务
async def run_hr_monitor():
    print("Scanning for devices advertising Heart Rate Service...")
    # 1. 扫描: 使用 BleakScanner 查找广播了 HRS UUID 的设备
    try:
        device = await BleakScanner.find_device_by_filter(
            lambda d, ad: HEART_RATE_SERVICE_UUID.lower() in ad.service_uuids,
            timeout=10.0
        )
    except BleakError as e:
        print(f"Bluetooth scanning error: {e}")
        device = None  # Fallback or handle specific errors

    # 也可以使用 discover 获取列表供选择
    # devices = await BleakScanner.discover(service_uuids=[HEART_RATE_SERVICE_UUID], timeout=10.0)
    # ... (device selection logic) ...

    if device is None:
        print("No device advertising the Heart Rate Service found.")
        print("Ensure the device's HR broadcasting is enabled in its settings.")
        return

    print(f"Found device: {device.name} ({device.address})")
    print("Connecting...")

    # 2. 连接与交互: 使用 BleakClient
    async with BleakClient(device.address, timeout=20.0) as client:
        if not client.is_connected:
            print("Failed to connect.")
            return
        print("Connected successfully!")

        try:
            # 3. 订阅通知: 关键步骤
            print(f"Subscribing to Heart Rate Measurement notifications ({HEART_RATE_MEASUREMENT_CHAR_UUID})...")
            await client.start_notify(HEART_RATE_MEASUREMENT_CHAR_UUID, handle_heart_rate_notification)
            print("Subscription successful. Waiting for data... (Press Ctrl+C to stop)")

            # 保持运行以接收通知
            while client.is_connected:
                await asyncio.sleep(1.0)  # Keep event loop alive

        except BleakError as e:
            print(f"Bluetooth operation error: {e}")
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
        finally:
            # 4. 清理: 停止通知 (通常在 async with 退出时自动处理部分断连)
            if client.is_connected:
                try:
                    await client.stop_notify(HEART_RATE_MEASUREMENT_CHAR_UUID)
                    print("Notifications stopped.")
                except BleakError as e:
                    print(f"Error stopping notifications: {e}")


# 运行入口
if __name__ == "__main__":
    # 运行 asyncio 事件循环
    try:
        asyncio.run(run_hr_monitor())
    except KeyboardInterrupt:
        print("\nMonitoring stopped by user.")
    except Exception as e:
        # Catch potential top-level errors (e.g., asyncio issues)
        print(f"\nTop-level error: {e}")
