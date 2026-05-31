+++
title = "STM32 USB Mass Storage Device"
date = 2026-05-24
updated= 2026-05-28
+++

This will make your STM32 show up as a disk when plugged into a device over USB. Enable it through the IOC under the middleware section. It will then generate a file with the following functions which you have to implement

```c
int8_t STORAGE_Init(uint8_t lun);
int8_t STORAGE_GetCapacity(uint8_t lun, uint32_t *block_num, uint16_t *block_size);
int8_t STORAGE_IsReady(uint8_t lun);
int8_t STORAGE_IsWriteProtected(uint8_t lun);
int8_t STORAGE_Read(uint8_t lun, uint8_t *buf, uint32_t blk_addr, uint16_t blk_len);
int8_t STORAGE_Write(uint8_t lun, uint8_t *buf, uint32_t blk_addr, uint16_t blk_len);
int8_t STORAGE_GetMaxLun(void);
```

Check in the IOC for settings related to max blocksize buffer or max byte blocksize descriptor size. It is probably set to 512 bytes which is quite small. You can up this if desired. You can use the flash driver code to implement `STORAGE_Read` and `STORAGE_Write`.

References:

<https://stackoverflow.com/questions/44499101/flash-memory-as-mass-storage-device-using-stm32-usb-device-library>
