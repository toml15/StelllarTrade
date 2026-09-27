# Stellartrade - Galactic Rulebook & Codex

---

## 1. Game Components and System Elements

The core game is engineered for **3 to 4 commanders** (expandable to 5-6) and includes:

| Category | Component | Count | Specifications & Details |
| --- | --- | --- | --- |
| **System Grid** | Deep Space Boundary | 6 | Enclosing deep space frame featuring 9 Orbital Ports |
| | Celestial Bodies | 19 | 4 Arboreal Planets (Carbon), 4 Hydro Planets (Polymers), 4 Agri-Planets (Rations), 3 Silica Planets (Silicon), 3 Mineral Planets (Titanium), 1 Dead World (Void Corsair Base) |
| | Sensor Frequency Chips | 18 | Alpha designations A–R on reverse, scan frequencies 2–12 on face |
| | Orbital Ports | 9 | 4 Universal Ports (3:1), 5 Specialized Docks (2:1 for Carbon, Silicon, Polymers, Rations, Titanium) |
| **Commodities** | Resource Cards | 95 | 19 units each of Carbon, Silicon, Polymers, Rations, and Titanium |
| | Tech Modules | 25 | 14 Patrol Frigates, 6 Operations Modules (2 Hyperlane Expansion, 2 Quantum Synthesis, 2 Trade Embargo), 5 Colony Milestones |
| | Galactic Titles | 2 | 1 "Longest Trade Route", 1 "Fleet Supremacy" (2 Influence Points each) |
| **Fleet Assets** | Fleet Structures | 96 | Across 4 fleet colors (Red, Blue, White, Orange). Per fleet: 15 Hyperlanes, 5 Outposts, 4 Starbase Citadels |
| | Void Corsair | 1 | Neutral raider warship (starts in orbit above the Dead World) |
| **Sensors** | Sensor Array Dice | 2 | Standard six-sided frequency pulse dice (1–6) |

---

## 2. System Architecture & Topology

### Grid Geometry
The sector comprises 19 hexagonal planetary sectors arranged in a concentric layout with horizontal bands of **3 – 4 – 5 – 4 – 3**:
* Tier 1 (North): 3 planets
* Tier 2: 4 planets
* Tier 3 (Equatorial Core): 5 planets
* Tier 4: 4 planets
* Tier 5 (South): 3 planets

The deep space boundary coordinates maintain orbital positions and define the 9 orbital trading ports at peripheral intersections.

### Frequency Calibration
18 frequency chips (values 2 to 12, excluding 7) are distributed counter-clockwise in a inward spiral starting from an outer corner. The Dead World receives no frequency chip.
High-yield red frequencies (**6** and **8**) represent peak sensor resonances (5/36 probability) and cannot be placed directly adjacent to one another.

### The Void Corsair
The Void Corsair warship commences operations hovering in the orbit of the Dead World.

---

## 3. Orbital Spacing Rule

The **Orbital Spacing Rule** is an absolute physical constraint across all star systems:
* Every Outpost and Starbase Citadel must maintain a distance of at least **two Hyperlane segments** from every other Outpost or Starbase.
* Under no circumstances may an Outpost be constructed on the three immediate neighbor vertices of an existing installation, regardless of which fleet owns it.

---

## 4. System Founding Cycles

Before normal command operations commence, commanders establish starting outposts:
1. **Cycle 1 (Clockwise):** Each commander places 1 Outpost on any valid vertex obeying the Orbital Spacing Rule, plus 1 contiguous Hyperlane.
2. **Cycle 2 (Counter-Clockwise):** In reverse order, each commander places their 2nd Outpost plus 1 contiguous Hyperlane.
3. **Initial Cargo Harvest:** For each planetary sector bordering the *second* Outpost, the commander immediately draws 1 corresponding resource unit into their fleet cargo hold.

---

## 5. Active Command Cycle

Each commander's turn proceeds through structured command phases:

### Phase 1: Tech Module Deployment (Pre-Scan Option)
A commander may deploy 1 Patrol Frigate before scanning sensor frequencies (rolling dice).

### Phase 2: Sensor Pulse (Dice Roll)
The commander rolls the 2 sensor dice.

#### Frequency 2–6, 8–12: Planetary Resource Extraction
Every celestial planet bearing a matching frequency chip generates resources for all adjacent installations:
* **Outpost:** Yields 1 resource unit from the planet.
* **Starbase Citadel:** Yields 2 resource units from the planet.
* *Blockade Exception:* If the Void Corsair is stationed on that planet, **zero** resources are produced by that tile.

#### Frequency 7: Void Corsair Incursion
No planets produce resources. Instead:
1. **Cargo Hold Jettison:** Any commander holding **more than 7 cargo cards** must immediately jettison half of them (rounded down).
2. **Relocate Void Corsair:** The active commander moves the Void Corsair warship to any other celestial planet.
3. **Outpost Raid:** The active commander draws 1 covert resource card from a rival commander possessing an Outpost or Starbase on that blockaded planet.

---

### Phase 3: Trade & Commerce
The commander may negotiate trades in any sequence:

1. **Fleet-to-Fleet Commerce:** Propose trade offers with other commanders. Non-active commanders may only trade with the active commander.
2. **Deep Space Freight (Depot Trade):** Exchange 4 identical resources for 1 resource of choice from the Galactic Reserve (4:1 universal tariff).
3. **Orbital Ports:**
   * **Universal Port (3:1):** Outposts situated on a 3:1 orbital port may exchange any 3 identical resources for 1 resource of choice.
   * **Dedicated Dock (2:1):** Outposts situated on a specialized dock may exchange 2 of that specific resource for 1 resource of choice.
   * *Combinations:* Multi-resource balanced trades matching valid tariffs are supported.

---

### Phase 4: Fleet Construction & Tech Acquisition

Commanders may construct assets as long as materials are available in their hold:

| Asset | Construction Cost | Influence Points (IP) | Tactical Description |
| --- | --- | --- | --- |
| **Hyperlane** | 1 Carbon, 1 Silicon | 0 IP | Extends trade conduits across grid edges. Max 15 per fleet. |
| **Outpost** | 1 Carbon, 1 Silicon, 1 Polymer, 1 Ration | 1 IP | Deployed on valid orbital vertices. Extracts 1 resource on matching pulse. Max 5 per fleet. |
| **Starbase Citadel** | 2 Rations, 3 Titanium | 2 IP (+1 net) | Upgrades an existing Outpost. Extracts 2 resources on matching pulse. Max 4 per fleet. |
| **Tech Module** | 1 Polymer, 1 Ration, 1 Titanium | Variable | Draws the top card from the Tech Module deck. Held secretly. |

---

## 6. Tech Modules

* A commander may play at most **1 Tech Module per turn**, and cannot play a module on the same cycle it was acquired.
* **Patrol Frigate (14 in deck):** Moves the Void Corsair warship and raids 1 resource card from an adjacent rival.
* **Hyperlane Expansion (2 in deck):** Immediately deploy 2 free Hyperlanes adhering to placement rules.
* **Quantum Synthesis (2 in deck):** Draw 2 resources of choice from the Galactic Reserve.
* **Trade Embargo (2 in deck):** Declare 1 commodity – all rival commanders must surrender their entire stockpile of that commodity.
* **Colony Milestone (5 in deck):** Awards +1 Influence Point each. Kept hidden until victory can be declared.

---

## 7. Galactic Titles (2 Influence Points each)

### Longest Trade Route
* Conferred on the first commander to establish a continuous Hyperlane of at least **5 segments**.
* A rival commander only seizes this title by establishing a strictly longer route (e.g. 6 segments).
* Hyperlanes can be segmented or severed by rival Outposts built on open intersections!

### Fleet Supremacy
* Conferred on the first commander to deploy at least **3 Patrol Frigates**.
* A rival commander only seizes this title by strictly exceeding the current holder's frigate count (e.g. 4 frigates).

---

## 8. Galactic Victory

The game concludes immediately when a commander accumulates **10 or more Influence Points (IP)** on their turn:
$$\text{Influence Points} = \text{Outposts (1 ea)} + \text{Starbases (2 ea)} + \text{Longest Route (2)} + \text{Fleet Supremacy (2)} + \text{Colony Milestones (1 ea)}$$

The victor is crowned Supreme Ruler of the Stellar Sector!
