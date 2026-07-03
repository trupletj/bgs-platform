# Чат аппын UI-г native төрхтэй болгох (Expo SDK 54)

## Context (яагаад)

BGS mobile чат апп (Expo `~54.0.33`, RN `0.81.5`, expo-router `~6.0.23`) одоо ихэнх "chrome"-оо JS-ээр дуурайлгасан: tab bar нь **custom floating-pill** (`components/navigation/custom-tab-bar.tsx`, View+shadow), чат жагсаалтын header нь **custom View** (`components/chat/chat-header.tsx`, том гарчиг + Modal "+" цэс + inline SearchBar), icon бүгд `lucide-react-native`. Зорилго: платформын **native компонент** руу шилжүүлж, iOS-д (iOS 26 дээр автомат Liquid Glass), Android-д Material төрхтэй болгох.

**Хэрэглэгчийн шийдвэр (баталгаажсан):**
- **Build: Expo Go хэвээр** — `expo-glass-effect`/`@expo/ui` суулгахгүй (Expo Go дээр ажиллахгүй). ⇒ Тусдаа "Liquid Glass surface" phase-ийг **алгасна**.
- **Tab bar: NativeTabs** (OS-ийн native доод tab bar) — floating-pill төрх алга болохыг хүлээн зөвшөөрсөн.
- **Chat list header: native header** болгоно.

> **Чухал давуу тал:** NativeTabs + native header руу шилжсэнээр **iOS 26 төхөөрөмж дээр Liquid Glass автоматаар** ирнэ (native UITabBar/UINavigationBar OS-ийн түвшинд glass болдог) — Expo Go дээр ч expo-glass-effect-гүйгээр. Тиймээс glass-ийн зорилго native chrome-оор биеллээ олно.

## Шинжилгээний дүгнэлт — одоогийн native бус хэсгүүд (нөлөөгөөр эрэмбэлсэн)

1. **Tab bar** (`components/navigation/custom-tab-bar.tsx`) — хамгийн өндөр нөлөө. `<Tabs tabBar={...}>` (`app/(tabs)/_layout.tsx`) + lucide icon (`MessageCircle/Users/LayoutGrid/User`) + гар badge. → NativeTabs.
2. **Chat list header** (`components/chat/chat-header.tsx` + `app/(tabs)/index.tsx`) — том гарчиг + Modal dropdown "+" + inline SearchBar. → native header (`headerLargeTitle` + `headerSearchBarOptions` + `headerRight`).
3. **Icon-ууд** — бүгд lucide; platform-specific SF Symbol/Material хосгүй.
4. **Input bar safe-area** (`app/chat/[id].tsx`) — `paddingBottom: ios?24:14` гар тоо; edge-to-edge (Android) дээр `useSafeAreaInsets()` ашиглах нь зөв.
5. **Chat conversation header** — аль хэдийн native (`Stack.Screen`, transparent). Native хэвээр; зөвхөн icon хос (Phase 4) шалгана.

Аль хэдийн **зөв**: `react-native-safe-area-context` (deprecated RN SafeAreaView ашиглаагүй), `android.edgeToEdgeEnabled:true`, `@react-navigation/native` ThemeProvider-ийн `background:t.bg`, expo-symbols + reanimated суусан. **Дахин ашиглах:** `components/ui/icon-symbol.ios.tsx` (expo-symbols `SymbolView`) + `.tsx` (MaterialIcons fallback) бүхий `IconSymbol` компонент аль хэдийн байгаа → Phase 4-д ашиглана.

**Дашрамд анзаарсан (засах):** `app/_layout.tsx`-д `<StatusBar style="dark" />` нь theme-ээс хамаардаггүй (dark mode-д буруу) → `style={t.dark ? "light" : "dark"}`. `app.json`-д `userInterfaceStyle: "light"` нь OS appearance-ийг light-д хязгаарлана (NativeWind-ээр dark дэмждэг хэрнээ) — `DynamicColorIOS`/SF selected/glass tint зөв ажиллахын тулд `"automatic"` болгохыг авч үзэх.

## Гол файлууд

- `app/(tabs)/_layout.tsx` — Tabs → NativeTabs (Phase 1).
- `components/navigation/custom-tab-bar.tsx` — баталгаажсаны дараа устгана (Phase 1).
- `app/(tabs)/index.tsx` → нэстэд stack болгож native header (Phase 3); `components/chat/chat-header.tsx` хялбаршуулна/устгана.
- `app/chat/[id].tsx` — input bar safe-area (Phase 2), icon хос (Phase 4).
- `lib/theme.ts` / `hooks/use-theme.ts` — NativeTabs tint/color-д theme токен дахин ашиглана.
- Шинэ: `app/(tabs)/index/_layout.tsx` + `app/(tabs)/index/index.tsx` (Phase 3 нэстэд stack).

---

## Phase 1 — NativeTabs руу шилжих (хамгийн өндөр нөлөө)

**Өөрчлөх:** `app/(tabs)/_layout.tsx`-ийг бүхэлд нь дараах бүтэцтэй болгох (unstable API — баримтаас баталгаажсан):
```tsx
import { NativeTabs, Icon, Label, Badge, VectorIcon } from "expo-router/unstable-native-tabs";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Platform } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api"; import { queryKeys } from "@/lib/query-keys"; import { S } from "@/constants/strings";

export default function TabLayout() {
  const { data: threads } = useQuery({ queryKey: queryKeys.chat.threads, queryFn: api.getChatThreads });
  const unread = (threads ?? []).filter(th => !th.isOfficial && !th.muted).reduce((s, th) => s + (th.unread ?? 0), 0);
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>{S.tabs.chat}</Label>
        {Platform.select({
          ios: <Icon sf={{ default: "message", selected: "message.fill" }} />,
          android: <Icon src={<VectorIcon family={MaterialIcons} name="chat" />} />,
        })}
        {unread > 0 && <Badge>{unread > 99 ? "99+" : String(unread)}</Badge>}
      </NativeTabs.Trigger>
      {/* contacts: person.2 / "group"; mini-apps: square.grid.2x2 / "grid-view"; profile: person / "person" */}
    </NativeTabs>
  );
}
```
- **Android icon:** `drawable="..."` нь native drawable resource шаарддаг (prebuild) тул Expo Go-д тохиромжгүй. Оронд нь **`VectorIcon` + `@expo/vector-icons/MaterialIcons`** (Expo Go-д bundled) ашиглана. iOS=`sf` (SF Symbol).
- **Badge:** одоогийн `custom-tab-bar`-ийн unread логикийг (`!isOfficial && !muted`, нийт `unread`) **`lib/chat.ts` `unreadTotal(threads)`** туслах болгон гаргаж нэг эх сурвалжтай болгоно; layout-д тооцож `<Badge>` (зөвхөн >0 үед) болгоно. Глобал realtime invalidate (`_layout.tsx`) threads-ийг шинэчилдэг тул шууд ажиллана. `<Badge>` нь string тул "99+"-ийг JS-д форматлана.
- **Mapping:** `NativeTabs.Trigger name`-ийг **route нэрээр** (index/contacts/mini-apps/profile) тааруулна — одоогийн `TAB_ICONS`/`TAB_LABELS` массивын дараалал зөрүүтэй тул index-ээр БҮҮ тааруул.
- **Web:** NativeTabs-д web хэрэгжилт байхгүй — `app/_layout.tsx`-ийн web container урсгалыг шалгаж, шаардвал web-д тусад нь fallback (хуучин Tabs) гаргах.
- **Theming/тунгалаг "цагаан гэрэл" асуудал:** NativeTabs `style={{ tintColor: DynamicColorIOS({light:accent,dark:accent}) }}` (сонгогдсон icon=`accent`). ThemeProvider `background:t.bg` аль хэдийн тавьсан тул stack-ийн ард цагаан гэрэлтэхгүй — баталгаажуулна.
- **screenOptions:** одоогийн `Tabs`-ийн `headerShown:false` шаардлагагүй (NativeTabs-д header байхгүй); tab screen-үүдийн дотоод header (Phase 3-аас бусад нь) хэвээр.

**Тест:** Expo Go дээр 4 tab гарч ирэх, сонголт/шилжилт ажиллах, Chat tab дээр unread badge зөв; шинэ мессеж ирэхэд badge шинэчлэгдэх (глобал realtime). iOS 26 төхөөрөмж дээр tab bar glass харагдана.

**Эрсдэл:** (1) **NativeTabs нь SDK 54-д alpha (unstable)** — API өөрчлөгдөж болзошгүй; syntax-ыг docs-оос л авна. (2) **Expo Go дээр render хийхгүй байх эрсдэл** — энэ нь хамгийн эхний шалгах зүйл; хэрэв ажиллахгүй бол custom-tab-bar-ийг түр сэргээх (тийм учраас эхэндээ **устгахгүй**, баталгаажсаны дараа устгана). (3) `Tabs.Screen name` ↔ `NativeTabs.Trigger name` файл нэр (index/contacts/mini-apps/profile)-тэй яг таарах ёстой.

---

## Phase 2 — SafeArea + edge-to-edge audit (Android заавал)

**Өөрчлөх:**
- `app/chat/[id].tsx` input bar (ба official read-only мөр): `paddingBottom: Platform.OS==="ios"?24:14` → `useSafeAreaInsets()`-ийн `insets.bottom`-д суурилсан (`Math.max(insets.bottom, 12)` маягаар). Edge-to-edge (Android 16, default-оор ON) дээр gesture-nav зайг зөв авна.
- NativeTabs нь өөрийн доод inset-ийг native-аар зохицуулдаг тул tab доторх дэлгэцүүдээс **гар bottom padding/`edges`-ийг** (хуучин floating-pill-д зориулсан зайг) хасах эсэхийг шалгах.
- `SafeAreaView edges={["top"]}` ашиглаж буй tab дэлгэцүүд (`contacts.tsx`, `mini-apps.tsx`, `profile.tsx`) хэвээр зөв; chat list нь Phase 3-д native header авах тул тэндээс `SafeAreaView` top-ийг хасна.

**Тест:** Android emulator (gesture nav) + iOS дээр: контент status/nav bar-аар халхлагдахгүй, input bar gesture зураасны дээр, tab дэлгэцийн доод хэсэг native tab bar-аар тасрахгүй.

**Эрсдэл:** Бага. NativeTabs inset-ийг давхар тооцвол доод зай хэт том болж болзошгүй — нэг бүрчлэн шалгана.

---

## Phase 3 — Chat list-ийг native header болгох

> (Анхны төлөвлөгөөний "Liquid Glass" phase-ийг хэрэглэгч Expo Go сонгосон тул **орхиж**, оронд нь native header-ийг энд хийнэ.)

**Бүтэц:** NativeTabs-ийн tab дотор native header авахын тулд тухайн tab-ийг **нэстэд Stack** болгоно:
- `app/(tabs)/index.tsx` → `app/(tabs)/index/_layout.tsx` (`<Stack/>`) + `app/(tabs)/index/index.tsx` (жагсаалтын дэлгэц). Маршрут `/(tabs)` default tab хэвээр тул deep-link эвдрэхгүй.
- Жагсаалтын дэлгэцэд:
```tsx
<Stack.Screen options={{
  title: S.chat.title,
  headerLargeTitle: true,                       // iOS том гарчиг (native)
  headerSearchBarOptions: { placeholder: S.chat.search, onChangeText: e => setSearch(e.nativeEvent.text) },
  headerRight: () => <Pressable onPress={() => setMenuOpen(true)}><Plus .../></Pressable>,
}} />
```
- `components/chat/chat-header.tsx`-ийн **inline SearchBar-ийг native `headerSearchBarOptions`-оор** солино; одоогийн `search` state + шүүлтийг дахин ашиглана. "+" цэсийг (одоогийн Modal dropdown) `headerRight`-аас нээнэ — Modal-ийг хэвээр үлдээж болно, эсвэл хожим native menu болгоно. chat-header.tsx-ийг хялбаршуулна эсвэл устгана.
- `headerSearchBarOptions` ба `headerLargeTitle` нь `react-native-screens`-ийн native (Expo Go-д bundled). iOS 26 дээр header glass автомат.

**Тест:** Чат tab дээр native том гарчиг + native search bar (доош гүйлгэхэд жижгэрэх), "+" → шинэ чат/бүлэг/discover цэс ажиллах, хайлт шүүх. Android дээр Material header.

**Эрсдэл:** Маршрут нэстэд stack болгох нь хамгийн "том" өөрчлөлт — `router.push("/(tabs)")` болон Chat tab руу буцах урсгалыг шалгах. `headerSearchBarOptions` зан төлөв iOS/Android өөр — хоёуланд тест. (Хэрэв нэстэд stack эрсдэлтэй бол энэ phase-ийг tab-аас үл хамааран chat list-ийн polished custom header болгож бууруулж болно — fallback.)

---

## Phase 4 — Icon хос (SF Symbol ↔ Material) эцэслэх

**Tab icon (Phase 1-д):** Chat `message`/`message.fill` ↔ `chat`; Contacts `person.2`/`person.2.fill` ↔ `group`; Mini-apps `square.grid.2x2`/`.fill` ↔ `grid-view`; Profile `person`/`person.fill` ↔ `person`. (default/selected SF хос tab-д хэрэгтэй.)

**Дэлгэц доторх control:** header "+", input attach(`Plus`)/send(`Send`), мессежийн `Check/CheckCheck/FileText/AlertCircle/Megaphone` — эдгээрийг **lucide хэвээр** үлдээх нь Expo Go-д найдвартай, cross-platform. Сонголтоор iOS дээр илүү native харагдуулахыг хүсвэл **одоо байгаа `components/ui/icon-symbol.ios.tsx`/`.tsx` (`IconSymbol`)** компонентыг (iOS=expo-symbols, Android=MaterialIcons) дахин ашиглана — шинээр бичих шаардлагагүй. Зөвлөмж: NativeTabs дотор `sf`/`VectorIcon`, бусад control-д lucide-г хэвээр үлдээж энгийн байлгах.

**Жишээ хос (default→selected зөвхөн tab-д):** Back SF `chevron.backward`/lucide `ChevronLeft`; Send `arrow.up.circle.fill`/`Send`; Attach `plus`/`Plus`; зураг `photo`/`ImagePlus`; файл `doc`/`FileText`; "+" цэс: шинэ чат `square.and.pencil`/`MessageSquarePlus`, бүлэг `person.2.badge.plus`/`Users`, discover `safari`/`Compass`, scan `qrcode`/`QrCode`; official `megaphone`/`Megaphone`. Receipt `Check/CheckCheck` нь lucide хэвээр.

**Гаргалт:** tab + гол control бүрийн SF↔Material/lucide хос бүхий жижиг хүснэгт (хэрэгжүүлэхэд лавлах).

**Эрсдэл:** SF Symbol нэр iOS хувилбараас хамаарна — байхгүй symbol хоосон гарна; нэр бүрийг шалгах.

---

## Phase 5 — Build тохиргоо (Expo Go горим)

- Хэрэглэгч **Expo Go** сонгосон тул одоо `eas.json`/`expo-dev-client` **нэмэхгүй**.
- **Баталгаажуулах:** NativeTabs, `headerLargeTitle`, `headerSearchBarOptions`, `VectorIcon`, `expo-symbols` бүгд **Expo Go (SDK 54)** дээр ажиллана (expo-router + react-native-screens + @expo/vector-icons bundled). Phase 1-ийн эхний тест яг үүнийг шалгана.
- **Ирээдүй (сонголт):** Жинхэнэ bespoke Liquid Glass surface (expo-glass-effect/@expo/ui) хэрэгтэй бол **development build** (eas.json + expo-dev-client) + iOS 26 glass-д **Xcode 26** (EAS SDK 54 default) шаардлагатай. Гэхдээ native tab/header нь iOS 26 төхөөрөмж дээр glass-ийг аль хэдийн автоматаар өгнө.

---

## Хэрэгжүүлэх эрэмбэ ба хамаарал

1. **Phase 1 (NativeTabs)** — эхэнд. Эхний ажиллагааг Expo Go дээр баталгаажуулж байж custom-tab-bar-ийг устгана.
2. **Phase 2 (safe-area audit)** — Phase 1-ийн дараа (native tab bar inset-ийг өөрчилдөг тул).
3. **Phase 3 (native chat list header)** — Phase 1-ийн дараа (tab бүтэц тогтсоны дараа нэстэд stack).
4. **Phase 4 (icon хос)** — Phase 1/3-ийн icon-уудыг эцэслэнэ.
5. **Phase 5 (build шалгалт)** — тасралтгүй, бүх phase Expo Go-д тестлэгдэнэ.

Бүх phase бие даан тестлэгдэх ба одоогийн ажиллагаа (чат, theme солих, unread badge, `/chat/[id]`, `/chat/user/[id]`, group дэлгэцүүд) эвдрэхгүй байх.

## Verification (нийт)

- Алхам бүрийн дараа: `cd apps/mobile && npx tsc --noEmit && npx eslint app components lib`.
- **Expo Go** (iOS + Android): `npm start` → tab шилжилт, unread badge, native search/large-title (Phase 3), input bar safe-area (Phase 2), бүх чат урсгал.
- iOS 26 төхөөрөмж дээр (боломжтой бол): native tab bar/header Liquid Glass автоматаар.
- NativeTabs Expo Go-д render хийхгүй бол → custom-tab-bar fallback эсвэл dev build шийдвэр рүү буцах.
