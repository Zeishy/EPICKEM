// Point d'entrée provisoire : la population fictive et le seed de démo arrivent avec #48.
import { bracketSize } from "@epickem/engine";

const arg = process.argv[2] ?? "8";
const result = bracketSize(Number(arg));

if (result.ok) {
  const { size, byes } = result.value;
  console.log(`${arg} participants → tableau de ${size}, ${byes} exempt(s)`);
} else {
  console.error(`Nombre de participants invalide : ${arg} (${result.error})`);
  process.exitCode = 1;
}
