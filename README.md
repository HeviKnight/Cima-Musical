# 🤖 Cima Musical — Duelo 3x3

¡Bienvenido a **Cima Musical**! Un juego táctico arcade 1v1 en cuadrícula 3x3 ambientado en una distopía sintética donde cada robot compite por la tensión musical en duelos rápidos de alta intensidad.

---

## 🎮 Reglas y Mecánicas Canónicas

- **Tableros 3x3**: Cuadrículas independientes para cada contendiente. Todo es visible.
- **Objetivo**: El primer jugador en alcanzar **100 de tensión** gana.
- **Tensión por Kill**:
  - Pequeña (1 HP `♟`): **+8 de tensión**
  - Mediana (2 HP `🗼`): **+16 de tensión**
  - Titán (6 HP `👑`): **+50 de tensión**
  - *(Dañar sin destruir una unidad otorga 0 de tensión)*.
- **Ronda 0 (Inicial)**: Ambos jugadores despliegan obligatoriamente su **Titán (6 HP `👑`)** en su tablero.
- **Tirada de Dado (d6)**:
  - `1–3`: Pequeña (1 HP).
  - `4–5`: Mediana (2 HP).
  - `6`: **Habilidad del Titán** (si el Titán está vivo, activa el boost especial del personaje y sustituye la colocación; si ha muerto, invoca una unidad pequeña).
- **Colocación y Regla de Mejora**: Si el tablero está lleno (9 casillas ocupadas), la nueva unidad obtenida suma sus puntos de vida a una unidad existente.
- **Planificación de Acción**: En cada ronda se elige **Ataque (1 casilla, 1 de daño)** o **Habilidad Activa (consume cargas)**. No pueden suceder ambas cosas a la vez.
- **Resolución ("Mover Niega Efectos")**: Los efectos y ataques caen orgánicamente sobre casillas `(row, col)`. Si una unidad es reubicada antes de resolver, el efecto cae al vacío ("agua").

---

## 🤖 Roster de Sintéticos (6 Héroes)

1. **INCINERADOR**: *"Acumula chatarra y su horno la quema: el daño llega por goteo, por botón y por llama."*
   - Trait Horno (detona 1 daño AoE cada 3 chatarras), Pasiva Chatarrería, Activa [3] Ignición Total, Titán (6) Purga.
2. **SWARM (Horda de drones)**: *"Su enjambre de drones explota al morir: tu Titán fabrica más y tu activa los detona a todos."*
   - Trait Despliegue Rápido (dado 1 en ronda 1), Pasiva Autodestrucción (1 daño a enemigo al morir), Activa [2] Sacrificio de Drones, Titán (6) Replicador (crea 2 drones).
3. **CYBORG**: *"La tensión es tu arma, generas mucha tensión pasiva que hace aumentar tu daño."*
   - Pasiva Batería Humana (+1 tensión por aliado hasta +3), Activa [1] Finisher Cibernético (+1 daño por cada 20 tensión, 1-5 daño), Titán (6) Sobrecarga (+4 tensión).
4. **ROBOHAND**: *"La mano que coloca todo donde quiere."*
   - Pasiva Mano Protectora (da 1 escudo a aliado y lo traslada), Activa [3] Reubicación Forzada (mueve enemigo y le hace 1 daño, o 2 si bloqueado), Titán (6) Enroque Titánico (enroque con aliado y escudo a ambos).
5. **TALADRO**: *"Atacarle cuesta y nadie sabe dónde está nada."*
   - Pasiva Cobro de Bajas (+2 tensión al morir aliado), Activa [2] Intercambio Sísmico (intercambia posiciones aliadas), Titán (6) Nube de Polvo (invisibilidad para sus unidades).
6. **HOLO**: *"No puedes tocarla y, mientras lo intentas, te roba el show."*
   - Pasiva Refracción (desvía daño a otro aliado vivo 1 vez por ronda), Activa [1] Clon Ilusorio (clona tropa no titánica), Titán (6) Robo de Foco (drena 8 de tensión al rival).

---

## 🎹 Controles

- **Jugador 1**:
  - Casillas: `Q, W, E / A, S, D / Z, X, C`
  - Habilidad: Clic en botón `⚡ HABILIDAD` o doble pulsación `S`.
  - Avance de fase: Tecla **[ESPACIO]**.
- **Jugador 2**:
  - Casillas: `U, I, O / J, K, L / M, ,, .`
  - Habilidad: Clic en botón `⚡ HABILIDAD` o doble pulsación `K`.
  - Bot (vs IA): Control automático por IA heurística.

---

## 🛠️ Tecnologías

- JavaScript (ES Modules)
- Vite (Dev Server & Bundler)
- Vanilla CSS3 & Pixel Art Styling
- Web Audio API (música y SFX procedimentales)
