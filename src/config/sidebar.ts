// 侧边栏偏好的 localStorage 键：服务端内联脚本与客户端 AppShell 共用，
// 不能放在 'use client' 模块里，否则服务端拿到的是客户端引用而不是字符串
export const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed';
export const SIDEBAR_WIDTH_KEY = 'sidebar_width';
