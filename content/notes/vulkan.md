---
title: Vulkan
date: 2025-01-13
---

# Vulkan

## Startup

VkInstance -> VkPhysicalDevice -> VKDevice

**VkInstance** for validation layers, extensions, and loggers. Usually only
one will suffice for most applications. Extensions can slow down the driver
so only enable neccessary ones.

**VkPhysicalDevice** represents GPUs queried by VkInstance. No communication
is allowed yet.

**VKDevice** is gained from VkPhysicalDevice and is used to communicate 
with the GPU. Most Vulkan commands require this.

Vulkan allows manual multi-GPU configuration, multiple VKDevice can be
made and assigned commands.

Swapchain is optional (headless applications) and is the main way
to present an image to the screen. They are internally lists of images
but typically 2 or 3 are used for double or triple buffering.
Present modes:
    * VK_PRESENT_MODE_IMMEDIATE_KHR 
    * VK_PRESENT_MODE_FIFO_KHR
    * VK_PRESENT_MODE_FIFO_RELAXED_KHR
    * VK_PRESENT_MODE_MAILBOX_KHR

## Commands and Queues

VkCommandBuffer is created from VkCommandPool
Record VkCmds into the VkCommandBuffer.
Then submit the buffer into a VkQueue.

Command records are cheaps while submitting them are not (VkQueueSubmit).
Multithreaded code will have a VkCommandPool and VkCommandBuffer each thread
and submit commands one at a time (VkQueueSubmit is not threadsafe)

Queues can have a different family, dictating the type of queue and supported
commands.

NOTE: Transfer-only queues are great for loading assets.
Lifecycle: 
https://registry.khronos.org/vulkan/specs/1.2-extensions/html/chap6.html#commandbuffers-lifecycle

## Renderpass

Renderpasses are the main ways, besides compute commands to render to the screen.
Renderpassees are made of subpasses, which are useful on mobile GPUs to optimize
work out. On desktop, this is not much of an advantage, but there must be at 
least one subpass in a renderpass.

Renderpasses will render into a framebuffer, which links the images to be 
rendered to.

Image layouts dictate the state of images, as we have no control over how
GPUs manipulate image layouts during processing. 
There are four layouts:
    * VK_IMAGE_LAYOUT_UNDEFINED
    * VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL (rendering commands)
    * VK_IMAGE_LAYOUT_PRESENT_SRC_KHR (rendering to screen)
    * VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL (reading from shaders)
