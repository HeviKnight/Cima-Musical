# Reglas y Mecánicas del Juego: Cima Musical (Duelo 3x3 — Roster y Reglas)

Este documento contiene las reglas canónicas y mecánicas vigentes del juego según el documento de diseño (PDF).

---

## 1. Concepto General y Tablero
- **Duelo 1v1**: Partidas cortas, ambos jugadores juegan a la vez.
- **Tablero 3x3**: Cada jugador tiene su tablero independiente de 9 casillas (`3x3`).
- **Visibilidad**: Todo es visible por defecto. La identidad vive en los sets de héroes.
- **Objetivo**: El primero en llegar a **100 de tensión** gana.

---

## 2. Unidades, Estadísticas (Daño/Vida) y Ganancia de Tensión
Cada personaje dispone de 3 tipos de unidades con estadísticas específicas `(daño / vida)`:

- **Tensión por Kill**:
  - **Pequeña**: +8 de tensión
  - **Mediana**: +16 de tensión
  - **Titán**: +50 de tensión
  *(Golpear sin matar otorga 0 tensión directa por kill).*

- **Tensión por Daño**:
  Cada unidad tiene estadísticas `(daño / vida)`. El daño genera ese número de tensión al final de la ronda.

- **Efecto Visual de Tensión**:
  Cada vez que algo añade tensión (daño por unidad al final de ronda, kills o habilidades), la unidad emisora se ilumina (`tension-source-active`) y se visualiza un efecto de **partículas cuadradas pixeladas** que se forman justo por encima de la unidad, levitan brevemente sobre ella y luego viajan de forma escalonada (no simultánea) hacia el sprite del héroe en el panel superior.

- **Escudo**: 1 de vida extra, independiente de la unidad, dura una ronda (caduca al final de la ronda).
- **Ataque**: 1 casilla, 1 de daño (salvo modificadores explícitos como el Finisher de Cyborg).

---

## 3. Tirada de Dados (d6)
- **1–3**: Invocación de unidad **Pequeña**.
- **4–5**: Invocación de unidad **Mediana**.
- **6**: El **Titán usa su habilidad** para acelerar el gameplan del personaje. En caso de no ser posible (titán muerto o no hay objetivo válido), añade **+1/+1 a la unidad más fuerte**. Si no hay unidades en tablero, invoca una unidad pequeña.

---

## 4. Colocación, Mejora y Comparación de Unidades
- **Colocación**: En cualquier casilla libre del tablero propio.
- **Tablero lleno (Mejora)**: Si el tablero está lleno (9 casillas ocupadas), la unidad obtenida **mejora** a una unidad ya colocada.
  - **Mejora**: Se suma la vida y el daño de la nueva unidad a la unidad seleccionada.
- **Unidad más fuerte / más débil**:
  - **Fórmula**: La suma de su ataque y vida `(atk + hp)`.
  - **Desempate**: En caso de empate en la suma, la que tenga mayor (o menor para más débil) ataque; si empatan en ataque, se decide aleatoriamente.

---

## 5. Ronda Inicial (Ronda 0)
- La primera ronda "0" es idéntica para todos: colocas tu **Titán** en una parte del tablero y luego juegas con normalidad.
  - **Incinerador**: Titán (0/6)
  - **Swarm**: Titán (0/6)
  - **Cyborg**: Titán (0/6)
  - **RoboHand**: Titán (0/5)
  - **Taladro**: Titán (0/6)
  - **Holo**: Titán (5/5) *(su daño se iguala a su vida)*

---

## 6. Orden de Ronda (Ambos Jugadores a la Vez)
1. **Tirada de dados (d6)**
2. **Planificación de colocación**: Dónde se coloca o a quién mejora.
3. **Planificación de acción**: Ataque (1 casilla) o Habilidad activa (no ambas cosas a la vez).
4. **Resolución y Animación**: Simultánea.
5. **Avance de Fases por Confirmación de Jugadores**: Cada jugador tiene un checkbox de "Listo" (`[ESPACIO]` para Jugador 1 y `[ENTER]` para Jugador 2). Ambos jugadores deben estar listos para que la fase avance.

---

## 7. Consecuencia de la Resolución: "Mover Niega Efectos"
- Los efectos caen sobre casillas `(row, col)`.
- Si una unidad se desplaza antes de resolver, los efectos planeados caen al vacío (agua / miss).

---

## 8. Kits de Personajes y Roster de Unidades

### 1. Incinerador
> *"Acumula chatarra para quemarla, dañando las unidades rivales."*
- **Keywords**: Chatarra = Unidad pequeña aliada.
- **Pasiva (Contador del Horno)**: Al final de tu turno, además tiene un contador de chatarra: cada chatarra consumida suma 1 al contador. Al llegar a 3 → 1 de daño a todas las unidades enemigas y el contador se resetea a 0 (acumulativo y sobrevive entre detonaciones). Genera 1 chatarra al final del turno si hay hueco.
- **Activa [3] (Calcinar)**: Consume TODA tu chatarra (cada una suma al contador del horno).
- **Unidades**:
  - **Titán (0/6)**: Consume hasta 2 chatarras (cada una suma al horno).
  - **Medio (2/2)**: Al morir, mejora 1 HP a una chatarra.
  - **Pequeño (0/1)**: Chatarra (no hace nada por sí sola).

### 2. Swarm (Dron Enjambre)
> *"Su enjambre de drones explota al morir: tu Titán fabrica más y tu activa los detona a todos."*
- **Keywords**: Dron = Unidades pequeñas y medianas.
- **Trait de equilibrio**: La primera ronda, siempre saldrá un 1 en el dado para poner una unidad pequeña.
- **Pasiva (Último aliento)**: Al morir un dron, hace 1 de daño a una unidad enemiga aleatoria.
- **Activa [2] (PEM)**: Sacrifica todos tus drones (pequeños y medianos).
- **Unidades**:
  - **Titán (0/6)**: Genera dos unidades pequeñas.
  - **Medio (0/2)**: Cada ronda, añade 1 de daño a un dron adyacente.
  - **Pequeño (1/1)**: Dron de combate básico.

### 3. Cyborg
> *"La tensión es tu arma, generas mucha tensión pasiva que hace aumentar tu daño."*
- **Pasiva (Coro del pueblo)**: Al final de tu turno, +1 de tensión por aliado vivo (máx +3).
- **Activa [1] (Bioimpacto)**: Ataca a un enemigo infligiendo 1 de daño más 1 de daño adicional por cada 20 de tensión que tengas.
- **Unidades**:
  - **Titán (0/6)**: Ganas 5 de tensión.
  - **Medio (1/2)**: Cada ronda, otorga escudo a una unidad adyacente.
  - **Pequeño (1/1)**: Si tiene unidades adyacentes, gana 1 de ataque.

### 4. El Brazo
> *"La mano que coloca todo donde quiere."*
- **Pasiva (Línea de montaje)**: Los ataques mueven a las unidades hacia una casilla superior; si no hay superior, la manda abajo del todo.
- **Activa [3] (Desplazar)**: Mueve 1 unidad enemiga a una casilla aleatoria libre y hazle 1 de daño. Si no se puede mover, hazle 2 de daño.
- **Unidades**:
  - **Titán (0/5)**: Intercambia la posición con otra unidad y les otorga a ambos 1 de ataque extra.
  - **Medio (0/2)**: Cada ronda que se mueve una unidad enemiga, gana 1 de ataque.
  - **Pequeño (1/1)**: Peón básico.

### 5. Taladro
> *"Excavar te rompe poco a poco, el Taladro ha hecho de esto algo útil."*
- **Pasiva (Voz de la experiencia)**: Cuando un aliado recibe daño, gana 1 de ataque extra.
- **Activa [2] (Terraformar)**: Hace 1 de daño a todas las unidades de ambos tableros.
- **Unidades**:
  - **Titán (0/6)**: Cura completamente a la unidad con menos vida.
  - **Medio (3/2)**: Al morir, otorga 1 de daño a una unidad aliada aleatoria.
  - **Pequeño (0/3)**: Al morir, realiza 1 de daño en su casilla homóloga contraria.

### 6. Holo
> *"Sabes que es lo mejor de un holograma? Que no lo puedes tocar."*
- **Pasiva (Proyección Vocal)**: Otorga escudo a una unidad aleatoria.
- **Activa [1] (Prestigio)**: Convierte los escudos en +1/+1 de daño y vida.
- **Unidades**:
  - **Titán (0/5)**: Su daño se iguala a su vida (inicia en 5/5).
  - **Medio (1/2)**: Cada vez que el enemigo recibe daño, esta unidad recibe un escudo.
  - **Pequeño (0/1)**: Si fuese a recibir un escudo, en su lugar, consigue 1 de daño extra.
