# Roidmi EVE Plus (roidmi.vacuum.v60) – hardveres mentés és Valetudo bring-up

**Státusz:** kutatási eljárás, nem telepítési vagy rootolási útmutató; konkrét készüléken nem validált.
**Cél:** az eredeti rendszer megőrzésével olvasható hozzáférés, teljes mentés, majd offline helyi vezérlés.

## Mit tudunk ténylegesen?

- A robot LAN-on válaszolt a MIoT UDP/54321 hello-ra, de az eddig mentett AP-tokenekkel a hitelesített LAN RPC timeoutolt.
- Párosítási AP-n a `miIO.info` titkosított, hitelesített választ adott; `get_properties` visszatért -30015 kóddal.
- A Valetudo-ban elkészült egy kísérleti V60 MIoT driver. Ez még nem firmware és nem oldja meg a rootot.
- Kereskedelmi cserealkatrész-katalógusban szerepel egy **CP_LD03 Rev:2.3** Roidmi EVE Plus Wi-Fi panel; más révíziók létezhetnek.
- Az orosz 4PDA fórumon EVE Plus UART-ról, illetve Xclea H30 rokon hardvernél Rockchip/USB kiolvasásról írnak. Ez utóbbi módszer **nem validált** erre a konkrét V60 robotra.

Források:
- https://www.ep-mediastore-ab.de/roidmi-eve-plus-wifi-board-p-66959.html
- https://4pda.to/forum/index.php?showtopic=1023628&st=3560
- https://4pda.to/forum/index.php?showtopic=1055039&st=260
- https://valetudo.cloud/pages/rooting-essentials/

## 0. Ideiglenes takarítás

A robot tetején a Power rövid megnyomása általában teljes takarítást indít, a dokkológomb hazaküldi.
Ha a fizikai gomb sem indít, azt külön hardver-/hibakódként vizsgáljuk, nem felhőhibaként kezeljük.

## 1. Kötelező biztonság

- A dokkolót húzd ki a konnektorból, robotot kapcsold ki, vedd ki a portartályt és a víztartályt.
- Bontáskor fényképezd a csatlakozókat és csavarokat; amint hozzáférhető, az akkumulátor csatlakozóját bontsd meg.
- Ne szúrd ki, ne nyomd össze és ne rövidzárasítsd a Li-ion akkumulátort. Ne dolgozz a dokkoló hálózati tápegységén.
- A belső panelen lehet **1,8 V**, **3,3 V** vagy más logikai feszültség. Mérj, ne feltételezz.
- A **5 V-os Arduino Uno/Nano UART lábait ne csatlakoztasd közvetlenül**. Legjobb egy 1,8/3,3 V-képes USB–TTL adapter (CP2102, FT232, CH340 csak megfelelő logikai szinttel).
- Ismeretlen UART/táp padra NE adj 5 V-ot vagy 3,3 V-ot. VCC vezeték soha nem kell a fogadó diagnosztikához.
- Ne kösd össze ismeretlen testpontokat, ne törölj és ne írj bootloadert.

## 2. Első hardverazonosítás – áramtalanítva

1. Fotó az egész belsőről és minden panelről, mindkét oldalról, különösen a Wi-Fi/algoritmuspanelről.
2. Feliratok: PCB revízió, CPU/SoC azonosító, flash/eMMC jelölés, esetleges `TX`, `RX`, `GND`, `UART`, `USB` és `TP` tesztpontok.
3. Multiméterrel azonosítható GND folytonosság, de ezt kizárólag **áramtalanítva** végezd.
4. Ezután – ha az eszközt biztonságosan újra lehet táplálni – a feltételezett TX pad üresjárati feszültsége mérhető a GND-hez képest. **1,8 V-os UART-hoz 1,8 V-kompatibilis vevő szükséges.**

Addig se USB, se UART, se ismeretlen jumper módosítás!

## 3. Első UART-bootlog (csak fogadás, nincs írás)

**Csak akkor**, ha a panelt és a GND/TX pontokat már konkrétan azonosítottuk.

Kötés:

```
Robot GND -------- USB–TTL GND
Robot TX  -------- USB–TTL RX
Robot RX          NINCS BEKÖTVE
USB–TTL TX        NINCS BEKÖTVE
USB–TTL VCC       NINCS BEKÖTVE
```

Windows PowerShell:

```powershell
py -m pip install pyserial
py tools/roidmi_uart_capture.py --port COM5 --baud 115200 --seconds 90 --out roidmi_boot_115200.bin
```

A `COM5` csak példa. Indítsd a rögzítést, majd a robotot; ha a robot biztonságosan működtethető bontott állapotban. A program kizárólag **RX-oldalon olvas**. Nem resetel, nem küld parancsot, nem flash-el.

Ha nincs adat, előbb a kábelt és a robot bootolását ellenőrizd. Hibás karaktereknél lehet más baud, de ne találgassunk százasával. A napló személyes eszközazonosítókat vagy kulcsokat is tartalmazhat: megosztás előtt ellenőrizd/redaktáld.

## 4. USB / Rockchip (csak azonosítás után!)

Ha a chipfelirat vagy a bootlog Rockchip SoC-ot igazol, és a panelen bizonyított USB-recovery csatlakozás van:

1. Először csak USB-eszközazonosítás (VID/PID, például Rockchip `2207:...`).
2. Ha elérhető az eszköz olvasási módja, **az összes partíció mentése** és SHA-256 hash; legalább két ellenőrzött mentés.
3. Bootloader, `misc`, factory/identity/calibration, Wi-Fi kulcsok, MCU és SLAM adatok külön megőrzése.
4. Eddig kizárólag olvasási utasítások. **Nem** használunk `erase`, `write`, `flash`, `upgrade` műveletet.

Az Xclea H30 fórumleírásai nem bizonyítják, hogy az EVE Plusod ugyanolyan alaplapot vagy bootloadert használ!

## 5. Root után (még nem tartunk itt)

- Teljes, visszaállítható gyári image és kalibráció megőrzése.
- CPU architektúra, libc és tárhely, kernel, processzek, miIO-konfiguráció ellenőrzése.
- Tokent és cloud key-t csak helyben, titokként kezelni, nem commitolni GitHubra.
- Előbb bizonyított helyi status + takarítás/dokkolás; aztán térkép bináris mintája és dekódolása.
- Valetudo Roidmi-adapter kiegészítése csak ténylegesen tesztelt funkcionalitással.

## Még kell a konkrét eszközről

- Panel mindkét oldalának jó minőségű fotója, csipfeliratok élesen.
- Arduino típusa (Uno/Nano/Mega/ESP32 stb.) és rendelkezésre álló multiméter / USB–TTL adapter.
- A robot fizikai Power gombbal elindul-e, ad-e hangos hibakódot.

**Ne tedd fel másik robot teljes firmware-ét; az nem kompatibilis a Roidmi szenzor- és MCU-kalibrációival.**
