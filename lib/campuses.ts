export type Network = { id: string; name: string }

export const initialNetworks: Network[] = [
  { id: "multipliers", name: "Multipliers" },
  { id: "limitless", name: "Limitless" },
  { id: "catalyst", name: "Catalyst" },
  { id: "igniters", name: "Igniters" },
  { id: "lifegivers", name: "Lifegivers" },
]

export const campusesByNetwork: Record<string, string[]> = {
  multipliers: ["Hill City", "Bondo", "Diani", "Kisumu", "Kitengela", "Mombasa", "Kitale", "Mwangaza", "Multipliers"],
  limitless: ["Chuka", "Donholm", "Far East", "Kizazi", "Limitless", "Mashariki"],
  catalyst: ["Catalyst", "Kikuyu", "Lavington", "Madaraka", "Kiambio", "Mathare", "Downtown"],
  igniters: ["Connect", "Karen", "Igniters"],
  lifegivers: ["Lifegivers", "Bustani", "Nawiri", "Juja", "Kiambu Road", "Limuru", "Lifeway"],
}
