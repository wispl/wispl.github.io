---
title: Wayland
date: 2025-01-13
---

# Wayland

Some wayland notes for me

## Design and Terminology

Seats are generally input devices: mices, touchscreens, touchpads, etc...

The **Wayland Compositor** manages and dispatches input events from
seats to **Wayland Clients**.
The Compositor also renders and places the windows onto the screen, a
process called **compositing**.

### Hardware and Kernel

Hardware can only be accessed by the kernel:

    * DRM (direct rendering manager) is used to issue commands to the GPU.
    * KMS (kernel mode setting) is used to query for these devices.
    * evdev abstracts access to input devices

DRM:

    * /dev/dri/card*   : priviledged actions like modesetting
    * /dev/dri/render* : unpriviledged actions like rendering

evdev:

    input events through /dev/input/event*

### Userspace

DRM        -> libdrm
Mesa       -> OpenGL, Vulkan, and GBM (Generic Buffer Management)
libinput   -> evdev (requires priviledged access)
(e)udev    -> enumeration and reporting of new devices
xkbcommon  -> scancodes into key "symbols" and state machine for modifiers
pixman     -> pixel manipulation (buffers, math, etc...)
libwayland -> implementation of wayland protocol
and more...

## Protocol
