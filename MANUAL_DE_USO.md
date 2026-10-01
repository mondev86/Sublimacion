# Manual de Operación y Taller: SubliDTF Studio Pro 📘👕

Bienvenido al manual operativo de **SubliDTF Studio Pro**, la herramienta definitiva para preparar artes, maximizar el aprovechamiento de materiales, validar diseños con tus clientes y gestionar la producción en tu taller de **DTF (Direct to Film)** y **Sublimación**.

---

## Índice
1. [Módulo 1: Preparador de Arte DTF & Sublimación](#1-módulo-1-preparador-de-arte-dtf--sublimación)
   - [Eliminación de Fondos y Edge Choke (Sangrado Negativo)](#eliminación-de-fondos-y-edge-choke)
   - [Tramas de Semitonos (Halftones)](#tramas-de-semitonos-halftones)
   - [Calado Artístico (Knockout de Tela)](#calado-artístico-knockout-de-tela)
   - [Resolución y Optimizador 300 DPI](#resolución-y-optimizador-300-dpi)
   - [Posicionamiento Textil con Regla de Centrado](#posicionamiento-textil-con-regla-de-centrado)
   - [Auditoría con Inteligencia Artificial](#auditoría-con-inteligencia-artificial)
2. [Módulo 2: Armado de Pliegos (Gang Sheet / Nesting)](#2-módulo-2-armado-de-pliegos-gang-sheet--nesting)
   - [Configuración de Bobina o Lámina](#configuración-de-bobina-o-lámina)
   - [Auto-Nesting Inteligente](#auto-nesting-inteligente)
   - [Líneas de Corte y Modo Espejo](#líneas-de-corte-y-modo-espejo)
   - [Métricas de Costo y Exportación](#métricas-de-costo-y-exportación)
3. [Módulo 3: Previsualizador con Realidad Aumentada (AR)](#3-módulo-3-previsualizador-con-realidad-aumentada-ar)
   - [Modo Cámara en Tiempo Real (AR)](#modo-cámara-en-tiempo-real-ar)
   - [Modo Estudio Fotorrealista](#modo-estudio-fotorrealista)
   - [Generación de Muestras de Validación para WhatsApp](#muestras-de-validación-para-whatsapp)
4. [Módulo 4: Gestión de Pedidos de Taller](#4-módulo-4-gestión-de-pedidos-de-taller)
   - [Flujo de Estados](#flujo-de-estados)
   - [Ficha Técnica de Termoestampado](#ficha-técnica-de-termoestampado)
5. [Módulo 5: Control de Insumos & Calculadora de Costos](#5-módulo-5-control-de-insumos--calculadora-de-costos)
   - [Monitoreo de Stock Crítico](#monitoreo-de-stock-crítico)
   - [Calculadora de Márgenes y Ganancia Neta](#calculadora-de-márgenes-y-ganancia-neta)
6. [Tabla Maestra de Parámetros de Plancha Térmica](#tabla-maestra-de-parámetros-de-plancha-térmica)

---

## 1. Módulo 1: Preparador de Arte DTF & Sublimación

Este módulo resuelve los 5 problemas más comunes que provocan estampas defectuosas o quejas de clientes: bordes blancos desfasados, estampas acartonadas tipo "parche", baja resolución y estampas torcidas.

### Eliminación de Fondos y Edge Choke
- **Quitar Fondo por Color**: Si tu cliente te envió un logo con fondo blanco o negro, selecciónalo en la pestaña **Bordes** y ajusta la tolerancia (habitual: 15% a 25%).
- **¿Qué es el Edge Choke (Contracción de Borde) y por qué es vital en DTF?**:
  - En la técnica DTF, la impresora deposita primero las tintas de color (CMYK) y encima imprime una capa blanca de respaldo (*White Underbase*).
  - Al transferir con calor, si la base blanca tiene exactamente el mismo tamaño que el color, se produce un halo o filete blanco visible y antiestético alrededor del diseño.
  - El **Edge Choke** contrae la máscara entre **1.0 y 2.0 píxeles** hacia adentro, asegurando que la base blanca quede completamente escondida debajo del color.

### Tramas de Semitonos (Halftones)
Los degradados continuos en DTF suelen generar depósitos gruesos de poliamida adhesiva que se sienten duros al tacto.
- Activa la pestaña **Semitonos** con un clic.
- **Tipos de Trama**:
  - **Puntos Circulares / Elípticos**: Emula la serigrafía tradicional.
  - **Líneas de Trama**: Ideal para estética retro/grabado.
  - **Difusión Estocástica (Floyd-Steinberg)**: Distribución orgánica de micropuntos, perfecta para fotografías y sombras complejas.
- **Frecuencia LPI recomendada**:
  - `30 LPI`: Efecto póster / puntos visibles.
  - `45 LPI`: **Estándar recomendado para DTF textil**.
  - `55-60 LPI`: Alta definición para prendas finas o trazos milimétricos.
- **Huecos transparentes para tela**: Al marcar esta casilla, las zonas oscuras se convierten en perforaciones reales, permitiendo que la propia tela negra o azul complete el degradado. Esto **ahorra hasta 40% de tinta blanca** y brinda un tacto extrasuave.

### Calado Artístico (Knockout de Tela)
- Si vas a estampar sobre una remera negra y el diseño tiene sombras o fondos negros, activa la pestaña **Calado**.
- El sistema remueve selectivamente el color negro del archivo con un degradado suave (*Feather*).
- **Resultado**: La estampa no pesará en el pecho, no transpirará ni se acartonará al doblar la prenda.

### Resolución y Optimizador 300 DPI
- Coloca las medidas reales que tendrá la estampa en la prenda (ej. `28 cm ancho x 32 cm alto`).
- El semáforo de DPI te indicará el estado:
  - 🟢 **>280 DPI**: Óptimo para imprenta comercial.
  - 🟡 **180 - 280 DPI**: Aceptable para líneas gruesas o fotos sin texto pequeño.
  - 🔴 **<180 DPI**: Riesgo de pixelado o bordes dentados.
- Presiona **"Ampliar y Enfocar a 300 DPI"** para aplicar super-resolución bicúbica con máscara de enfoque no lineal, dejando los textos y trazos afilados.

### Posicionamiento Textil con Regla de Centrado
Haz clic en el modo **"En Prenda & Regla"** en la barra superior o en la pestaña **"Posición"**:
1. **Regla de los Dedos (Distancia desde la costura inferior del cuello)**:
   - **3 a 4 dedos (~7.5 a 8 cm)**: Medida estándar universal para estampa de **Pecho Central** en adultos.
   - **2 a 3 dedos (~5 cm)**: Para cortes altos o remeras juveniles/femeninas.
   - **Bolsillo / Pecho Izquierdo**: Bajar 8.5 a 9.5 cm desde la costura y desplazar 9.5 cm hacia la izquierda del eje central.
   - **Espalda Alta**: Ubicar a 5 cm debajo del cuello trasero.
2. **Eje Central Láser**:
   - Una línea vertical te marca el centro del pecho para alinear el doblado central del film con el centro del cuello.
3. **Selector de Talle (S, M, L, XL, XXL)**:
   - Al cambiar de talle, la remera ajusta su ancho real de sisa (desde 48 cm en S hasta 64 cm en XXL) y calcula el porcentaje de ocupación frontal para que sepas si el diseño se verá muy chico en un talle grande o desbordado en un talle chico.
4. **Arrastre interactivo**:
   - Puedes arrastrar el diseño con el mouse directamente sobre la remera para ubicarlo visualmente.

### Auditoría con Inteligencia Artificial
- Haz clic en **"Auditar Archivo con IA"** en la pestaña **IA Advisor**.
- El modelo analiza el diseño y genera un informe con:
  - Aptitud técnica para la tela elegida.
  - Alerta de semitransparencias que puedan retener poliamida no deseada.
  - Receta térmica recomendada (temperatura, tiempo y presión).

---

## 2. Módulo 2: Armado de Pliegos (Gang Sheet / Nesting)

El armado de pliegos te permite juntar múltiples pedidos o diseños en una misma bobina para ahorrar metros lineales de film y maximizar tu ganancia.

### Configuración de Bobina o Lámina
En el menú superior selecciona tu formato habitual:
- **Rollo DTF 30 cm x 100 cm** (estándar 1 metro lineal).
- **Rollo DTF 30 cm x 50 cm** (medio metro).
- **Rollo DTF 60 cm x 100 cm** (bobina ancha para plotters dobles).
- **Láminas A3 (29.7 x 42 cm)**, **A3+** o **A4**.

### Auto-Nesting Inteligente
- Si tienes 5 logos de pecho, 2 espaldas grandes y 4 estampas para mangas, agrégalos a la lista.
- Haz clic en el botón **"Auto-Nesting IA"**.
- El algoritmo organizará automáticamente los diseños por altura, evaluando si rotarlos a 90° para que encajen lado a lado, respetando el margen de seguridad y el espaciado entre cortes.

### Líneas de Corte y Modo Espejo
- **Guías de Corte (Tijera/Guillotina)**: Genera líneas punteadas suaves alrededor de cada estampa. Al salir de la impresora o el horno, el operario corta con tijera en segundos sin tocar el diseño.
- **Espejado (Mirror All)**:
  - **Obligatorio** en sublimación textil, tazas y DTF tradicional.
  - Al pulsar el botón, todo el pliego se espeja horizontalmente listo para el RIP.

### Métricas de Costo y Exportación
En la barra inferior verás en tiempo real:
- **Aprovechamiento**: Porcentaje del film utilizado (apunta siempre a >80%).
- **Metros Lineales Reales**: Metros de film que debes cortar de la bobina.
- **Costo de Insumos**: Cálculo automático de film + tintas CMYK/W + poliamida.
- **Precio Sugerido de Venta**: Estimación con margen de ganancia estándar.
- **Exportar Pliego 300 DPI**: Descarga el archivo PNG transparente con resolución nativa de 300 DPI listo para enviar a AcroRIP, CADlink o tu software de impresión.

---

## 3. Módulo 3: Previsualizador con Realidad Aumentada (AR)

Evita reclamos del cliente permitiéndole ver cómo quedará su prenda antes de imprimir.

### Modo Cámara en Tiempo Real (AR)
1. Selecciona la pestaña **"Previsualizador AR"** y activa **"Cámara en Tiempo Real"**.
2. Otorga permiso a la cámara de tu celular, laptop o webcam.
3. Apunta a la persona vestida con una remera o a una prenda colgada en un perchero.
4. El diseño se superpondrá sobre la tela en vivo.
5. Puedes ajustar el tamaño, rotación e inclinación para coincidir con la postura de la persona.
6. El modo de fusión **"Multiplicar"** hace que las arrugas, pliegues y sombras de la remera atraviesen el diseño, logrando un realismo total.

### Modo Estudio Fotorrealista
- Permite simular sobre remeras con textura real de algodón peinado.
- Cambia el color de la prenda con los botones inferiores (Negro Carbón, Blanco Óptico, Azul Marino, Bordó, Gris Jaspeado, Verde Militar, etc.).
- Activa la **Regla & Láser** para mostrar la distancia desde el cuello en centímetros.

### Muestras de Validación para WhatsApp
- Haz clic en **"Tomar Foto Validación"**.
- Se capturará una imagen en alta definición con una franja institucional inferior que indica:
  - *Muestra Aprobada para Estampado - SubliDTF Studio Pro*.
  - Fecha del pedido y dimensiones aprobadas.
- Presiona **"Descargar Validación"** y envíala por WhatsApp al cliente para tener su confirmación por escrito antes de encender la plancha.

---

## 4. Módulo 4: Gestión de Pedidos de Taller

Mantén el orden de tus trabajos evitando confusiones de talles, colores o fechas de entrega.

### Flujo de Estados
Cada pedido transita por 5 etapas claramente diferenciadas:
1. **Presupuesto**: Cotización enviada al cliente.
2. **En Diseño**: Ajustando arte, semitonos o esperando validación por foto.
3. **En Cola de Impresión**: Pliego listo para enviar al plotter DTF o impresora de sublimación.
4. **Estampado**: Prenda planchada y en control de calidad.
5. **Entregado**: Pedido cobrado y retirado por el cliente.

### Ficha Técnica de Termoestampado
- Al hacer clic en el ícono de documento en cualquier pedido, se abre la **Ficha Técnica de Producción**.
- Incluye el resumen del cliente, cantidades por talle y el recuadro con los **parámetros exactos de temperatura, tiempo y tipo de despegue**.
- Puedes imprimirla con el botón **"Imprimir Ficha"** para pegarla con cinta térmica junto a la plancha de estampado.
- Cuenta con botón de **Notificación por WhatsApp** con un mensaje pre-armado indicando saldo pendiente y estado del pedido.

---

## 5. Módulo 5: Control de Insumos & Calculadora de Costos

### Monitoreo de Stock Crítico
Controla tus 6 insumos principales:
- **Bobinas de Film DTF** (metros lineales restantes).
- **Tinta Blanca DTF** (el insumo más crítico; te alerta cuando baja de 500 ml).
- **Tintas CMYK** (ml disponibles).
- **Polvo Poliamida Adhesivo** (kg restantes).
- **Papel de Sublimación** (hojas o rollos).
- **Blanks (Remeras y Tazas en blanco)** por talle y color.

Utiliza los botones rápidos `+1`, `-1` o `+10` para actualizar el inventario luego de cada tirada.

### Calculadora de Márgenes y Ganancia Neta
En el panel lateral derecho:
1. Ingresa el ancho y alto de la estampa en cm.
2. Ingresa la cantidad de prendas del pedido.
3. Ajusta el deslizador de **Margen de Ganancia**:
   - `60%`: Precios por mayor / revendedores.
   - `150%`: Estándar para pedidos medianos de empresas o eventos.
   - `250%`: Venta minorista por unidad.
4. El sistema te desglosa al instante:
   - Costo de insumos de impresión (film + tinta + poliamida).
   - Costo de la prenda en blanco.
   - Costo unitario total y precio sugerido de venta.
   - **Ganancia Neta Total del Lote** para tu taller.

---

## Tabla Maestra de Parámetros de Plancha Térmica

Guarda esta tabla cerca de tu termoestampadora como referencia rápida:

| Técnica | Sustrato / Material | Temperatura | Tiempo | Presión | Tipo de Pelado (Peel) | Segundo Planchado (Fijación) |
|---|---|---|---|---|---|---|
| **DTF Textil** | 100% Algodón | 160°C (320°F) | 12 - 15 seg | Media-Alta (4-5 bar) | **Frío Total (Cold Peel)** | 5 seg con teflón/siliconado mate |
| **DTF Textil** | Poliéster / Deportivo | 145°C - 150°C | 10 - 12 seg | Media (3-4 bar) | **Frío Total (Cold Peel)** | 5 seg con papel siliconado |
| **DTF Textil** | Jean / Denim / Cuero sintético | 165°C | 15 seg | Alta (5 bar) | **Tibio / Frío** | 5 seg con teflón |
| **Sublimación** | Remera Poliéster 100% / Spun | 200°C (392°F) | 40 - 50 seg | Media (3-4 bar) | **Caliente Inmediato** | No requiere |
| **Sublimación** | Taza Cerámica AAA | 195°C - 200°C | 180 - 200 seg | Media | **Caliente Inmediato** (enfriar en agua tibia) | No requiere |
| **Sublimación** | Mousepad / Neoprene | 195°C | 45 seg | Media-Baja | **Caliente Inmediato** | No requiere |
| **DTF UV** | Vidrio / Tazas / Madera / Metal | Sin calor | Frotado manual | Presión uniforme | **Despegue en ángulo de 45°** | Curado ambiente 24hs |

---

*Desarrollado para la comunidad de estampadores profesionales de DTF y Sublimación.*
