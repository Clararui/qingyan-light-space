// 相对资源路径兼容 GitHub Pages 仓库子目录。
export const CONFIG = {
  brand: '轻颜相机',
  portraits: [
    {src:'./hero.webp', title:'光的侧面'},
    {src:'./portrait-1.webp', title:'风中的你'},
    {src:'./portrait-2.webp', title:'日光漫游'},
    {src:'./portrait-3.webp', title:'城市光影'},
    {src:'./portrait-4.webp', title:'此刻自在'},
    {src:'./portrait-5.webp', title:'同一束光'},
    {src:'./portrait-6.webp', title:'风与光'},
  ],
  // 桌面保留完整画廊与后处理；移动端减少几何数量与像素密度。
  quality: {desktopPixelRatio:1.65, mobilePixelRatio:1.25, desktopGallery:28, mobileGallery:16},
};
