# bgs-platform

BGS платформын монорепо. Turborepo + pnpm workspaces.

## Бүтэц

```
apps/
  mobile/        # Expo SDK 54 React Native + web (bgs-mobile-app)
  attendance/    # Next.js 16 mini-app (bgs-attendance)
packages/
  (хуваалцсан пакетууд ирээдүйд)
```

## Заавар

```bash
pnpm install              # бүх workspace-ыг суулгах
pnpm dev                  # бүх app-ыг dev mode-д ажиллуулах
pnpm --filter mobile dev  # зөвхөн mobile app
pnpm --filter attendance dev

pnpm build                # бүх app-г build хийх
```

## Шинэ mini-app нэмэх

1. `apps/<нэр>/` хавтас үүсгэх.
2. `package.json`-д `"name": "<нэр>"` тохируулна (workspace filter ингэснээр ажиллана).
3. Vercel дээр шинэ project үүсгэхдээ Root Directory-г `apps/<нэр>` болгож тохируулна.
