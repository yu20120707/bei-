# Design

## Direction

一个安静的书桌学习工具：纯白背景，深色文字，琥珀色仅用于当前进度和主要操作。

## Color Tokens

```css
:root {
  --bg: oklch(1 0 0);
  --surface: oklch(0.975 0.004 91);
  --ink: oklch(0.22 0.02 80);
  --muted: oklch(0.52 0.02 80);
  --primary: oklch(0.58 0.15 91);
  --accent: oklch(0.31 0.10 260);
  --danger: oklch(0.55 0.18 28);
}
```

## Type and Components

Use the system sans-serif stack. The English prompt is the single oversized element. Options are equal, quiet rectangular buttons; feedback changes the chosen button only. Motion is limited to a short opacity transition and disabled under reduced-motion preferences.
